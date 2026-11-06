import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateRegistrationId } from "@/lib/id-generator";
import { saveRegistrationToExcel } from "@/lib/excel-storage";
import {
  calculateInterviewSchedule,
  sendRegistrationConfirmationEmail,
} from "@/lib/email-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      phone,
      email,
      gender = "Male",
      qualification,
      branch,
      graduationYear,
      cgpa,
      backlogs,
      technicalSkills = [],
      resumeUrl,
      driveId,
      parsedResumeData,
      eligibilityResults,
      selectedRoles = [], // User's choice of selected companies/roles
      mismatchWarnings = [],
      confirmed = true,
    } = body;

    // Validate only essential fields (branch, grad year, cgpa, skills, backlogs come from resume)
    if (!name || !email || !phone || !qualification || !resumeUrl) {
      return NextResponse.json(
        { error: "Please fill all required personal details and upload your resume." },
        { status: 400 }
      );
    }

    if (!confirmed) {
      return NextResponse.json(
        { error: "You must confirm that the information provided is correct." },
        { status: 400 }
      );
    }

    // 1. Get active drive
    let targetDriveId = driveId;
    let activeDrive = null;
    if (targetDriveId) {
      activeDrive = await prisma.placementDrive.findUnique({
        where: { id: targetDriveId },
      });
    }

    if (!activeDrive) {
      activeDrive = await prisma.placementDrive.findFirst({
        where: { status: "Active" },
        orderBy: { createdAt: "desc" },
      });
      if (!activeDrive) {
        return NextResponse.json(
          { error: "No active placement drive found for registration." },
          { status: 400 }
        );
      }
      targetDriveId = activeDrive.id;
    }

    // Check if student already registered for this drive
    const existingStudent = await prisma.student.findUnique({
      where: { email },
      include: {
        registrations: {
          where: { placementDriveId: targetDriveId },
        },
      },
    });

    if (existingStudent && existingStudent.registrations.length > 0) {
      return NextResponse.json(
        {
          error: `You have already registered for this placement drive with registration ID: ${existingStudent.registrations[0].registrationId}`,
          registrationId: existingStudent.registrations[0].registrationId,
        },
        { status: 409 }
      );
    }

    // Determine effective values (from resume if not in form)
    const effectiveBranch = branch || parsedResumeData?.branch || "CSE";
    const effectiveGradYear = graduationYear
      ? parseInt(String(graduationYear), 10)
      : parsedResumeData?.graduationYear || 2026;
    const effectiveBacklogs =
      backlogs !== undefined && backlogs !== null && backlogs !== ""
        ? parseInt(String(backlogs), 10)
        : parsedResumeData?.backlogs || 0;
    const effectiveCgpa =
      cgpa !== undefined && cgpa !== null && cgpa !== ""
        ? parseFloat(String(cgpa))
        : (parsedResumeData?.cgpa ? parseFloat(String(parsedResumeData.cgpa)) : 7.5);
    const effectiveSkills =
      technicalSkills && technicalSkills.length > 0
        ? technicalSkills
        : parsedResumeData?.technicalSkills || ["Programming"];

    // 2. Create or update Student record
    const student = await prisma.student.upsert({
      where: { email },
      update: {
        name,
        phone,
        gender,
        qualification,
        branch: effectiveBranch,
        graduationYear: effectiveGradYear,
        cgpa: effectiveCgpa,
        backlogs: effectiveBacklogs,
        technicalSkills: JSON.stringify(effectiveSkills),
        resumeUrl,
      },
      create: {
        name,
        phone,
        email,
        gender,
        qualification,
        branch: effectiveBranch,
        graduationYear: effectiveGradYear,
        cgpa: effectiveCgpa,
        backlogs: effectiveBacklogs,
        technicalSkills: JSON.stringify(effectiveSkills),
        resumeUrl,
      },
    });

    // 3. Generate unique registration ID (e.g. PD-2026-00001)
    const registrationId = await generateRegistrationId(new Date().getFullYear());

    // 4. Create PlacementRegistration
    const registration = await prisma.placementRegistration.create({
      data: {
        studentId: student.id,
        placementDriveId: targetDriveId,
        registrationId,
        status: "Registered",
        confirmed: true,
      },
    });

    // 5. Save ResumeAnalysis if provided
    if (parsedResumeData) {
      await prisma.resumeAnalysis.create({
        data: {
          studentId: student.id,
          extractedName: parsedResumeData.name || null,
          extractedEducation: JSON.stringify(parsedResumeData.education || []),
          extractedDegree: parsedResumeData.degree || null,
          extractedBranch: parsedResumeData.branch || null,
          extractedGradYear: parsedResumeData.graduationYear || null,
          extractedCgpa: parsedResumeData.cgpa || null,
          extractedSkills: JSON.stringify(parsedResumeData.technicalSkills || []),
          extractedLanguages: JSON.stringify(parsedResumeData.programmingLanguages || []),
          extractedFrameworks: JSON.stringify(parsedResumeData.frameworks || []),
          extractedCertifications: JSON.stringify(parsedResumeData.certifications || []),
          extractedProjects: JSON.stringify(parsedResumeData.projects || []),
          extractedExperience: JSON.stringify([
            ...(parsedResumeData.internships || []),
            ...(parsedResumeData.workExperience || []),
          ]),
          extractedAchievements: JSON.stringify(parsedResumeData.achievements || []),
          rawText: parsedResumeData.rawText || "",
          mismatchWarnings: JSON.stringify(mismatchWarnings || []),
        },
      });
    }

    // 6. Save EligibilityResult records
    if (eligibilityResults) {
      const allResults = [
        ...(eligibilityResults.eligibleRoles || []),
        ...(eligibilityResults.partiallyEligibleRoles || []),
        ...(eligibilityResults.notEligibleRoles || []),
      ];

      for (const res of allResults) {
        await prisma.eligibilityResult.upsert({
          where: {
            studentId_placementDriveId_jobRoleId: {
              studentId: student.id,
              placementDriveId: targetDriveId,
              jobRoleId: res.jobRoleId,
            },
          },
          update: {
            status: res.status,
            score: res.score,
            matchedCriteria: JSON.stringify(res.matchedCriteria || []),
            missingCriteria: JSON.stringify(res.missingCriteria || []),
            explanation: res.explanation || "",
          },
          create: {
            studentId: student.id,
            placementDriveId: targetDriveId,
            companyId: res.companyId,
            jobRoleId: res.jobRoleId,
            status: res.status,
            score: res.score,
            matchedCriteria: JSON.stringify(res.matchedCriteria || []),
            missingCriteria: JSON.stringify(res.missingCriteria || []),
            explanation: res.explanation || "",
          },
        });
      }
    }

    // 7. Calculate interview schedule based on drive date
    const interviewSchedule = calculateInterviewSchedule(activeDrive.driveDate);

    // Selected companies formatting (User's choice)
    const selectedCompaniesList: string[] = Array.isArray(selectedRoles) && selectedRoles.length > 0
      ? selectedRoles.map((r: any) =>
          typeof r === "string" ? r : `${r.companyName || r.company} - ${r.roleName || r.role}`
        )
      : (eligibilityResults?.eligibleRoles || []).map(
          (r: any) => `${r.companyName} - ${r.roleName}`
        );

    const allEligibleCompaniesList: string[] = (eligibilityResults?.eligibleRoles || []).map(
      (r: any) => `${r.companyName} - ${r.roleName}`
    );

    // 8. Send Automatic Email Confirmation to Student
    await sendRegistrationConfirmationEmail({
      toEmail: email,
      studentName: name,
      registrationId,
      selectedCompanies: selectedCompaniesList,
      schedule: interviewSchedule,
      placementDriveName: activeDrive.name,
    });

    // 9. Persist Registration to Master Excel Sheet on disk
    await saveRegistrationToExcel({
      registrationId,
      registrationDate: new Date().toLocaleString(),
      studentName: name,
      email,
      phone,
      gender,
      qualification,
      branch: effectiveBranch,
      graduationYear: effectiveGradYear,
      cgpa: effectiveCgpa,
      backlogs: effectiveBacklogs,
      selectedCompanies: selectedCompaniesList.join("; "),
      allEligibleCompanies: allEligibleCompaniesList.join("; "),
      technicalSkills: Array.isArray(effectiveSkills) ? effectiveSkills.join(", ") : String(effectiveSkills),
      resumeUrl,
      interviewSchedule: `${interviewSchedule.dayAndDate} at ${interviewSchedule.time}`,
      interviewVenue: interviewSchedule.venue,
      status: "Registered",
      placementDrive: activeDrive.name,
    });

    return NextResponse.json({
      success: true,
      message: "Your placement drive registration has been successfully submitted.",
      registrationId,
      studentId: student.id,
      registration,
      interviewSchedule,
      selectedCompanies: selectedCompaniesList,
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to submit placement registration." },
      { status: 500 }
    );
  }
}
