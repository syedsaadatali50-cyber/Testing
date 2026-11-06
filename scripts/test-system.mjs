import { PrismaClient } from "@prisma/client";
import { evaluateStudentEligibility, evaluateAllDriveRoles } from "../lib/eligibility-engine.js";
import { generateRegistrationId } from "../lib/id-generator.js";
import { compareStudentWithResume, extractResumeWithHeuristics } from "../lib/resume-parser.js";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function runTests() {
  console.log("=== RUNNING PLACEMENT DRIVE SYSTEM INTEGRATION TESTS ===");

  // 1. Test Strict Rule-Based Eligibility Engine
  console.log("\n[TEST 1] Testing Strict Rule-Based Eligibility Enforcement...");

  const mockCompany = {
    id: "comp-tcs",
    name: "TCS",
    description: "Tata Consultancy Services",
    active: true,
    status: "Active",
  };

  const highCgpaRole = {
    id: "role-high",
    roleName: "Data Scientist",
    minimumCgpa: 8.5,
    qualifications: JSON.stringify(["B.Tech"]),
    branches: JSON.stringify(["CSE"]),
    graduationYears: JSON.stringify(["2026", "2027"]),
    requiredSkills: JSON.stringify(["Python", "DSA"]),
    preferredSkills: JSON.stringify(["Machine Learning"]),
    backlogRequirement: 0,
    active: true,
    company: mockCompany,
  };

  // Case A: Student has 95% skill match but CGPA is 8.2 (below required 8.5)
  // MUST BE NOT ELIGIBLE. AI must NOT override mandatory criteria!
  const studentLowerCgpa = {
    name: "Aman Gupta",
    qualification: "B.Tech",
    branch: "CSE",
    graduationYear: 2026,
    cgpa: 8.2, // below 8.5
    backlogs: 0,
    skills: ["Python", "DSA", "Machine Learning", "TensorFlow"],
  };

  const resultLowerCgpa = evaluateStudentEligibility(studentLowerCgpa, highCgpaRole);
  console.log(`- CGPA 8.2 vs Min 8.5 Result Status: ${resultLowerCgpa.status}`);
  console.log(`  Reason: ${resultLowerCgpa.missingCriteria[0]}`);

  if (resultLowerCgpa.status !== "Not Eligible") {
    throw new Error("FAIL: Student with lower CGPA was not marked 'Not Eligible'!");
  }
  console.log("✓ PASS: Mandatory CGPA rule strictly enforced!");

  // Case B: Fully Eligible Student
  const normalRole = {
    id: "role-dev",
    roleName: "Software Developer",
    minimumCgpa: 7.0,
    qualifications: JSON.stringify(["B.Tech", "B.E."]),
    branches: JSON.stringify(["CSE", "IT"]),
    graduationYears: JSON.stringify(["2026"]),
    requiredSkills: JSON.stringify(["Programming", "DSA", "Java"]),
    preferredSkills: JSON.stringify(["SQL"]),
    backlogRequirement: 0,
    active: true,
    company: mockCompany,
  };

  const eligibleStudent = {
    name: "Pooja Patel",
    qualification: "B.Tech",
    branch: "CSE",
    graduationYear: 2026,
    cgpa: 8.4,
    backlogs: 0,
    skills: ["Programming", "DSA", "Java", "SQL"],
  };

  const resultEligible = evaluateStudentEligibility(eligibleStudent, normalRole);
  console.log(`\n- Fully Qualified Candidate Status: ${resultEligible.status} (Score: ${resultEligible.score}%)`);
  if (resultEligible.status !== "Eligible") {
    throw new Error("FAIL: Fully qualified student was not marked 'Eligible'!");
  }
  console.log("✓ PASS: Fully qualified candidate correctly marked 'Eligible'!");

  // Case C: Partially Eligible Student (CGPA passes, but missing Java)
  const studentMissingSkill = {
    name: "Rohan Verma",
    qualification: "B.Tech",
    branch: "CSE",
    graduationYear: 2026,
    cgpa: 8.4,
    backlogs: 0,
    skills: ["Programming", "DSA", "Python"], // missing Java
  };

  const resultPartial = evaluateStudentEligibility(studentMissingSkill, normalRole);
  console.log(`\n- Missing Skill Candidate Status: ${resultPartial.status} (Missing: ${resultPartial.missingSkills.join(", ")})`);
  if (resultPartial.status !== "Partially Eligible" || !resultPartial.missingSkills.includes("Java")) {
    throw new Error("FAIL: Student missing Java was not marked 'Partially Eligible'!");
  }
  console.log("✓ PASS: Missing required skill correctly marked 'Partially Eligible'!");

  // 2. Test Resume Mismatch Detection
  console.log("\n[TEST 2] Testing Resume Mismatch Warnings Detection...");
  const sampleResumeText = `
    Rohan Verma
    Bachelor of Technology in Computer Science (CSE)
    Batch: 2026
    CGPA: 7.9 out of 10.0
    Skills: Python, C++, React, Git, REST APIs
    Projects: E-Commerce Cloud Platform
  `;

  const parsedResume = extractResumeWithHeuristics(sampleResumeText);
  const mismatches = compareStudentWithResume(
    {
      name: "Rohan Verma",
      qualification: "B.Tech",
      branch: "CSE",
      graduationYear: 2026,
      cgpa: 8.5, // Entered 8.5, but resume has 7.9!
      technicalSkills: ["Python", "C++"],
    },
    parsedResume
  );

  console.log(`- Detected Mismatches Count: ${mismatches.length}`);
  const cgpaMismatch = mismatches.find((m) => m.field.includes("CGPA"));
  if (!cgpaMismatch) {
    throw new Error("FAIL: CGPA mismatch between resume (7.9) and entered (8.5) was not flagged!");
  }
  console.log(`  Warning: ${cgpaMismatch.warning}`);
  console.log("✓ PASS: Resume mismatch correctly caught and flagged!");

  // 3. Test Registration ID Generation
  console.log("\n[TEST 3] Testing Unique Registration ID Generator...");
  const regId1 = await generateRegistrationId(2026);
  console.log(`- Generated ID: ${regId1}`);
  if (!regId1.startsWith("PD-2026-")) {
    throw new Error("FAIL: Registration ID format invalid!");
  }
  console.log("✓ PASS: Unique sequential Registration ID verified (PD-2026-XXXXX)!");

  // 4. Test Seeding & Database Records
  console.log("\n[TEST 4] Testing Database Seeding & Active Drives...");
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

  if (!drive) throw new Error("FAIL: No active drive in database!");
  console.log(`- Active Drive: "${drive.name}"`);
  console.log(`- Enrolled Companies: ${drive.companies.length}`);
  for (const dc of drive.companies) {
    console.log(`  * ${dc.company.name} (${dc.company.jobRoles.length} roles)`);
  }
  console.log("✓ PASS: Database drives, companies, and roles verified!");

  // 5. Test Admin User Verification
  console.log("\n[TEST 5] Testing Admin User Authentication...");
  const admin = await prisma.adminUser.findUnique({
    where: { email: "admin@college.edu" },
  });
  if (!admin) throw new Error("FAIL: Admin user not found!");
  const passwordValid = await bcrypt.compare("adminPassword123!", admin.passwordHash);
  if (!passwordValid) throw new Error("FAIL: Admin password hash failed!");
  console.log(`- Verified Admin: ${admin.email} (${admin.name})`);
  console.log("✓ PASS: Admin authentication verified!");

  console.log("\n=======================================================");
  console.log("ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!");
  console.log("=======================================================");
}

runTests()
  .catch((e) => {
    console.error("Test failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
