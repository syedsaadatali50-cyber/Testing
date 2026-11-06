import { PrismaClient } from "@prisma/client";
import { generateRegistrationId } from "../lib/id-generator";

const prisma = new PrismaClient();

async function testApiDataFlow() {
  console.log("=== TESTING COMPLETE REGISTRATION & SHORTLIST DATA FLOW ===");

  const drive = await prisma.placementDrive.findFirst({
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
  });

  if (!drive) throw new Error("No active drive found!");

  // Create a realistic sample student
  const studentEmail = "rahul.sharma@college.edu";
  const student = await prisma.student.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      name: "Rahul Sharma",
      phone: "+91 9876543210",
      email: studentEmail,
      gender: "Male",
      qualification: "B.Tech",
      branch: "CSE",
      graduationYear: 2026,
      cgpa: 8.2,
      backlogs: 0,
      technicalSkills: JSON.stringify(["Python", "DSA", "Java", "Programming", "SQL", "React"]),
      resumeUrl: "/uploads/resumes/sample-resume.pdf",
    },
  });

  const regId = await generateRegistrationId(2026);
  const reg = await prisma.placementRegistration.upsert({
    where: {
      studentId_placementDriveId: {
        studentId: student.id,
        placementDriveId: drive.id,
      },
    },
    update: {},
    create: {
      studentId: student.id,
      placementDriveId: drive.id,
      registrationId: regId,
      status: "Registered",
      confirmed: true,
    },
  });
  console.log(`✓ Created test student registration: ${reg.registrationId}`);

  // Add eligibility results for TCS (Software Developer)
  const tcsRole = drive.companies.find((c) => c.company.name === "TCS")?.company.jobRoles[0];
  if (tcsRole) {
    await prisma.eligibilityResult.upsert({
      where: {
        studentId_placementDriveId_jobRoleId: {
          studentId: student.id,
          placementDriveId: drive.id,
          jobRoleId: tcsRole.id,
        },
      },
      update: {},
      create: {
        studentId: student.id,
        placementDriveId: drive.id,
        companyId: tcsRole.companyId,
        jobRoleId: tcsRole.id,
        status: "Eligible",
        score: 92,
        matchedCriteria: JSON.stringify([
          "B.Tech CSE",
          "CGPA 8.2 meets 7.0 minimum",
          "Graduation year 2026 matches",
          "Programming & DSA detected",
          "No backlog restriction issue",
        ]),
        missingCriteria: JSON.stringify([]),
        explanation: "Fully eligible for TCS Software Developer.",
      },
    });
    console.log(`✓ Seeded eligibility for ${tcsRole.roleName} at TCS: Status = Eligible (92%)`);
  }

  // Verify Admin Shortlist Filter query
  const tcsShortlist = await prisma.placementRegistration.count({
    where: {
      placementDriveId: drive.id,
      student: {
        eligibilityResults: {
          some: {
            companyId: tcsRole?.companyId,
            status: "Eligible",
          },
        },
      },
    },
  });
  console.log(`✓ Admin Shortlist Query: Found ${tcsShortlist} eligible student(s) for TCS!`);

  console.log("=== DATA FLOW VERIFICATION COMPLETE ===");
}

testApiDataFlow()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
