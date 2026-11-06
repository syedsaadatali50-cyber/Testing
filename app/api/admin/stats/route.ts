import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const [
      totalStudents,
      totalRegistrations,
      totalResumes,
      totalCompanies,
      totalJobRoles,
      activeDrives,
      recentRegistrations,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.placementRegistration.count(),
      prisma.resumeAnalysis.count(),
      prisma.company.count({ where: { active: true } }),
      prisma.jobRole.count({ where: { active: true } }),
      prisma.placementDrive.count({ where: { status: "Active" } }),
      prisma.placementRegistration.findMany({
        take: 8,
        orderBy: { submittedAt: "desc" },
        include: {
          student: true,
          placementDrive: true,
        },
      }),
    ]);

    // Count students who are eligible for at least 1 job role
    const eligibleStudentIds = await prisma.eligibilityResult.findMany({
      where: { status: "Eligible" },
      select: { studentId: true },
      distinct: ["studentId"],
    });

    const totalEligibleStudents = eligibleStudentIds.length;

    // Branch breakdown
    const students = await prisma.student.findMany({
      select: { branch: true },
    });
    const branchCounts: Record<string, number> = {};
    for (const s of students) {
      branchCounts[s.branch] = (branchCounts[s.branch] || 0) + 1;
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalRegisteredStudents: totalRegistrations,
        totalUniqueStudents: totalStudents,
        totalResumes,
        totalEligibleStudents,
        totalCompanies,
        totalJobRoles,
        activeDrives,
        branchDistribution: branchCounts,
        recentRegistrations,
      },
    });
  } catch (error: any) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to load admin placement statistics." },
      { status: 500 }
    );
  }
}
