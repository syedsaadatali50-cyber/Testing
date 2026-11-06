import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const body = await req.json();
    const {
      roleName,
      description,
      minimumCgpa,
      qualifications,
      branches,
      graduationYears,
      requiredSkills,
      preferredSkills,
      backlogRequirement,
      experienceRequirement,
      salaryPackage,
      active,
    } = body;

    const updated = await prisma.jobRole.update({
      where: { id: params.id },
      data: {
        roleName,
        description,
        minimumCgpa: minimumCgpa !== undefined ? parseFloat(String(minimumCgpa)) : undefined,
        qualifications: qualifications !== undefined ? (typeof qualifications === "string" ? qualifications : JSON.stringify(qualifications)) : undefined,
        branches: branches !== undefined ? (typeof branches === "string" ? branches : JSON.stringify(branches)) : undefined,
        graduationYears: graduationYears !== undefined ? (typeof graduationYears === "string" ? graduationYears : JSON.stringify(graduationYears)) : undefined,
        requiredSkills: requiredSkills !== undefined ? (typeof requiredSkills === "string" ? requiredSkills : JSON.stringify(requiredSkills)) : undefined,
        preferredSkills: preferredSkills !== undefined ? (typeof preferredSkills === "string" ? preferredSkills : JSON.stringify(preferredSkills)) : undefined,
        backlogRequirement: backlogRequirement !== undefined ? parseInt(String(backlogRequirement), 10) : undefined,
        experienceRequirement,
        salaryPackage,
        active: active !== undefined ? Boolean(active) : undefined,
      },
    });

    return NextResponse.json({ success: true, jobRole: updated });
  } catch (error: any) {
    console.error("Update job role error:", error);
    return NextResponse.json({ error: "Failed to update job role" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    await prisma.jobRole.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Job role deleted successfully" });
  } catch (error: any) {
    console.error("Delete job role error:", error);
    return NextResponse.json({ error: "Failed to delete job role" }, { status: 500 });
  }
}
