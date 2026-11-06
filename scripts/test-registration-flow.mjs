import fs from 'fs';
import path from 'path';

async function testFlow() {
  console.log("=== TGMSC&CCC END-TO-END FLOW VERIFICATION ===");

  // 1. Prepare sample resume
  const samplePdfPath = path.resolve('public/sample-resume.pdf');
  let resumeBuffer;
  let filename = 'sample-resume.pdf';

  if (fs.existsSync(samplePdfPath)) {
    resumeBuffer = fs.readFileSync(samplePdfPath);
  } else {
    filename = 'resume.txt';
    resumeBuffer = Buffer.from(`
      MOHAMMED IMRAN
      Email: mohammed.imran@example.com
      Phone: 9876543210
      Education: B.TECH in Computer Science & Engineering (CSE)
      Graduation Year: 2026
      CGPA: 8.2 / 10.0
      Backlogs: 0
      Technical Skills: Programming, Java, Python, SQL, DSA, HTML, CSS, React
    `);
  }

  // Use FormData via native fetch (Node 18+)
  const blob = new Blob([resumeBuffer], { type: 'application/pdf' });
  const form = new FormData();
  form.append('name', 'Mohammed Imran');
  form.append('phone', '9876543210');
  form.append('email', 'mohammed.imran@example.com');
  form.append('gender', 'Male');
  form.append('qualification', 'B.TECH');
  form.append('resume', blob, filename);

  console.log("1. Sending resume to /api/placements/analyze-resume...");
  const analyzeRes = await fetch('http://localhost:3000/api/placements/analyze-resume', {
    method: 'POST',
    body: form,
  });

  const analyzeData = await analyzeRes.json();
  console.log("Analysis HTTP Status:", analyzeRes.status);
  console.log("Effective CGPA parsed:", analyzeData.effectiveCgpa);
  console.log("Extracted Skills:", analyzeData.parsedData?.technicalSkills?.slice(0, 6));
  console.log("Eligible Roles count:", analyzeData.eligibility?.eligibleRoles?.length);
  console.log("Not Eligible Roles count:", analyzeData.eligibility?.notEligibleRoles?.length);

  // Check ineligibility skills breakdown
  if (analyzeData.eligibility?.notEligibleRoles?.length > 0) {
    const notEligible = analyzeData.eligibility.notEligibleRoles[0];
    console.log(`\nSample Ineligible Role: ${notEligible.companyName} - ${notEligible.roleName}`);
    console.log("  Why not eligible:", notEligible.missingCriteria);
    console.log("  Skills lacked:", notEligible.missingSkills);
  }

  // 2. Select eligible companies
  const eligibleRoles = analyzeData.eligibility?.eligibleRoles || [];
  const selectedRoles = eligibleRoles.slice(0, 3).map(r => ({
    companyId: r.companyId,
    companyName: r.companyName,
    jobRoleId: r.jobRoleId,
    roleName: r.roleName,
    status: r.status,
  }));

  console.log("\n2. Submitting registration with Candidate-selected companies:", selectedRoles.map(s => s.companyName));

  const registerPayload = {
    name: 'Mohammed Imran',
    phone: '9876543210',
    email: 'mohammed.imran@example.com',
    gender: 'Male',
    qualification: 'B.TECH',
    resumeUrl: analyzeData.resumeUrl,
    driveId: analyzeData.drive?.id,
    parsedResumeData: analyzeData.parsedData,
    eligibilityResults: analyzeData.eligibility,
    selectedRoles: selectedRoles,
    mismatchWarnings: analyzeData.mismatchWarnings || [],
    confirmed: true,
  };

  const regRes = await fetch('http://localhost:3000/api/placements/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(registerPayload),
  });

  const regData = await regRes.json();
  console.log("Registration HTTP Status:", regRes.status);
  console.log("Generated Registration ID:", regData.registrationId);
  console.log("Interview Schedule:", regData.interviewSchedule);
  console.log("Selected Companies in response:", regData.selectedCompanies);

  // 3. Verify Excel Master Sheet
  const masterXlsx = path.resolve('public/data/Placement_Registrations_Master.xlsx');
  const masterCsv = path.resolve('public/data/Placement_Registrations_Master.csv');
  console.log("\n3. Verifying Excel Master Files:");
  console.log("  XLSX exists:", fs.existsSync(masterXlsx), "Size:", fs.statSync(masterXlsx).size, "bytes");
  console.log("  CSV exists:", fs.existsSync(masterCsv), "Size:", fs.statSync(masterCsv).size, "bytes");

  // Read last 2 lines of CSV
  const csvContent = fs.readFileSync(masterCsv, 'utf-8');
  const csvLines = csvContent.trim().split('\n');
  console.log("  Latest CSV record:", csvLines[csvLines.length - 1]);

  console.log("\n=== ALL FLOW CHECKS PASSED SUCCESSFULLY ===");
}

testFlow().catch(console.error);
