import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const {
      companyId,
      roleName,
      description,
      minimumCgpa = 7.0,
      qualifications = ["B.Tech", "B.E."],
      branches = ["CSE", "IT"],
      graduationYears = ["2026", "2027"],
      requiredSkills = ["Programming"],
      preferredSkills = [],
      backlogRequirement = 0,
      experienceRequirement = "Fresher",
      salaryPackage,
      applicationDeadline,
      driveDate,
      active = true,
    } = body;

    if (!companyId || !roleName) {
      return NextResponse.json({ error: "Company ID and Role Name are required." }, { status: 400 });
    }

    const jobRole = await prisma.jobRole.create({
      data: {
        companyId,
        roleName,
        description,
        minimumCgpa: parseFloat(String(minimumCgpa)),
        qualifications: typeof qualifications === "string" ? qualifications : JSON.stringify(qualifications),
        branches: typeof branches === "string" ? branches : JSON.stringify(branches),
        graduationYears: typeof graduationYears === "string" ? graduationYears : JSON.stringify(graduationYears),
        requiredSkills: typeof requiredSkills === "string" ? requiredSkills : JSON.stringify(requiredSkills),
        preferredSkills: typeof preferredSkills === "string" ? preferredSkills : JSON.stringify(preferredSkills),
        backlogRequirement: parseInt(String(backlogRequirement), 10),
        experienceRequirement,
        salaryPackage,
        applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
        driveDate: driveDate ? new Date(driveDate) : null,
        active: Boolean(active),
      },
    });

    return NextResponse.json({ success: true, jobRole }, { status: 201 });
  } catch (error: any) {
    console.error("Create job role error:", error);
    return NextResponse.json({ error: "Failed to create job role" }, { status: 500 });
  }
}
