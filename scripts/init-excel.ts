import { saveRegistrationToExcel } from "../lib/excel-storage";
import { calculateInterviewSchedule } from "../lib/email-service";

async function main() {
  const schedule = calculateInterviewSchedule();
  
  await saveRegistrationToExcel({
    registrationId: "PD-2026-00001",
    registrationDate: new Date().toISOString(),
    studentName: "Aakash Verma",
    email: "aakash.verma@college.edu",
    phone: "+91 98765 43210",
    gender: "Male",
    qualification: "B.Tech",
    branch: "Computer Science and Engineering",
    graduationYear: 2026,
    cgpa: 8.45,
    backlogs: 0,
    selectedCompanies: "TCS (Software Developer), Infosys (Systems Engineer)",
    allEligibleCompanies: "TCS, Infosys, Accenture",
    technicalSkills: "Java, Python, Data Structures, Algorithms, React, SQL",
    resumeUrl: "/uploads/resumes/sample-resume.pdf",
    interviewSchedule: `${schedule.dayAndDate} at ${schedule.time}`,
    interviewVenue: schedule.venue,
    status: "CONFIRMED",
    placementDrive: "November 2026 Campus Placement Drive",
  });

  console.log("Master Excel & CSV successfully initialized with sample registration!");
}

main().catch(console.error);
