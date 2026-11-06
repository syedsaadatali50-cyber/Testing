import pdfParse from "pdf-parse";
import mammoth from "mammoth";
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface ParsedResumeData {
  name?: string;
  degree?: string;
  branch?: string;
  graduationYear?: number;
  cgpa?: number;
  backlogs?: number;
  education: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    year?: number | string;
    score?: string;
  }>;
  technicalSkills: string[];
  programmingLanguages: string[];
  frameworks: string[];
  toolsAndDatabases: string[];
  certifications: string[];
  projects: Array<{
    title: string;
    description?: string;
    technologies?: string[];
  }>;
  internships: Array<{
    role: string;
    company: string;
    duration?: string;
    highlights?: string;
  }>;
  workExperience: Array<{
    role: string;
    company: string;
    duration?: string;
    description?: string;
  }>;
  achievements: string[];
  rawText: string;
}

export interface MismatchWarning {
  field: string;
  enteredValue: string | number;
  extractedValue: string | number;
  warning: string;
  severity: "warning" | "info";
}

/**
 * Extracts raw text from uploaded resume buffer based on mime type
 */
export async function extractTextFromResume(
  buffer: Buffer,
  mimeType: string,
  fileName: string
): Promise<string> {
  const ext = fileName.toLowerCase().split(".").pop();

  if (mimeType === "application/pdf" || ext === "pdf") {
    try {
      const data = await pdfParse(buffer);
      return data.text || "";
    } catch (err) {
      console.error("PDF parse error, attempting fallback:", err);
      // Fallback: extract ascii readable strings
      return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value || "";
    } catch (err) {
      console.error("DOCX parse error:", err);
      return "";
    }
  }

  if (mimeType === "application/msword" || ext === "doc") {
    // Basic text extraction for legacy doc
    return buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ");
  }

  return buffer.toString("utf-8");
}

/**
 * Intelligent regex and heuristic rule-based resume parser
 */
