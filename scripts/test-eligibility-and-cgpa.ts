import { evaluateStudentEligibility } from "../lib/eligibility-engine";
import { extractResumeWithHeuristics } from "../lib/resume-parser";
import { saveRegistrationToExcel } from "../lib/excel-storage";
import { calculateInterviewSchedule } from "../lib/email-service";

async function main() {
  console.log("=== 1. TESTING RESUME CGPA EXTRACTION & PARSING ===");

  const sampleResumeText = `
    Rahul Sharma
    Email: rahul.sharma@college.edu
    Phone: +91 98765 43210
    
    EDUCATION:
    B.Tech in Computer Science and Engineering
    T.G.S. College of Engineering & Technology
    Graduation Year: 2026
    Cumulative GPA: 8.2 CGPA out of 10.0
    Backlogs: 0
    
    TECHNICAL SKILLS:
    Programming Languages: Python, JavaScript, HTML, CSS, SQL
    Frameworks: React, Express
    Tools: Git, Docker, MongoDB
  `;

  const parsed = extractResumeWithHeuristics(sampleResumeText);
  console.log("Extracted Degree:", parsed.degree);
  console.log("Extracted Branch:", parsed.branch);
  console.log("Extracted Grad Year:", parsed.graduationYear);
  console.log("Extracted CGPA (from resume without form input):", parsed.cgpa);
  console.log("Extracted Skills:", parsed.technicalSkills);

  if (parsed.cgpa !== 8.2) {
    throw new Error(`Expected CGPA 8.2 from resume, got ${parsed.cgpa}`);
  }
  console.log("✓ Resume CGPA successfully parsed directly from document text!");

  console.log("\n=== 2. TESTING NOT ELIGIBLE BREAKDOWN & SKILLS LACKED ===");

  // Company A requires higher CGPA (e.g. 8.5) and Java, DSA
  const sampleRoleWithCompany = {
    id: "role-deloitte-1",
    roleName: "Senior Data & Systems Analyst",
    minimumCgpa: 8.5, // Student has 8.2 -> Will fail mandatory CGPA cutoff!
    qualifications: "B.Tech, B.E.",
    branches: "CSE, IT",
    graduationYears: "2026",
    requiredSkills: "Java, Data Structures, Algorithms, SQL", // Student has SQL, but lacks Java, Data Structures, Algorithms
    preferredSkills: "AWS, Kubernetes",
    backlogRequirement: 0,
    active: true,
    company: {
      id: "comp-deloitte",
      name: "Deloitte",
      logo: "/logos/deloitte.png",
      description: "Consulting & Technology",
      active: true,
      status: "Active",
    },
  };

  const evalResult = evaluateStudentEligibility(
    {
      name: "Rahul Sharma",
      qualification: "B.Tech",
      branch: parsed.branch || "CSE",
      graduationYear: parsed.graduationYear || 2026,
      cgpa: parsed.cgpa || 8.2, // From resume
      backlogs: 0,
      skills: parsed.technicalSkills,
    },
    sampleRoleWithCompany
  );

  console.log("Status:", evalResult.status);
  console.log("Why Not Eligible (Missing Criteria):", evalResult.missingCriteria);
  console.log("Skills Lacked for Deloitte (Missing Skills):", evalResult.missingSkills);
  console.log("Missing Preferred Skills:", evalResult.missingPreferredSkills);
  console.log("Detailed Explanation:", evalResult.explanation);

  if (evalResult.status !== "Not Eligible") {
    throw new Error(`Expected "Not Eligible", got ${evalResult.status}`);
  }
  if (!evalResult.missingCriteria.some((c) => c.includes("8.5"))) {
    throw new Error("Missing criteria does not mention 8.5 CGPA!");
  }
  if (!evalResult.missingSkills.includes("Java") || !evalResult.missingSkills.includes("Data Structures")) {
    throw new Error("Missing skills does not identify Java and Data Structures!");
  }

  console.log("✓ Correctly classified as Not Eligible with explicit reasons & skills lacked!");

  console.log("\n=== 3. TESTING EXCEL MASTER LOGGING WITH RESUME CGPA ===");
  const schedule = calculateInterviewSchedule();
  await saveRegistrationToExcel({
    registrationId: "PD-2026-00002",
    registrationDate: new Date().toISOString(),
    studentName: "Rahul Sharma",
    email: "rahul.sharma@college.edu",
    phone: "+91 98765 43210",
    gender: "Male",
    qualification: "B.Tech",
    branch: parsed.branch || "CSE",
    graduationYear: parsed.graduationYear || 2026,
    cgpa: parsed.cgpa || 8.2, // Auto-extracted
    backlogs: 0,
    selectedCompanies: "TCS - Software Developer",
    allEligibleCompanies: "TCS",
    technicalSkills: parsed.technicalSkills.join(", "),
    resumeUrl: "/uploads/resumes/sample-rahul.pdf",
    interviewSchedule: `${schedule.dayAndDate} at ${schedule.time}`,
    interviewVenue: schedule.venue,
    status: "CONFIRMED",
    placementDrive: "November 2026 Campus Placement Drive",
  });

  console.log("✓ Successfully saved to Placement_Registrations_Master.xlsx with auto-extracted CGPA!");
  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}

main().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
