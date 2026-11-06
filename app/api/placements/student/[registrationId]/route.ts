import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { registrationId: string } }
) {
  try {
    const { registrationId } = params;

    const registration = await prisma.placementRegistration.findUnique({
      where: { registrationId },
      include: {
        student: {
          include: {
            resumeAnalyses: {
              orderBy: { analyzedAt: "desc" },
              take: 1,
            },
            eligibilityResults: {
              include: {
                company: true,
                jobRole: true,
              },
            },
          },
        },
        placementDrive: {
          include: {
            companies: {
              include: {
                company: {
                  include: {
                    jobRoles: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!registration) {
      return NextResponse.json(
        { error: `Registration with ID "${registrationId}" not found.` },
        { status: 404 }
      );
    }

    // Organize eligibility results into Eligible, Partially Eligible, and Not Eligible
    const eligibleResults = registration.student.eligibilityResults.filter(
      (r) => r.status === "Eligible"
    );
    const partiallyEligibleResults = registration.student.eligibilityResults.filter(
      (r) => r.status === "Partially Eligible"
    );
    const notEligibleResults = registration.student.eligibilityResults.filter(
      (r) => r.status === "Not Eligible"
    );

    return NextResponse.json({
      success: true,
      registration: {
        registrationId: registration.registrationId,
        status: registration.status,
        submittedAt: registration.submittedAt,
        student: {
          id: registration.student.id,
          name: registration.student.name,
          email: registration.student.email,
          phone: registration.student.phone,
          gender: registration.student.gender,
          qualification: registration.student.qualification,
          branch: registration.student.branch,
          graduationYear: registration.student.graduationYear,
          cgpa: registration.student.cgpa,
          backlogs: registration.student.backlogs,
          technicalSkills: JSON.parse(registration.student.technicalSkills || "[]"),
          resumeUrl: registration.student.resumeUrl,
        },
        drive: {
          id: registration.placementDrive.id,
          name: registration.placementDrive.name,
          driveDate: registration.placementDrive.driveDate,
          registrationDeadline: registration.placementDrive.registrationDeadline,
          status: registration.placementDrive.status,
          totalCompanies: registration.placementDrive.companies.length,
        },
        resumeAnalysis: registration.student.resumeAnalyses[0] || null,
        eligibilitySummary: {
          eligibleCount: eligibleResults.length,
          partiallyEligibleCount: partiallyEligibleResults.length,
          notEligibleCount: notEligibleResults.length,
          eligibleResults,
          partiallyEligibleResults,
          notEligibleResults,
        },
      },
    });
  } catch (error: any) {
    console.error("Fetch student registration error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve registration details" },
      { status: 500 }
    );
  }
}