export function extractResumeWithHeuristics(text: string): ParsedResumeData {
  const cleanText = text.replace(/\r\n/g, "\n");
  const lines = cleanText.split("\n").map((l) => l.trim()).filter(Boolean);

  // 1. Name detection (usually top 1-4 lines, not an email or phone)
  let extractedName = "";
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i];
    if (
      line.length > 2 &&
      line.length < 40 &&
      !line.includes("@") &&
      !line.match(/\d{5}/) &&
      !line.toLowerCase().includes("resume") &&
      !line.toLowerCase().includes("curriculum")
    ) {
      extractedName = line;
      break;
    }
  }

  // 2. Degree and Branch detection
  let degree = "";
  let branch = "";
  const degreeMatches = [
    { pattern: /\b(B\.?Tech|B\.?E\.?|Bachelor of Technology|Bachelor of Engineering)\b/i, label: "B.Tech" },
    { pattern: /\b(M\.?Tech|M\.?E\.?|Master of Technology)\b/i, label: "M.Tech" },
    { pattern: /\b(BCA|Bachelor of Computer Applications)\b/i, label: "BCA" },
    { pattern: /\b(MCA|Master of Computer Applications)\b/i, label: "MCA" },
    { pattern: /\b(B\.?Sc|Bachelor of Science)\b/i, label: "B.Sc" },
    { pattern: /\b(M\.?Sc|Master of Science)\b/i, label: "M.Sc" },
  ];
  for (const dm of degreeMatches) {
    if (dm.pattern.test(cleanText)) {
      degree = dm.label;
      break;
    }
  }

  const branchMatches = [
    { pattern: /\b(Computer Science|CSE|Comp Sci)\b/i, label: "CSE" },
    { pattern: /\b(Information Technology|IT)\b/i, label: "IT" },
    { pattern: /\b(Artificial Intelligence|AI\s*(&|and)?\s*ML|Machine Learning)\b/i, label: "AI & ML" },
    { pattern: /\b(Electronics(\s*and\s*Communication)?|ECE)\b/i, label: "ECE" },
    { pattern: /\b(Electrical(\s*and\s*Electronics)?|EEE)\b/i, label: "EEE" },
    { pattern: /\b(Mechanical|ME)\b/i, label: "Mechanical" },
    { pattern: /\b(Civil)\b/i, label: "Civil" },
    { pattern: /\b(Data Science)\b/i, label: "Data Science" },
  ];
  for (const bm of branchMatches) {
    if (bm.pattern.test(cleanText)) {
      branch = bm.label;
      break;
    }
  }

  // 3. Graduation Year detection
  let graduationYear: number | undefined;
  const yearMatch = cleanText.match(/\b(202[0-9])\b/g);
  if (yearMatch) {
    // Pick the most recent/future year (likely graduation year)
    const years = yearMatch.map((y) => parseInt(y, 10)).filter((y) => y >= 2024 && y <= 2030);
    if (years.length > 0) {
      graduationYear = Math.max(...years);
    } else {
      const anyYears = yearMatch.map((y) => parseInt(y, 10)).filter((y) => y >= 2020 && y <= 2030);
      if (anyYears.length > 0) graduationYear = Math.max(...anyYears);
    }
  }

  // 4. CGPA / Percentage detection
  let cgpa: number | undefined;
  const cgpaRegexes = [
    /(?:CGPA|GPA|Grade|Pointer)[\s:]*([0-9]\.[0-9]{1,2})/i,
    /([0-9]\.[0-9]{1,2})\s*(?:\/\s*10|CGPA)/i,
    /(?:score|aggregate)[\s:]*([0-9]\.[0-9]{1,2})/i,
    /([0-9]\.[0-9]{1,2})\s*out of 10/i,
  ];
  for (const rx of cgpaRegexes) {
    const match = cleanText.match(rx);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (parsed >= 4.0 && parsed <= 10.0) {
        cgpa = parsed;
        break;
      }
    }
  }
  // If percentage e.g. "82%", convert to CGPA approx if no CGPA found
  if (!cgpa) {
    const pctMatch = cleanText.match(/(?:Percentage|Aggregate)[\s:]*([0-9]{2}(?:\.[0-9]+)?)\s*%/i);
    if (pctMatch && pctMatch[1]) {
      const pct = parseFloat(pctMatch[1]);
      if (pct >= 50 && pct <= 100) {
        cgpa = parseFloat((pct / 9.5).toFixed(2));
      }
    }
  }

  // 5. Technical Skills Dictionary
  const KNOWN_LANGUAGES = [
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "C", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "SQL", "HTML", "CSS"
  ];
  const KNOWN_FRAMEWORKS = [
    "React", "React.js", "Next.js", "Angular", "Vue.js", "Node.js", "Express", "Express.js", "Django", "FastAPI", "Flask", "Spring Boot", "Spring", ".NET", "Tailwind CSS", "Bootstrap"
  ];
  const KNOWN_TOOLS = [
    "Git", "GitHub", "Docker", "Kubernetes", "AWS", "Azure", "GCP", "PostgreSQL", "MySQL", "MongoDB", "Redis", "Firebase", "Linux", "REST APIs", "GraphQL"
  ];

  const programmingLanguages = KNOWN_LANGUAGES.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[+.]/g, "\\$&")}\\b`, "i").test(cleanText)
  );

  const frameworks = KNOWN_FRAMEWORKS.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[+.]/g, "\\$&")}\\b`, "i").test(cleanText)
  );

  const toolsAndDatabases = KNOWN_TOOLS.filter((skill) =>
    new RegExp(`\\b${skill.replace(/[+.]/g, "\\$&")}\\b`, "i").test(cleanText)
  );

  const technicalSkills = Array.from(
    new Set([...programmingLanguages, ...frameworks, ...toolsAndDatabases])
  );

  // 6. Certifications
  const certifications: string[] = [];
  const certLines = lines.filter((l) =>
    /(certified|certification|certificate|aws certified|oracle certified|hackerrank|coursera|udemy)/i.test(l)
  );
  for (const cl of certLines.slice(0, 5)) {
    if (cl.length > 5 && cl.length < 100) certifications.push(cl);
  }

  // 7. Projects extraction
  const projects: Array<{ title: string; description?: string; technologies?: string[] }> = [];
  let inProjectSection = false;
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (/(?:^|\s)(?:projects|academic projects|key projects)(?:$|\s|:)/i.test(l)) {
      inProjectSection = true;
      continue;
    }
    if (inProjectSection && /(?:skills|education|experience|certifications|achievements)/i.test(l) && l.length < 30) {
      inProjectSection = false;
      break;
    }
    if (inProjectSection && l.length > 5 && l.length < 80 && !l.startsWith("-") && !l.startsWith("•")) {
      projects.push({ title: l });
      if (projects.length >= 4) break;
    }
  }

  // 8. Internships & Work Experience
  const internships: Array<{ role: string; company: string; duration?: string; highlights?: string }> = [];
  const workExperience: Array<{ role: string; company: string; duration?: string; description?: string }> = [];
  
  const internMatches = cleanText.match(/(?:intern|internship|trainee)[\w\s]{0,40}(?:at|in|,)?[\w\s]{0,30}/gi);
  if (internMatches) {
    for (const im of internMatches.slice(0, 3)) {
      internships.push({ role: "Intern", company: im.trim() });
    }
  }

  // 9. Achievements
  const achievements: string[] = [];
  const achLines = lines.filter((l) =>
    /(won|winner|runner-up|first place|hackathon|scholarship|ranked|dean's list|merit|award)/i.test(l)
  );
  for (const al of achLines.slice(0, 4)) {
    if (al.length > 8 && al.length < 120) achievements.push(al);
  }

  // 10. Backlogs detection (default 0 for clean academic record)
  let backlogs = 0;
  const backlogMatch = cleanText.match(/(?:backlog|arrear|standing arrear)s?[\s:]*([0-9]+)/i);
  if (backlogMatch && backlogMatch[1]) {
    backlogs = parseInt(backlogMatch[1], 10);
  }

  return {
    name: extractedName,
    degree,
    branch: branch || "CSE",
    graduationYear: graduationYear || 2026,
    cgpa,
    backlogs,
    education: [
      {
        degree: degree || "Undergraduate",
        field: branch || "Engineering",
        year: graduationYear || "2026",
        score: cgpa ? `${cgpa} CGPA` : undefined,
      },
    ],
    technicalSkills,
    programmingLanguages,
    frameworks,
    toolsAndDatabases,
    certifications,
    projects: projects.length > 0 ? projects : [{ title: "Academic Capstone Project" }],
    internships,
    workExperience,
    achievements,
    rawText: cleanText.slice(0, 4000),
  };
}

