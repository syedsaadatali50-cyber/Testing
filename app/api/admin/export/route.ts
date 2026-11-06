import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import * as XLSX from "xlsx";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("companyId") || "";
    const jobRoleId = searchParams.get("jobRoleId") || "";
    const eligibilityStatus = searchParams.get("eligibilityStatus") || "";
    const format = searchParams.get("format") || "xlsx"; // "xlsx" or "csv"

    const where: any = {};
    if (companyId || jobRoleId || eligibilityStatus) {
      const eligibilityFilter: any = {};
      if (companyId) eligibilityFilter.companyId = companyId;
      if (jobRoleId) eligibilityFilter.jobRoleId = jobRoleId;
      if (eligibilityStatus) eligibilityFilter.status = eligibilityStatus;

      where.student = {
        eligibilityResults: {
          some: eligibilityFilter,
        },
      };
    }

    const registrations = await prisma.placementRegistration.findMany({
      where,
      orderBy: { submittedAt: "desc" },
      include: {
        student: {
          include: {
            eligibilityResults: {
              include: {
                company: true,
                jobRole: true,
              },
            },
          },
        },
        placementDrive: true,
      },
    });

    const exportRows = registrations.map((r) => {
      const eligibleCompanies = r.student.eligibilityResults
        .filter((e) => e.status === "Eligible")
        .map((e) => `${e.company.name} (${e.jobRole.roleName})`)
        .join("; ");

      return {
        "Registration ID": r.registrationId,
        "Student Name": r.student.name,
        "Email Address": r.student.email,
        "Phone Number": r.student.phone,
        "Gender": r.student.gender,
        "Qualification": r.student.qualification,
        "Branch": r.student.branch,
        "Graduation Year": r.student.graduationYear,
        "CGPA": r.student.cgpa,
        "Backlogs": r.student.backlogs,
        "Eligible Companies": eligibleCompanies,
        "Registration Date": new Date(r.submittedAt).toLocaleDateString(),
        "Status": r.status,
        "Placement Drive": r.placementDrive.name,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Placement Registrations");

    if (format === "csv") {
      const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
      return new NextResponse(csvOutput, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="placement_registrations_${Date.now()}.csv"`,
        },
      });
    }

    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="placement_registrations_${Date.now()}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Failed to export data" }, { status: 500 });
  }
}
