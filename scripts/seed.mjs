import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding TGMSC&CCC placement portal database...");

  // 1. Create or update Default Admin
  const adminPasswordHash = await bcrypt.hash("adminPassword123!", 10);
  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@college.edu" },
    update: { passwordHash: adminPasswordHash },
    create: {
      email: "admin@college.edu",
      passwordHash: adminPasswordHash,
      name: "TGMSC&CCC Placement Officer",
      role: "admin",
    },
  });
  console.log("Created admin user:", admin.email);

  // 2. Create Active Placement Drive
  const driveDate = new Date();
  driveDate.setDate(driveDate.getDate() + 30); // 30 days from now

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 20); // 20 days from now

  const drive = await prisma.placementDrive.upsert({
    where: { id: "drive-fall-2026" },
    update: {
      name: "TGMSC&CCC Placement Drive 2026",
      description: "Telangana Minorities Study Circle & Career Counselling Centre (TGMSC&CCC), Minorities Welfare Department, Government of Telangana. Special Campus Recruitment & Internship Drive.",
    },
    create: {
      id: "drive-fall-2026",
      name: "TGMSC&CCC Placement Drive 2026",
      description: "Telangana Minorities Study Circle & Career Counselling Centre (TGMSC&CCC), Minorities Welfare Department, Government of Telangana. Special Campus Recruitment & Internship Drive.",
      driveDate,
      registrationDeadline: deadline,
      status: "Active",
    },
  });
  console.log("Created placement drive:", drive.name);

  // 3. Companies & Job Roles definition (including TGMSC official drive openings)
  const companiesData = [
    {
      id: "comp-vivifi",
      name: "Vivifi India Finance Private Limited",
      logo: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=128&h=128&fit=crop",
      description: "Vivifi India Finance Private Limited is a leading non-banking financial company enabling financial inclusion through technology.",
      active: true,
      status: "Active",
      website: "https://www.vivifiindia.com",
      roles: [
        {
          id: "role-vivifi-ops",
          roleName: "Associate Operations / Finance Analyst (VIVIFI)",
          description: "Operations, customer account management, and financial risk assessment for retail financial services.",
          minimumCgpa: 5.5,
          qualifications: JSON.stringify(["B.A", "B.SC", "B.B.A", "B.TECH", "Any Degree", "Other"]),
          branches: JSON.stringify(["All Branches", "Commerce", "Arts", "Science", "Engineering", "Business"]),
          graduationYears: JSON.stringify(["2023", "2024", "2025", "2026", "2027"]),
          requiredSkills: JSON.stringify(["Communication", "MS Office", "Analytical Skills"]),
          preferredSkills: JSON.stringify(["Problem Solving", "Customer Relations"]),
          backlogRequirement: 2,
          experienceRequirement: "Fresher",
          salaryPackage: "₹3.0 – ₹4.2 LPA",
          active: true,
        },
      ],
    },
    {
      id: "comp-intern40",
      name: "Industry Centre Apprenticeship (INTERN40)",
      logo: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=128&h=128&fit=crop",
      description: "Industry Centre Apprenticeship program providing paid industry training and rapid placement for science & engineering graduates.",
      active: true,
      status: "Active",
      website: "https://tgminoritiesstudycircle-pixel.github.io/tgmsc2-placement/",
      roles: [
        {
          id: "role-intern40-apprentice",
          roleName: "Paid Internship — Engineering / B.Sc Physics / Chemistry",
          description: "Industry centre apprenticeship with ₹12,000/month stipend. No cost to student, guaranteed placement within 3 days for passed-out graduates.",
          minimumCgpa: 5.0,
          qualifications: JSON.stringify(["B.TECH", "B.SC", "Engineering"]),
          branches: JSON.stringify(["All Branches", "Mechanical", "Civil", "CSE", "ECE", "EEE", "Physics", "Chemistry"]),
          graduationYears: JSON.stringify(["2024", "2025", "2026"]),
          requiredSkills: JSON.stringify(["Technical Aptitude", "Problem Solving", "Science Fundamentals"]),
          preferredSkills: JSON.stringify(["Communication", "Teamwork"]),
          backlogRequirement: 2,
          experienceRequirement: "Fresher",
          salaryPackage: "₹12,000/month stipend",
          active: true,
        },
      ],
    },
    {
      id: "comp-32272",
      name: "US-Based Global Design Firm (32272)",
      logo: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=128&h=128&fit=crop",
      description: "International engineering and architectural design firm delivering CAD models and technical blueprints for US projects.",
      active: true,
      status: "Active",
      website: "https://tgminoritiesstudycircle-pixel.github.io/tgmsc2-placement/",
      roles: [
        {
          id: "role-32272-cad",
          roleName: "AutoCAD / CAD Designer (US-based company)",
          description: "2D drafting and 3D modeling using AutoCAD and CAD suites. Night shift support for US design operations. Freshers can apply.",
          minimumCgpa: 5.5,
          qualifications: JSON.stringify(["B.TECH", "ITI / Diploma", "B.SC", "Other", "Degree"]),
          branches: JSON.stringify(["Mechanical", "Civil", "Electrical", "Architecture", "Engineering", "Design"]),
          graduationYears: JSON.stringify(["2023", "2024", "2025", "2026"]),
          requiredSkills: JSON.stringify(["AutoCAD", "CAD", "2D/3D Design", "Drafting"]),
          preferredSkills: JSON.stringify(["Technical Drawing", "Revit"]),
          backlogRequirement: 2,
          experienceRequirement: "Fresher / Night Shift",
          salaryPackage: "₹20,000 – ₹25,000/month",
          active: true,
        },
      ],
    },
    {
      id: "comp-tcs",
      name: "TCS",
      logo: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=128&h=128&fit=crop&crop=faces",
      description: "Tata Consultancy Services is a global leader in IT services, consulting & business solutions.",
      active: true,
      status: "Active",
      website: "https://www.tcs.com",
      roles: [
        {
          id: "role-tcs-dev",
          roleName: "Software Developer",
          description: "Full-stack software development, core algorithm design, and cloud applications.",
          minimumCgpa: 7.0,
          qualifications: JSON.stringify(["B.Tech", "B.TECH", "B.E.", "MCA"]),
          branches: JSON.stringify(["CSE", "IT", "AI & ML", "ECE"]),
          graduationYears: JSON.stringify(["2026", "2027"]),
          requiredSkills: JSON.stringify(["Programming", "DSA", "Java", "Python"]),
          preferredSkills: JSON.stringify(["React", "SQL", "Git"]),
          backlogRequirement: 0,
          experienceRequirement: "Fresher",
          salaryPackage: "7.5 LPA",
          active: true,
        },
      ],
    },
    {
      id: "comp-infosys",
      name: "Infosys",
      logo: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=128&h=128&fit=crop",
      description: "Infosys is a global leader in next-generation digital services and consulting.",
      active: true,
      status: "Active",
      website: "https://www.infosys.com",
      roles: [
        {
          id: "role-infosys-se",
          roleName: "Systems Engineer",
          description: "Develop enterprise software components, backend APIs, and unit test automation.",
          minimumCgpa: 6.5,
          qualifications: JSON.stringify(["B.Tech", "B.TECH", "B.E.", "MCA", "BCA"]),
          branches: JSON.stringify(["CSE", "IT", "ECE", "EEE", "Mechanical", "Civil"]),
          graduationYears: JSON.stringify(["2026", "2027"]),
          requiredSkills: JSON.stringify(["Programming", "Python", "SQL"]),
          preferredSkills: JSON.stringify(["Java", "Git"]),
          backlogRequirement: 1,
          experienceRequirement: "Fresher",
          salaryPackage: "6.0 LPA",
          active: true,
        },
      ],
    },
    {
      id: "comp-deloitte",
      name: "Deloitte",
      logo: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=128&h=128&fit=crop",
      description: "Deloitte drives impact through consulting, risk advisory, tax, and technology services.",
      active: true,
      status: "Active",
      website: "https://www.deloitte.com",
      roles: [
        {
          id: "role-deloitte-analyst",
          roleName: "Technology Analyst",
          description: "Data-driven architecture, cloud strategy, and financial engineering consulting.",
          minimumCgpa: 7.5,
          qualifications: JSON.stringify(["B.Tech", "B.TECH", "B.E.", "M.Tech"]),
          branches: JSON.stringify(["CSE", "IT", "AI & ML"]),
          graduationYears: JSON.stringify(["2026", "2027"]),
          requiredSkills: JSON.stringify(["Python", "SQL", "Cloud"]),
          preferredSkills: JSON.stringify(["PowerBI", "Docker", "Machine Learning"]),
          backlogRequirement: 0,
          experienceRequirement: "Fresher",
          salaryPackage: "9.5 LPA",
          active: true,
        },
      ],
    },
  ];

  for (const c of companiesData) {
    const comp = await prisma.company.upsert({
      where: { id: c.id },
      update: {
        name: c.name,
        description: c.description,
        status: c.status,
        active: c.active,
        website: c.website,
        logo: c.logo,
      },
      create: {
        id: c.id,
        name: c.name,
        logo: c.logo,
        description: c.description,
        active: c.active,
        status: c.status,
        website: c.website,
      },
    });

    // Link to drive
    await prisma.driveCompany.upsert({
      where: {
        placementDriveId_companyId: {
          placementDriveId: drive.id,
          companyId: comp.id,
        },
      },
      update: {},
      create: {
        placementDriveId: drive.id,
        companyId: comp.id,
      },
    });

    // Roles
    for (const r of c.roles) {
      await prisma.jobRole.upsert({
        where: { id: r.id },
        update: {
          roleName: r.roleName,
          description: r.description,
          minimumCgpa: r.minimumCgpa,
          qualifications: r.qualifications,
          branches: r.branches,
          graduationYears: r.graduationYears,
          requiredSkills: r.requiredSkills,
          preferredSkills: r.preferredSkills,
          backlogRequirement: r.backlogRequirement,
          salaryPackage: r.salaryPackage,
          active: r.active,
        },
        create: {
          id: r.id,
          companyId: comp.id,
          roleName: r.roleName,
          description: r.description,
          minimumCgpa: r.minimumCgpa,
          qualifications: r.qualifications,
          branches: r.branches,
          graduationYears: r.graduationYears,
          requiredSkills: r.requiredSkills,
          preferredSkills: r.preferredSkills,
          backlogRequirement: r.backlogRequirement,
          experienceRequirement: r.experienceRequirement,
          salaryPackage: r.salaryPackage,
          active: r.active,
        },
      });
    }
  }

  console.log("Database seeded successfully with TGMSC&CCC placement drive, companies, and roles!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
