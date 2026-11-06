import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";
    const branch = searchParams.get("branch") || "";
    const qualification = searchParams.get("qualification") || "";
    const minCgpa = parseFloat(searchParams.get("minCgpa") || "0");
    const companyId = searchParams.get("companyId") || "";
    const jobRoleId = searchParams.get("jobRoleId") || "";
    const eligibilityStatus = searchParams.get("eligibilityStatus") || ""; // "Eligible", "Partially Eligible", "Not Eligible"
    const registrationStatus = searchParams.get("registrationStatus") || "";
    const sortBy = searchParams.get("sortBy") || "submittedAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "15", 10);

    // Build Prisma query
    const where: any = {};

    if (registrationStatus) {
      where.status = registrationStatus;
    }

    if (branch) {
      where.student = { ...(where.student || {}), branch };
    }

    if (qualification) {
      where.student = { ...(where.student || {}), qualification };
    }

    if (minCgpa > 0) {
      where.student = { ...(where.student || {}), cgpa: { gte: minCgpa } };
    }

    if (search) {
      where.OR = [
        { registrationId: { contains: search } },
        { student: { name: { contains: search } } },
        { student: { email: { contains: search } } },
        { student: { phone: { contains: search } } },
      ];
    }

    // Company & Job Role specific shortlist filter
    if (companyId || jobRoleId || eligibilityStatus) {
      const eligibilityFilter: any = {};
      if (companyId) eligibilityFilter.companyId = companyId;
      if (jobRoleId) eligibilityFilter.jobRoleId = jobRoleId;
      if (eligibilityStatus) eligibilityFilter.status = eligibilityStatus;

      where.student = {
        ...(where.student || {}),
        eligibilityResults: {
          some: eligibilityFilter,
        },
      };
    }

    // Sort order
    let orderBy: any = {};
    if (sortBy === "cgpa") {
      orderBy = { student: { cgpa: sortOrder } };
    } else if (sortBy === "name") {
      orderBy = { student: { name: sortOrder } };
    } else {
      orderBy = { submittedAt: sortOrder };
    }

    const [total, registrations] = await Promise.all([
      prisma.placementRegistration.count({ where }),
      prisma.placementRegistration.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
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
      }),
    ]);

    // Format output
    const items = registrations.map((r) => {
      const eligibleCompanies = r.student.eligibilityResults
        .filter((e) => e.status === "Eligible")
        .map((e) => `${e.company.name} (${e.jobRole.roleName})`);

      const partiallyEligible = r.student.eligibilityResults
        .filter((e) => e.status === "Partially Eligible")
        .map((e) => `${e.company.name} (${e.jobRole.roleName})`);

      return {
        id: r.id,
        registrationId: r.registrationId,
        studentId: r.student.id,
        studentName: r.student.name,
        phone: r.student.phone,
        email: r.student.email,
        gender: r.student.gender,
        branch: r.student.branch,
        qualification: r.student.qualification,
        graduationYear: r.student.graduationYear,
        cgpa: r.student.cgpa,
        backlogs: r.student.backlogs,
        resumeUrl: r.student.resumeUrl,
        registrationDate: r.submittedAt,
        status: r.status,
        driveName: r.placementDrive.name,
        eligibleCompanies,
        eligibleCount: eligibleCompanies.length,
        partiallyEligibleCount: partiallyEligible.length,
        allEligibilityResults: r.student.eligibilityResults.map((er) => ({
          companyId: er.companyId,
          companyName: er.company.name,
          jobRoleId: er.jobRoleId,
          roleName: er.jobRole.roleName,
          status: er.status,
          score: er.score,
          explanation: er.explanation,
        })),
      };
    });

    // Shortlist count if company or role filter applied
    let shortlistCount: number | null = null;
    if (companyId || jobRoleId) {
      shortlistCount = total;
    }

    return NextResponse.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
      shortlistCount,
    });
  } catch (error: any) {
    console.error("Fetch admin students error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve student registrations." },
      { status: 500 }
    );
  }
}
