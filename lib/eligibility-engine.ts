export interface EvaluatedRoleResult {
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  companyDescription?: string;
  jobRoleId: string;
  roleName: string;
  status: "Eligible" | "Partially Eligible" | "Not Eligible";
  score: number; // 0 to 100
  matchedCriteria: string[];
  missingCriteria: string[];
  matchedSkills: string[];
  missingSkills: string[];
  missingPreferredSkills?: string[];
  explanation: string;
  salaryPackage?: string | null;
  minimumCgpa: number;
}

export interface EligibilitySummary {
  eligibleRoles: EvaluatedRoleResult[];
  partiallyEligibleRoles: EvaluatedRoleResult[];
  notEligibleRoles: EvaluatedRoleResult[];
  totalChecked: number;
}

interface StudentProfile {
  name: string;
  qualification: string;
  branch: string;
  graduationYear: number;
  cgpa: number;
  backlogs: number;
  skills: string[]; // Combination of form and resume skills
}

interface RoleWithCompany {
  id: string;
  roleName: string;
  minimumCgpa: number;
  qualifications: string; // JSON or comma string
  branches: string; // JSON or comma string
  graduationYears: string; // JSON or comma string
  requiredSkills: string; // JSON or comma string
  preferredSkills?: string; // JSON or comma string
  backlogRequirement: number;
  experienceRequirement?: string;
  salaryPackage?: string | null;
  active: boolean;
  company: {
    id: string;
    name: string;
    logo?: string | null;
    description: string;
    active: boolean;
    status: string;
  };
}

/**
 * Normalizes an array or comma-separated string into a trimmed string array
 */