/**
 * Enhanced AI analysis using Google Generative AI (Gemini) if API key available,
 * seamlessly merged with heuristic parsing for 100% reliability and speed.
 */
export async function analyzeResumeWithAI(
  rawText: string
): Promise<ParsedResumeData> {
  const heuristicResult = extractResumeWithHeuristics(rawText);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    return heuristicResult;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an expert AI resume parser for a college campus placement drive.
Extract structured information from the following student resume text.

Return strictly a valid JSON object matching this schema:
{
  "name": "Full Name",
  "degree": "e.g. B.Tech / B.E. / MCA / M.Tech",
  "branch": "e.g. CSE / IT / AI & ML / ECE",
  "graduationYear": 2026,
  "cgpa": 8.4,
  "backlogs": 0,
  "education": [
    { "institution": "...", "degree": "...", "field": "...", "year": 2026, "score": "8.4 CGPA" }
  ],
  "technicalSkills": ["list", "of", "skills"],
  "programmingLanguages": ["Python", "Java", "C++"],
  "frameworks": ["React", "Node.js", "Django"],
  "toolsAndDatabases": ["Git", "PostgreSQL", "Docker"],
  "certifications": ["Cert 1", "Cert 2"],
  "projects": [
    { "title": "Project Name", "description": "...", "technologies": ["..."] }
  ],
  "internships": [
    { "role": "...", "company": "...", "duration": "..." }
  ],
  "workExperience": [],
  "achievements": ["Achievement 1"]
}

Resume Text:
${rawText.slice(0, 5000)}
`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const jsonText = result.response.text();
    const parsedAI = JSON.parse(jsonText);

    return {
      name: parsedAI.name || heuristicResult.name,
      degree: parsedAI.degree || heuristicResult.degree,
      branch: parsedAI.branch || heuristicResult.branch,
      graduationYear: parsedAI.graduationYear || heuristicResult.graduationYear,
      cgpa: parsedAI.cgpa ? parseFloat(parsedAI.cgpa) : heuristicResult.cgpa,
      backlogs: parsedAI.backlogs !== undefined ? parsedAI.backlogs : heuristicResult.backlogs,
      education: parsedAI.education || heuristicResult.education,
      technicalSkills: Array.from(new Set([...(parsedAI.technicalSkills || []), ...heuristicResult.technicalSkills])),
      programmingLanguages: Array.from(new Set([...(parsedAI.programmingLanguages || []), ...heuristicResult.programmingLanguages])),
      frameworks: Array.from(new Set([...(parsedAI.frameworks || []), ...heuristicResult.frameworks])),
      toolsAndDatabases: Array.from(new Set([...(parsedAI.toolsAndDatabases || []), ...heuristicResult.toolsAndDatabases])),
      certifications: parsedAI.certifications || heuristicResult.certifications,
      projects: parsedAI.projects || heuristicResult.projects,
      internships: parsedAI.internships || heuristicResult.internships,
      workExperience: parsedAI.workExperience || heuristicResult.workExperience,
      achievements: parsedAI.achievements || heuristicResult.achievements,
      rawText: rawText.slice(0, 4000),
    };
  } catch (err) {
    console.warn("AI generation failed, using robust heuristic extraction:", err);
    return heuristicResult;
  }
}

/**
 * Compare student entered registration details with AI-extracted resume data.
 * Produces user-friendly mismatch warnings for review.
 */
export function compareStudentWithResume(
  studentInput: {
    name: string;
    qualification: string;
    cgpa?: number;
    branch?: string;
    graduationYear?: number;
    technicalSkills?: string[];
  },
  resumeData: ParsedResumeData
): MismatchWarning[] {
  const warnings: MismatchWarning[] = [];

  // 1. CGPA Mismatch Check (only if student explicitly entered cgpa)
  if (studentInput.cgpa && studentInput.cgpa > 0 && resumeData.cgpa && Math.abs(studentInput.cgpa - resumeData.cgpa) > 0.25) {
    warnings.push({
      field: "CGPA / Percentage",
      enteredValue: studentInput.cgpa,
      extractedValue: resumeData.cgpa,
      warning: `Your entered CGPA (${studentInput.cgpa}) differs from the CGPA detected in your resume (${resumeData.cgpa}). Please review before submitting to prevent disqualification during verification.`,
      severity: "warning",
    });
  }

  // 2. Graduation Year Mismatch Check (if student entered)
  if (studentInput.graduationYear && resumeData.graduationYear && studentInput.graduationYear !== resumeData.graduationYear) {
    warnings.push({
      field: "Graduation Year",
      enteredValue: studentInput.graduationYear,
      extractedValue: resumeData.graduationYear,
      warning: `Your entered graduation year (${studentInput.graduationYear}) differs from the year found on your resume (${resumeData.graduationYear}).`,
      severity: "warning",
    });
  }

  // 3. Qualification / Degree Mismatch Check
  if (
    resumeData.degree &&
    !studentInput.qualification.toLowerCase().includes(resumeData.degree.toLowerCase()) &&
    !resumeData.degree.toLowerCase().includes(studentInput.qualification.toLowerCase())
  ) {
    warnings.push({
      field: "Qualification / Degree",
      enteredValue: studentInput.qualification,
      extractedValue: resumeData.degree,
      warning: `You selected "${studentInput.qualification}", but your resume mentions "${resumeData.degree}".`,
      severity: "info",
    });
  }

  // 4. Branch / Department Mismatch Check (if student entered)
  if (
    studentInput.branch &&
    resumeData.branch &&
    !studentInput.branch.toLowerCase().includes(resumeData.branch.toLowerCase()) &&
    !resumeData.branch.toLowerCase().includes(studentInput.branch.toLowerCase())
  ) {
    warnings.push({
      field: "Branch / Department",
      enteredValue: studentInput.branch,
      extractedValue: resumeData.branch,
      warning: `You entered "${studentInput.branch}", while resume indicates "${resumeData.branch}".`,
      severity: "info",
    });
  }

  // 5. Name match heuristic
  if (resumeData.name && resumeData.name.length > 2) {
    const normEntered = studentInput.name.toLowerCase().replace(/[^a-z]/g, "");
    const normExtracted = resumeData.name.toLowerCase().replace(/[^a-z]/g, "");
    if (!normEntered.includes(normExtracted) && !normExtracted.includes(normEntered)) {
      warnings.push({
        field: "Full Name",
        enteredValue: studentInput.name,
        extractedValue: resumeData.name,
        warning: `The name on the resume appears as "${resumeData.name}", which doesn't match "${studentInput.name}". Please ensure you uploaded your own resume.`,
        severity: "warning",
      });
    }
  }

  return warnings;
}
