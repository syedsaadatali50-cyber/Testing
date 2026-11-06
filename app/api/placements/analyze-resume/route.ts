import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import {
  extractTextFromResume,
  analyzeResumeWithAI,
  compareStudentWithResume,
} from "@/lib/resume-parser";
import { evaluateAllDriveRoles } from "@/lib/eligibility-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    const name = (formData.get("name") as string) || "";
    const phone = (formData.get("phone") as string) || "";
    const email = (formData.get("email") as string) || "";
    const gender = (formData.get("gender") as string) || "";
    const qualification = (formData.get("qualification") as string) || "";
    // Extract fields from form (backlogs, branch, graduation year, skills are optional/extracted from resume)
    const branch = (formData.get("branch") as string) || "";
    const graduationYearStr = (formData.get("graduationYear") as string) || "";
    const cgpaStr = (formData.get("cgpa") as string) || "";
    const enteredCgpa = cgpaStr ? parseFloat(cgpaStr) : undefined;
    const backlogsStr = (formData.get("backlogs") as string) || "";
    const technicalSkillsRaw = (formData.get("technicalSkills") as string) || "[]";
    const driveId = (formData.get("driveId") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "Please upload your resume file." }, { status: 400 });
    }

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    const isValidExt = ["pdf", "doc", "docx"].includes(fileExt || "");

    if (!isValidExt && !validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file format. Only PDF, DOC, and DOCX resumes are supported." },
        { status: 400 }
      );
    }

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Resume file size exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    // Read buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file locally in public/uploads/resumes
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "resumes");
    await mkdir(uploadsDir, { recursive: true });

    const safeFileName = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const filePath = path.join(uploadsDir, safeFileName);
    await writeFile(filePath, buffer);
    const resumeUrl = `/uploads/resumes/${safeFileName}`;

    // 1. Text extraction
    const rawText = await extractTextFromResume(buffer, file.type, file.name);

    // 2. AI Resume Analysis
    const parsedData = await analyzeResumeWithAI(rawText);

    // Branch, graduation year, CGPA, backlogs, skills extracted directly from resume!
    const effectiveBranch = branch || parsedData.branch || "CSE";
    const effectiveGradYear = graduationYearStr ? parseInt(graduationYearStr, 10) : (parsedData.graduationYear || 2026);
    const effectiveBacklogs = backlogsStr !== "" ? parseInt(backlogsStr, 10) : (parsedData.backlogs || 0);
    const effectiveCgpa = enteredCgpa && !isNaN(enteredCgpa) && enteredCgpa > 0
      ? enteredCgpa
      : (parsedData.cgpa || 7.5);

    // Parse technical skills
    let enteredSkills: string[] = [];
    try {
      enteredSkills = JSON.parse(technicalSkillsRaw);
    } catch {
      enteredSkills = technicalSkillsRaw ? technicalSkillsRaw.split(",").map((s) => s.trim()).filter(Boolean) : [];
    }

    // Combine skills (primarily extracted from resume)
    const combinedSkills = Array.from(
      new Set([
        ...enteredSkills,
        ...parsedData.technicalSkills,
        ...parsedData.programmingLanguages,
        ...parsedData.frameworks,
        ...parsedData.toolsAndDatabases,
      ])
    );

    // 3. Compare student entered data with resume for mismatch warnings (only if entered)
    const mismatchWarnings = compareStudentWithResume(
      {
        name,
        qualification,
        branch: branch || undefined,
        graduationYear: graduationYearStr ? parseInt(graduationYearStr, 10) : undefined,
        cgpa: enteredCgpa,
        technicalSkills: enteredSkills.length > 0 ? enteredSkills : undefined,
      },
      parsedData
    );

    // 4. Fetch placement drive and active companies & job roles
    let activeDrive = null;
    if (driveId) {
      activeDrive = await prisma.placementDrive.findUnique({
        where: { id: driveId },
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
      });
    }

    if (!activeDrive) {
      activeDrive = await prisma.placementDrive.findFirst({
        where: { status: "Active" },
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
        orderBy: { createdAt: "desc" },
      });
    }

    if (!activeDrive) {
      return NextResponse.json({
        resumeUrl,
        parsedData,
        mismatchWarnings,
        eligibility: {
          eligibleRoles: [],
          partiallyEligibleRoles: [],
          notEligibleRoles: [],
          totalChecked: 0,
        },
        message: "No active placement drive currently scheduled.",
      });
    }

    // Collect all job roles for active companies in this drive
    const allRoles: any[] = [];
    for (const driveComp of activeDrive.companies) {
      const comp = driveComp.company;
      if (comp.active && comp.status === "Active") {
        for (const role of comp.jobRoles) {
          if (role.active) {
            allRoles.push({
              ...role,
              company: {
                id: comp.id,
                name: comp.name,
                logo: comp.logo,
                description: comp.description,
                active: comp.active,
                status: comp.status,
              },
            });
          }
        }
      }
    }

    // 5. Evaluate eligibility strictly rule-based for mandatory + AI for skills
    const eligibilityResults = evaluateAllDriveRoles(
      {
        name,
        qualification,
        branch: effectiveBranch,
        graduationYear: effectiveGradYear,
        cgpa: effectiveCgpa,
        backlogs: effectiveBacklogs,
        skills: combinedSkills,
      },
      allRoles
    );

    return NextResponse.json({
      success: true,
      resumeUrl,
      fileName: file.name,
      fileSize: file.size,
      effectiveCgpa,
      parsedData: {
        ...parsedData,
        cgpa: effectiveCgpa,
      },
      combinedSkills,
      mismatchWarnings,
      eligibility: eligibilityResults,
      drive: {
        id: activeDrive.id,
        name: activeDrive.name,
        driveDate: activeDrive.driveDate,
        registrationDeadline: activeDrive.registrationDeadline,
      },
    });
  } catch (error: any) {
    console.error("Resume analysis error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze resume and evaluate eligibility." },
      { status: 500 }
    );
  }
}