function parseStringList(val: string | string[] | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val.map((s) => s.trim());
  try {
    const parsed = JSON.parse(val);
    if (Array.isArray(parsed)) return parsed.map((s) => String(s).trim());
  } catch {
    // Treat as comma-delimited
  }
  return val
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * Fuzzy check if a candidate has a target skill or its synonym
 */
function hasSkill(candidateSkills: string[], targetSkill: string): boolean {
  const normTarget = targetSkill.toLowerCase().trim();
  if (!normTarget) return true;

  // Distinct language guards
  if (normTarget === "java") {
    return candidateSkills.some((s) => {
      const nc = s.toLowerCase().trim();
      if (nc === "javascript" || nc === "js") return false;
      return (
        nc === "java" ||
        nc.startsWith("java ") ||
        nc.endsWith(" java") ||
        nc.includes("core java") ||
        nc.includes("java 8") ||
        nc.includes("java ee") ||
        nc.includes("advanced java")
      );
    });
  }

  if (normTarget === "c") {
    return candidateSkills.some((s) => {
      const nc = s.toLowerCase().trim();
      if (nc === "c++" || nc === "c#" || nc === "css") return false;
      return nc === "c" || nc === "c language" || nc === "c programming";
    });
  }

  const synonymMap: Record<string, string[]> = {
    "dsa": ["dsa", "data structures", "algorithms", "problem solving", "data structure"],
    "data structures": ["dsa", "data structures", "data structure"],
    "algorithms": ["dsa", "algorithms", "algorithm"],
    "programming": ["programming", "coding", "software engineering", "python", "java", "c++", "c", "javascript", "golang"],
    "react": ["react", "react.js", "reactjs", "next.js", "frontend"],
    "node.js": ["node", "node.js", "nodejs", "express", "backend"],
    "sql": ["sql", "mysql", "postgresql", "database", "rdbms", "oracle"],
    "cloud": ["aws", "azure", "gcp", "cloud", "docker"],
    "ml": ["machine learning", "ml", "ai", "artificial intelligence", "deep learning", "nlp"],
  };

  const synonyms = synonymMap[normTarget] || [normTarget];

  return candidateSkills.some((s) => {
    const normCand = s.toLowerCase().trim();
    if (normCand === normTarget) return true;
    if (synonyms.some((syn) => normCand === syn || normCand.includes(syn) || syn.includes(normCand))) {
      return true;
    }
    if (normTarget.length > 4 && (normCand.includes(normTarget) || normTarget.includes(normCand))) {
      return true;
    }
    return false;
  });
}

/**
 * Evaluates a single student profile against a single job role.
 * MANDATORY REQUIREMENTS ARE 100% RULE-BASED.
 */
export function evaluateStudentEligibility(
  student: StudentProfile,
  role: RoleWithCompany
): EvaluatedRoleResult {
  const matchedCriteria: string[] = [];
  const missingCriteria: string[] = [];

  const allowedQuals = parseStringList(role.qualifications);
  const allowedBranches = parseStringList(role.branches);
  const allowedGradYears = parseStringList(role.graduationYears);
  const requiredSkills = parseStringList(role.requiredSkills);
  const preferredSkills = parseStringList(role.preferredSkills);

  let mandatoryPassed = true;

  // 1. RULE-BASED: Minimum CGPA Check (STRICT)
  if (student.cgpa >= role.minimumCgpa) {
    matchedCriteria.push(`CGPA ${student.cgpa} satisfies minimum requirement of ${role.minimumCgpa}`);
  } else {
    mandatoryPassed = false;
    missingCriteria.push(
      `Minimum CGPA required: ${role.minimumCgpa}. Your CGPA: ${student.cgpa}`
    );
  }

  // 2. RULE-BASED: Backlogs Check (STRICT)
  if (student.backlogs <= role.backlogRequirement) {
    matchedCriteria.push(
      `Backlog status cleared (allowed: max ${role.backlogRequirement}, you have: ${student.backlogs})`
    );
  } else {
    mandatoryPassed = false;
    missingCriteria.push(
      `Maximum allowed active backlogs: ${role.backlogRequirement}. You have: ${student.backlogs}`
    );
  }

  // 3. RULE-BASED: Qualification Check (STRICT)
  const normStudentQual = student.qualification.toLowerCase();
  const qualMatch =
    allowedQuals.length === 0 ||
    allowedQuals.some((q) => {
      const nq = q.toLowerCase();
      return normStudentQual.includes(nq) || nq.includes(normStudentQual);
    });

  if (qualMatch) {
    matchedCriteria.push(`Qualification matches: ${student.qualification}`);
  } else {
    mandatoryPassed = false;
    missingCriteria.push(
      `Eligible qualifications: ${allowedQuals.join(", ")}. Your qualification: ${student.qualification}`
    );
  }

  // 4. RULE-BASED: Branch Check (STRICT)
  const normStudentBranch = student.branch.toLowerCase();
  const branchMatch =
    allowedBranches.length === 0 ||
    allowedBranches.some((b) => {
      const nb = b.toLowerCase();
      return (
        normStudentBranch === nb ||
        normStudentBranch.includes(nb) ||
        nb.includes(normStudentBranch) ||
        (nb === "cse" && normStudentBranch.includes("computer")) ||
        (nb === "it" && normStudentBranch.includes("information technology"))
      );
    });

  if (branchMatch) {
    matchedCriteria.push(`Branch matches: ${student.branch}`);
  } else {
    mandatoryPassed = false;
    missingCriteria.push(
      `Eligible branches: ${allowedBranches.join(", ")}. Your branch: ${student.branch}`
    );
  }

  // 5. RULE-BASED: Graduation Year Check (STRICT)
  let yearMatch = false;
  if (allowedGradYears.length === 0) {
    yearMatch = true;
  } else {
    for (const gy of allowedGradYears) {
      if (gy.includes("+")) {
        const baseYear = parseInt(gy.replace("+", "").trim(), 10);
        if (student.graduationYear >= baseYear) {
          yearMatch = true;
          break;
        }
      } else {
        const exactYear = parseInt(gy.trim(), 10);
        if (student.graduationYear === exactYear) {
          yearMatch = true;
          break;
        }
      }
    }
  }

  if (yearMatch) {
    matchedCriteria.push(`Graduation year matches: ${student.graduationYear}`);
  } else {
    mandatoryPassed = false;
    missingCriteria.push(
      `Eligible graduation year(s): ${allowedGradYears.join(", ")}. Your graduation year: ${student.graduationYear}`
    );
  }

  // 6. SKILL MATCHING
  const matchedSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const reqSkill of requiredSkills) {
    if (hasSkill(student.skills, reqSkill)) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  }

  const matchedPreferred: string[] = [];
  const missingPreferred: string[] = [];
  for (const prefSkill of preferredSkills) {
    if (hasSkill(student.skills, prefSkill)) {
      matchedPreferred.push(prefSkill);
    } else {
      missingPreferred.push(prefSkill);
    }
  }

  // 7. FINAL CLASSIFICATION & EXPLANATION
  if (!mandatoryPassed) {
    // If ANY mandatory criterion failed, status MUST BE "Not Eligible", irrespective of skills
    const cgpaDeficit = Math.max(0, role.minimumCgpa - student.cgpa);
    const score = Math.max(10, Math.min(45, Math.round(50 - cgpaDeficit * 15)));

    const skillLackingText = missingSkills.length > 0
      ? ` Additionally, you lack required skills for this company: ${missingSkills.join(", ")}.`
      : matchedSkills.length > 0
      ? ` (Note: Your technical skills matched, but mandatory criteria were not satisfied.)`
      : "";

    return {
      companyId: role.company.id,
      companyName: role.company.name,
      companyLogo: role.company.logo,
      companyDescription: role.company.description,
      jobRoleId: role.id,
      roleName: role.roleName,
      status: "Not Eligible",
      score,
      matchedCriteria,
      missingCriteria,
      matchedSkills,
      missingSkills,
      missingPreferredSkills: missingPreferred,
      explanation: `Your profile does not satisfy the company's mandatory minimum criteria: ${missingCriteria.join("; ")}.${skillLackingText}`,
      salaryPackage: role.salaryPackage,
      minimumCgpa: role.minimumCgpa,
    };
  }

  // Mandatory Passed: Check required skills
  if (missingSkills.length === 0) {
    // Fully Eligible!
    matchedCriteria.push(`All ${requiredSkills.length} required technical skills verified`);
    if (matchedPreferred.length > 0) {
      matchedCriteria.push(`Bonus preferred skills: ${matchedPreferred.join(", ")}`);
    }

    const preferredBonus = preferredSkills.length > 0 ? (matchedPreferred.length / preferredSkills.length) * 10 : 8;
    const score = Math.min(99, Math.round(88 + preferredBonus));

    return {
      companyId: role.company.id,
      companyName: role.company.name,
      companyLogo: role.company.logo,
      companyDescription: role.company.description,
      jobRoleId: role.id,
      roleName: role.roleName,
      status: "Eligible",
      score,
      matchedCriteria,
      missingCriteria: [],
      matchedSkills,
      missingSkills: [],
      explanation: `You satisfy all mandatory academic requirements and possess the required technical skills for ${role.roleName} at ${role.company.name}.`,
      salaryPackage: role.salaryPackage,
      minimumCgpa: role.minimumCgpa,
    };
  } else {
    // Partially Eligible: Mandatory academic requirements met, but missing one or more skills
    const skillRatio = requiredSkills.length > 0 ? matchedSkills.length / requiredSkills.length : 0.5;
    const score = Math.round(55 + skillRatio * 20);

    return {
      companyId: role.company.id,
      companyName: role.company.name,
      companyLogo: role.company.logo,
      companyDescription: role.company.description,
      jobRoleId: role.id,
      roleName: role.roleName,
      status: "Partially Eligible",
      score,
      matchedCriteria,
      missingCriteria: [`Missing key skill(s): ${missingSkills.join(", ")}`],
      matchedSkills,
      missingSkills,
      explanation: `Academic criteria satisfied, but you are missing key skills required by ${role.company.name}: ${missingSkills.join(", ")}. Brush up on these skills for interview consideration.`,
      salaryPackage: role.salaryPackage,
      minimumCgpa: role.minimumCgpa,
    };
  }
}

/**
 * Evaluates all roles participating in a placement drive for a student
 */
export function evaluateAllDriveRoles(
  student: StudentProfile,
  roles: RoleWithCompany[]
): EligibilitySummary {
  const eligibleRoles: EvaluatedRoleResult[] = [];
  const partiallyEligibleRoles: EvaluatedRoleResult[] = [];
  const notEligibleRoles: EvaluatedRoleResult[] = [];

  for (const role of roles) {
    if (!role.active || !role.company.active || role.company.status !== "Active") {
      continue;
    }

    const result = evaluateStudentEligibility(student, role);
    if (result.status === "Eligible") {
      eligibleRoles.push(result);
    } else if (result.status === "Partially Eligible") {
      partiallyEligibleRoles.push(result);
    } else {
      notEligibleRoles.push(result);
    }
  }

  return {
    eligibleRoles,
    partiallyEligibleRoles,
    notEligibleRoles,
    totalChecked: eligibleRoles.length + partiallyEligibleRoles.length + notEligibleRoles.length,
  };
}
