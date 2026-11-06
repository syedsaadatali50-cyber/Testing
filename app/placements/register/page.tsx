"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Trash2,
  RefreshCw,
  Building2,
  Calendar,
  Briefcase,
  User,
  Phone,
  Mail,
  GraduationCap,
  ShieldCheck,
  Download,
  Check,
  CheckSquare,
  Square,
  Clock,
  MapPin,
  Send,
} from "lucide-react";

interface MismatchWarning {
  field: string;
  enteredValue: string | number;
  extractedValue: string | number;
  warning: string;
  severity: "warning" | "info";
}

interface EvaluatedRole {
  companyId: string;
  companyName: string;
  companyLogo?: string | null;
  companyDescription?: string;
  jobRoleId: string;
  roleName: string;
  status: "Eligible" | "Partially Eligible" | "Not Eligible";
  score: number;
  matchedCriteria: string[];
  missingCriteria: string[];
  matchedSkills: string[];
  missingSkills: string[];
  missingPreferredSkills?: string[];
  explanation: string;
  salaryPackage?: string | null;
  minimumCgpa: number;
}

interface EligibilityData {
  eligibleRoles: EvaluatedRole[];
  partiallyEligibleRoles: EvaluatedRole[];
  notEligibleRoles: EvaluatedRole[];
  totalChecked: number;
}

export default function PlacementRegistrationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegistrationContent />
    </Suspense>
  );
}

function RegistrationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const targetDriveId = searchParams.get("driveId") || "";

  // Step state: 1 = Form & Upload, 2 = AI Analyzing, 3 = Eligibility & User Company Choice, 4 = Confirmation, 5 = Success
  const [step, setStep] = useState<number>(1);

  // Form Fields (Backlogs, Graduation Year, CGPA, Skills, Branch removed from form as they are in resume)
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [gender, setGender] = useState("Male");
  const [qualification, setQualification] = useState("B.TECH");
  const [cgpa, setCgpa] = useState<string>("");

  // File Upload State
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Analysis & Results State
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [analysisStatusText, setAnalysisStatusText] = useState("Reading document text...");
  const [resumeUrl, setResumeUrl] = useState("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [mismatchWarnings, setMismatchWarnings] = useState<MismatchWarning[]>([]);
  const [eligibility, setEligibility] = useState<EligibilityData | null>(null);
  const [driveInfo, setDriveInfo] = useState<any>(null);

  // USER'S CHOICE: Selected companies / roles for registration
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Confirmation & Submission State
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationResult, setRegistrationResult] = useState<{
    registrationId: string;
    studentId: string;
    interviewSchedule?: {
      dayAndDate: string;
      time: string;
      venue: string;
    };
    selectedCompanies?: string[];
  } | null>(null);

  // File selection
  const handleFileChange = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext || "")) {
      setErrors((prev) => ({
        ...prev,
        resume: "Invalid file type. Please upload a PDF, DOC, or DOCX resume.",
      }));
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        resume: "File size exceeds 10MB limit.",
      }));
      return;
    }

    setErrors((prev) => {
      const next = { ...prev };
      delete next.resume;
      return next;
    });

    setFile(selectedFile);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 25;
      });
    }, 80);
  };

  const removeFile = () => {
    setFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Validate Step 1 form fields (CGPA removed since it will be in resume)
  const validateForm = () => {
    const err: Record<string, string> = {};
    if (!name.trim()) err.name = "Full Name is required.";
    if (!phone.trim() || phone.trim().length < 10)
      err.phone = "Valid 10-digit Phone Number is required.";
    if (!email.trim() || !email.includes("@"))
      err.email = "Valid Email Address is required for interview dispatch.";
    if (!qualification) err.qualification = "Qualification is required.";

    if (!file) {
      err.resume = "Resume upload is required (PDF, DOC, DOCX).";
    }

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  // Trigger AI Analysis
  const handleAnalyzeResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setStep(2);
    setAnalyzingProgress(15);
    setAnalysisStatusText("Uploading resume securely to TGMSC&CCC engine...");

    const formData = new FormData();
    formData.append("resume", file!);
    formData.append("name", name);
    formData.append("phone", phone);
    formData.append("email", email);
    formData.append("gender", gender);
    formData.append("qualification", qualification);
    if (targetDriveId) formData.append("driveId", targetDriveId);

    const timer1 = setTimeout(() => {
      setAnalyzingProgress(45);
      setAnalysisStatusText("AI extracting branch, graduation year, CGPA, and technical skills from resume...");
    }, 600);

    const timer2 = setTimeout(() => {
      setAnalyzingProgress(75);
      setAnalysisStatusText("Cross-referencing resume against company eligibility criteria...");
    }, 1400);

    try {
      const res = await fetch("/api/placements/analyze-resume", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setAnalyzingProgress(100);
      setAnalysisStatusText("Analysis complete!");

      setTimeout(() => {
        setResumeUrl(data.resumeUrl);
        setParsedData(data.parsedData);
        if (data.effectiveCgpa) {
          setCgpa(String(data.effectiveCgpa));
        } else if (data.parsedData?.cgpa) {
          setCgpa(String(data.parsedData.cgpa));
        }
        setMismatchWarnings(data.mismatchWarnings || []);
        setEligibility(data.eligibility);
        setDriveInfo(data.drive);

        // USER'S CHOICE: Initialize selected roles with all fully eligible roles
        const initialSelected = (data.eligibility?.eligibleRoles || []).map(
          (r: EvaluatedRole) => r.jobRoleId
        );
        setSelectedRoleIds(initialSelected);

        setStep(3); // Go to results & selection
        window.scrollTo({ top: 0, behavior: "smooth" });
      }, 400);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      alert(err.message || "Failed to analyze resume. Please try again.");
      setStep(1);
    }
  };

  // Toggle company/role selection (USER CHOICE)
  const toggleRoleSelection = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const selectAllEligible = () => {
    if (!eligibility) return;
    const all = eligibility.eligibleRoles.map((r) => r.jobRoleId);
    setSelectedRoleIds(all);
  };

  const deselectAll = () => {
    setSelectedRoleIds([]);
  };

  // Helper to get selected role objects
  const getSelectedRoleObjects = (): EvaluatedRole[] => {
    if (!eligibility) return [];
    const allEvaluated = [
      ...eligibility.eligibleRoles,
      ...eligibility.partiallyEligibleRoles,
    ];
    return allEvaluated.filter((r) => selectedRoleIds.includes(r.jobRoleId));
  };

  // Final Registration Submission (Store to Excel + Send Email + Prisma)
  const handleSubmitRegistration = async () => {
    if (!confirmChecked) {
      alert("Please confirm the verification checkbox before submitting.");
      return;
    }
    if (selectedRoleIds.length === 0) {
      alert("Please select at least one company to apply for.");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedRolesList = getSelectedRoleObjects().map((r) => ({
        companyId: r.companyId,
        companyName: r.companyName,
        jobRoleId: r.jobRoleId,
        roleName: r.roleName,
        status: r.status,
      }));

      const res = await fetch("/api/placements/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          email,
          gender,
          qualification,
          resumeUrl,
          driveId: driveInfo?.id || targetDriveId,
          parsedResumeData: parsedData,
          eligibilityResults: eligibility,
          selectedRoles: selectedRolesList, // USER'S CHOSEN COMPANIES!
          mismatchWarnings,
          confirmed: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration submission failed.");
      }

      setRegistrationResult({
        registrationId: data.registrationId,
        studentId: data.studentId,
        interviewSchedule: data.interviewSchedule,
        selectedCompanies: data.selectedCompanies,
      });
      setStep(5); // Registration Successful
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: any) {
      alert(err.message || "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Official Government & Institution Banner */}
      <div className="text-center space-y-3 border-b border-emerald-200/80 pb-6">
        <div className="flex items-center justify-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shadow-sm border border-emerald-200">
            <Image
              src="/images/tgmsc_logo.png"
              alt="Government of Telangana"
              width={44}
              height={44}
              className="object-contain"
            />
          </div>
          <div className="text-left">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-800 block">
              Government of Telangana &bull; Minorities Welfare Department
            </span>
            <span className="text-sm font-bold text-slate-800 block">
              Telangana Minorities Study Circle &amp; Career Counselling Centre (TGMSC&amp;CCC)
            </span>
          </div>
          <div className="w-12 h-12 bg-white rounded-lg p-1 hidden sm:flex items-center justify-center shadow-sm border border-emerald-200">
            <Image
              src="/images/tgmsc_emblem.png"
              alt="Taleem Se Taraqqi"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-emerald-950 tracking-tight">
          Placement Drive Registration
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 font-medium leading-relaxed">
          Register for the upcoming placement drive. Upload your resume to check your eligibility for the participating companies and job roles.
        </p>
      </div>

      {/* STEP 1: Registration Form & Resume Upload */}
      {step === 1 && (
        <form onSubmit={handleAnalyzeResume} className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-700" />
                Student Registration Details
              </h2>
              <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                Branch, Year, CGPA, Backlogs &amp; Skills auto-extracted from Resume
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                    errors.name ? "border-rose-500 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
                {errors.name && <p className="text-xs text-rose-500">{errors.name}</p>}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. candidate@gmail.com"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                    errors.email ? "border-rose-500 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
                <p className="text-[11px] text-slate-400">Confirmation email &amp; interview appointment will be sent here.</p>
                {errors.email && <p className="text-xs text-rose-500">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                    errors.phone ? "border-rose-500 bg-rose-50/30" : "border-slate-300"
                  }`}
                />
                {errors.phone && <p className="text-xs text-rose-500">{errors.phone}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Qualification (Matches live TGMSC portal options) */}
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Qualification <span className="text-rose-500">*</span>
                </label>
                <select
                  value={qualification}
                  onChange={(e) => setQualification(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                >
                  <option value="B.TECH">B.TECH (Bachelor of Technology / Engineering)</option>
                  <option value="B.SC">B.SC (Bachelor of Science)</option>
                  <option value="B.A">B.A (Bachelor of Arts)</option>
                  <option value="B.B.A">B.B.A (Bachelor of Business Administration)</option>
                  <option value="ITI / Diploma">ITI / Diploma</option>
                  <option value="Inter">Inter (Intermediate / 10+2)</option>
                  <option value="SSC">SSC (10th Standard)</option>
                  <option value="Other">Other Degree / Qualification</option>
                </select>
              </div>
            </div>

            {/* Smart Resume Analysis info notice */}
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-emerald-950">Direct AI Resume Extraction:</span> Your department / branch, graduation year, academic CGPA / percentage, technical skills, and active backlog status will be automatically parsed directly from your uploaded resume.
              </div>
            </div>
          </div>

          {/* RESUME UPLOAD SECTION (PDF, DOC, DOCX with name, size, progress, remove, replace) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-700" />
                  Resume Upload
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Supports PDF, DOC, and DOCX formats (Max 10MB).
                </p>
              </div>
              <span className="text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-1 rounded-md">
                AI Powered Extraction
              </span>
            </div>

            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileChange(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {!file ? (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileChange(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/50"
                    : "border-slate-300 hover:border-emerald-500 hover:bg-slate-50"
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Click to upload or drag &amp; drop your resume here
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  Accepted formats: PDF, DOC, DOCX (Max 10MB)
                </p>
                {errors.resume && (
                  <p className="text-xs font-semibold text-rose-500 mt-3">{errors.resume}</p>
                )}
              </div>
            ) : (
              /* Selected File Card: Shows file name, size, progress, remove, replace */
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-lg bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 truncate max-w-sm sm:max-w-md">
                        {file.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        File Size: {(file.size / 1024).toFixed(1)} KB &bull; Type:{" "}
                        {file.name.split(".").pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  {/* Actions: Replace file, Remove file */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Replace</span>
                    </button>

                    <button
                      type="button"
                      onClick={removeFile}
                      className="px-3 py-1.5 text-xs font-bold text-rose-600 bg-white border border-rose-200 rounded-lg hover:bg-rose-50 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>

                {/* Upload Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-600">
                      {uploadProgress < 100 ? "Uploading file..." : "Uploaded & Ready for AI Analysis"}
                    </span>
                    <span className="text-emerald-700">{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-emerald-600 transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Step 1 Button */}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/placements"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Placement Drives
            </Link>

            <button
              type="submit"
              className="px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-700/20 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Analyze Resume &amp; Check Eligibility</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: AI Resume Processing & Scanning animation */}
      {step === 2 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-6 shadow-sm">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-300 animate-ping opacity-25"></div>
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-800 to-teal-700 flex items-center justify-center text-white shadow-xl shadow-emerald-700/20">
              <Sparkles className="w-9 h-9 animate-spin text-amber-300" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">
              AI Analyzing Resume
            </h3>
            <p className="text-xs text-slate-500">{analysisStatusText}</p>
          </div>

          {/* Scanning Progress */}
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${analyzingProgress}%` }}
            />
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Extracting CGPA &bull; Branch &bull; Passing Year &bull; Technical Skills &bull; Cross-checking Criteria
          </div>
        </div>
      )}

      {/* STEP 3: Mismatch Warning + Eligibility Results + USER'S CHOICE TO SELECT COMPANIES */}
      {step === 3 && eligibility && (
        <div className="space-y-8">
          {/* Mismatch Warning Section if detected */}
          {mismatchWarnings.length > 0 && (
            <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-6 space-y-3 shadow-sm">
              <div className="flex items-center gap-2.5 text-amber-900">
                <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                <h3 className="text-base font-bold">
                  Resume Discrepancy Detected &mdash; Please Review
                </h3>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed">
                Our AI resume parser detected differences between your uploaded resume and the registration form details you filled. Please verify these items before submitting your final application.
              </p>

              <div className="space-y-2 pt-2">
                {mismatchWarnings.map((mw, idx) => (
                  <div
                    key={idx}
                    className="bg-white rounded-lg p-3 border border-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs"
                  >
                    <div>
                      <span className="font-bold text-amber-950 uppercase tracking-wider text-[11px] block">
                        {mw.field}
                      </span>
                      <p className="text-slate-700 mt-0.5">{mw.warning}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[11px]">
                      <div className="bg-slate-100 px-2 py-1 rounded">
                        <span className="text-slate-400">Entered:</span>{" "}
                        <span className="font-bold text-slate-800">{mw.enteredValue}</span>
                      </div>
                      <div className="bg-amber-100 text-amber-900 px-2 py-1 rounded">
                        <span className="text-amber-700">Resume:</span>{" "}
                        <span className="font-bold">{mw.extractedValue}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Extracted Profile Highlights (Extracted directly from resume) */}
          {parsedData && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-base font-bold text-slate-900">
                    AI Resume Extraction Overview
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-medium">
                  Extracted from <span className="font-bold text-slate-800">{file?.name}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 text-[11px] uppercase font-bold block">
                    Extracted Branch
                  </span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {parsedData.branch || "Engineering / Science"}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 text-[11px] uppercase font-bold block">
                    Graduation Year
                  </span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">
                    {parsedData.graduationYear || 2026}
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 text-[11px] uppercase font-bold block">
                    Active Backlogs
                  </span>
                  <span className="font-bold text-emerald-700 text-sm mt-0.5 block">
                    {parsedData.backlogs || 0} (Clean)
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/80">
                  <span className="text-slate-400 text-[11px] uppercase font-bold block">
                    Resume CGPA / Score
                  </span>
                  <span className="font-bold text-emerald-800 text-sm mt-0.5 block">
                    {parsedData.cgpa ? `${parsedData.cgpa} / 10.0` : (cgpa ? `${cgpa} / 10.0` : "7.5 / 10.0")}
                  </span>
                </div>
              </div>

              {/* Extracted Skills Chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-xs font-bold text-slate-600">
                  AI-Detected Technical Skills ({parsedData.technicalSkills?.length || 0}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {parsedData.technicalSkills?.map((sk: string, i: number) => (
                    <span
                      key={i}
                      className="text-[11px] bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-200"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* USER'S CHOICE SELECTION BANNER */}
          <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-900 text-white rounded-2xl p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-emerald-800">
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
                Candidate Choice &bull; Select Openings
              </span>
              <h3 className="text-xl font-black mt-0.5">
                Select Which Eligible Openings You Wish to Apply For
              </h3>
              <p className="text-xs text-emerald-100/90 mt-1">
                Sign in and select any job openings you&apos;d like to be considered for. All selections will be saved directly into the master Excel sheet.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={selectAllEligible}
                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 rounded-lg text-xs font-bold text-emerald-950 transition-colors"
              >
                Select All Eligible
              </button>
              <button
                type="button"
                onClick={deselectAll}
                className="px-3.5 py-2 bg-emerald-900/80 hover:bg-emerald-800 border border-emerald-700 rounded-lg text-xs font-bold text-emerald-200 transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>

          {/* MAIN RESULTS SECTION AS SPECIFIED:
              "Your Placement Drive Eligibility" */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Your Placement Drive Eligibility
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Select the checkboxes next to the companies you want to register with.
                </p>
              </div>

              {/* Status summary pill counts */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-950 border border-emerald-300">
                  {selectedRoleIds.length} Selected by You
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {eligibility.eligibleRoles.length} Eligible
                </span>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  {eligibility.partiallyEligibleRoles.length} Partially Eligible
                </span>
              </div>
            </div>

            {/* 1. ELIGIBLE COMPANIES (With User Selection Checkbox) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-600" />
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Eligible Companies ({eligibility.eligibleRoles.length})
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Click card or checkbox to select/unselect
                </span>
              </div>

              {eligibility.eligibleRoles.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-500">
                  No fully eligible roles match your current profile criteria. Check the partially eligible section below.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eligibility.eligibleRoles.map((role) => {
                    const isSelected = selectedRoleIds.includes(role.jobRoleId);
                    return (
                      <div
                        key={role.jobRoleId}
                        onClick={() => toggleRoleSelection(role.jobRoleId)}
                        className={`bg-white rounded-xl border-2 p-5 shadow-sm space-y-4 relative overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/15"
                            : "border-emerald-400 hover:border-emerald-500"
                        }`}
                      >
                        {/* Status + Selection Badge */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // handled by parent onClick
                              className="w-5 h-5 rounded text-emerald-700 focus:ring-emerald-500 cursor-pointer"
                            />
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? "text-emerald-800" : "text-slate-500"
                              }`}
                            >
                              {isSelected ? "Selected for Registration ✓" : "Click to Select"}
                            </span>
                          </div>

                          <span className="bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Eligible
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                            {role.companyLogo ? (
                              <img
                                src={role.companyLogo}
                                alt={role.companyName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building2 className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900">
                              {role.companyName}
                            </h4>
                            <p className="text-xs font-bold text-emerald-800">{role.roleName}</p>
                            {role.salaryPackage && (
                              <span className="text-[11px] font-bold text-slate-600 block mt-0.5">
                                Package: {role.salaryPackage}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Why you are eligible */}
                        <div className="space-y-1.5 bg-emerald-50/70 rounded-lg p-3 text-xs border border-emerald-200">
                          <span className="font-bold text-emerald-900 block text-[11px] uppercase tracking-wider">
                            Why you are eligible:
                          </span>
                          <ul className="space-y-1 text-emerald-950 font-medium">
                            {role.matchedCriteria.map((mc, mIdx) => (
                              <li key={mIdx} className="flex items-start gap-1.5">
                                <span className="text-emerald-600 font-bold">&bull;</span>
                                <span>{mc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Eligibility Score */}
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-500 font-medium">Eligibility Score:</span>
                          <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            {role.score}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. PARTIALLY ELIGIBLE (User can optionally select as well) */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Partially Eligible ({eligibility.partiallyEligibleRoles.length})
                  </h3>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Optional to apply &bull; Subject to interview review
                </span>
              </div>

              {eligibility.partiallyEligibleRoles.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-500">
                  No partially eligible roles.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eligibility.partiallyEligibleRoles.map((role) => {
                    const isSelected = selectedRoleIds.includes(role.jobRoleId);
                    return (
                      <div
                        key={role.jobRoleId}
                        onClick={() => toggleRoleSelection(role.jobRoleId)}
                        className={`bg-white rounded-xl border-2 p-5 shadow-sm space-y-4 relative overflow-hidden cursor-pointer transition-all ${
                          isSelected
                            ? "border-amber-500 ring-2 ring-amber-400/20 bg-amber-50/20"
                            : "border-amber-300 hover:border-amber-400"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="w-5 h-5 rounded text-amber-600 focus:ring-amber-500 cursor-pointer"
                            />
                            <span
                              className={`text-xs font-bold ${
                                isSelected ? "text-amber-800" : "text-slate-500"
                              }`}
                            >
                              {isSelected ? "Selected for Registration ✓" : "Click to Select"}
                            </span>
                          </div>

                          <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Partially Eligible
                          </span>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                            {role.companyLogo ? (
                              <img
                                src={role.companyLogo}
                                alt={role.companyName}
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <Building2 className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900">
                              {role.companyName}
                            </h4>
                            <p className="text-xs font-bold text-amber-800">{role.roleName}</p>
                            {role.salaryPackage && (
                              <span className="text-[11px] font-bold text-slate-600 block mt-0.5">
                                Package: {role.salaryPackage}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Missing skills / criteria */}
                        <div className="space-y-1.5 bg-amber-50/70 rounded-lg p-3 text-xs border border-amber-200">
                          <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                            Missing Requirements:
                          </span>
                          <ul className="space-y-1 text-amber-950 font-medium">
                            {role.missingSkills.map((ms, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">&minus;</span>
                                <span>{ms} skill</span>
                              </li>
                            ))}
                            {role.missingCriteria.map((mc, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-600 font-bold">&minus;</span>
                                <span>{mc}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-500 font-medium">Eligibility Score:</span>
                          <span className="text-sm font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            {role.score}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. NOT ELIGIBLE */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <h3 className="text-lg font-extrabold text-slate-900">
                  Not Eligible ({eligibility.notEligibleRoles.length})
                </h3>
              </div>

              {eligibility.notEligibleRoles.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-center text-xs text-slate-500">
                  All roles match your profile!
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {eligibility.notEligibleRoles.map((role) => (
                    <div
                      key={role.jobRoleId}
                      className="bg-white rounded-xl border border-rose-200 p-5 shadow-sm space-y-4 relative opacity-90"
                    >
                      <div className="absolute top-0 right-0 bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-0.5 rounded-bl-lg flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Not Eligible
                      </div>

                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                          {role.companyLogo ? (
                            <img
                              src={role.companyLogo}
                              alt={role.companyName}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Building2 className="w-6 h-6 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="text-base font-extrabold text-slate-900">
                            {role.companyName}
                          </h4>
                          <p className="text-xs font-bold text-slate-600">{role.roleName}</p>
                        </div>
                      </div>

                      {/* 1. Rule-based mandatory reason (Why they aren't eligible) */}
                      <div className="space-y-1.5 bg-rose-50/80 rounded-lg p-3.5 text-xs border border-rose-200">
                        <span className="font-bold text-rose-950 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          Why You Are Not Eligible:
                        </span>
                        <ul className="space-y-1 text-rose-950 font-medium">
                          {role.missingCriteria.map((reason, idx) => (
                            <li key={idx} className="flex items-start gap-1.5">
                              <span className="text-rose-600 font-bold">&times;</span>
                              <span>{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 2. Skills Lacked for this Specified Company */}
                      <div className="space-y-2 bg-slate-50 rounded-lg p-3.5 text-xs border border-slate-200">
                        <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          Skills You Lack for {role.companyName}:
                        </span>
                        {role.missingSkills && role.missingSkills.length > 0 ? (
                          <div className="space-y-1.5">
                            <p className="text-slate-600 text-[11px]">
                              To qualify for this role, you need to acquire the following required skills:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {role.missingSkills.map((skill, sIdx) => (
                                <span
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-rose-100 text-rose-800 text-[11px] font-bold border border-rose-200"
                                >
                                  <span className="text-rose-500 font-bold">&minus;</span> {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-emerald-800 bg-emerald-50/80 p-2 rounded border border-emerald-200 text-[11px] font-medium flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Your technical skills matched this profile, but you did not meet the mandatory criteria above (CGPA / branch / backlogs).</span>
                          </div>
                        )}

                        {role.missingPreferredSkills && role.missingPreferredSkills.length > 0 && (
                          <div className="pt-1.5 border-t border-slate-200/70 space-y-1">
                            <span className="text-[10px] font-bold text-slate-500 uppercase">
                              Preferred / Recommended Skills Lacking:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {role.missingPreferredSkills.map((ps, psIdx) => (
                                <span
                                  key={psIdx}
                                  className="px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 text-[10px] font-medium"
                                >
                                  {ps}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-slate-500 font-medium">Evaluation Score:</span>
                        <span className="text-xs font-black text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                          {role.score}% &bull; Mandatory Disqualification
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Navigation to Confirmation Step */}
          <div className="flex items-center justify-between pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Edit Details &amp; Re-upload
            </button>

            <button
              type="button"
              disabled={selectedRoleIds.length === 0}
              onClick={() => {
                if (selectedRoleIds.length === 0) {
                  alert("Please select at least one company to apply for.");
                  return;
                }
                setStep(4);
              }}
              className={`px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
                selectedRoleIds.length > 0
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20 hover:scale-[1.02]"
                  : "bg-slate-300 text-slate-500 cursor-not-allowed"
              }`}
            >
              <span>Confirm {selectedRoleIds.length} Selected Openings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Confirmation Screen & Submission */}
      {step === 4 && eligibility && (
        <div className="space-y-8 max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Your Registration Details
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review your profile and your chosen companies before final submission.
              </p>
            </div>

            {/* Student Data Table */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[11px] block">Full Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{name}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[11px] block">Email Address</span>
                <span className="font-bold text-slate-800 text-sm">{email}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[11px] block">Phone Number</span>
                <span className="font-bold text-slate-800 text-sm">{phone}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[11px] block">Qualification</span>
                <span className="font-bold text-slate-800 text-sm">{qualification}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[11px] block">Branch (From Resume)</span>
                <span className="font-bold text-slate-800 text-sm">{parsedData?.branch || "Engineering / Science"}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[11px] block">Graduation Batch</span>
                <span className="font-bold text-slate-800 text-sm">{parsedData?.graduationYear || 2026}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[11px] block">CGPA (From Resume)</span>
                <span className="font-bold text-slate-800 text-sm">{parsedData?.cgpa ? `${parsedData.cgpa} / 10.0` : (cgpa ? `${cgpa} / 10.0` : "7.5 / 10.0")}</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[11px] block">Attached Resume</span>
                <span className="font-bold text-emerald-800 text-sm truncate block">{file?.name}</span>
              </div>
            </div>

            {/* USER'S CHOICE SELECTED COMPANIES PREVIEW */}
            <div className="space-y-2 pt-2 bg-emerald-50/60 p-4 rounded-xl border border-emerald-200">
              <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider block">
                Your Selected Openings for Interview ({selectedRoleIds.length}):
              </span>
              <div className="flex flex-wrap gap-2">
                {getSelectedRoleObjects().map((er) => (
                  <span
                    key={er.jobRoleId}
                    className="inline-flex items-center gap-1.5 bg-white text-emerald-950 border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold shadow-xs"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                    {er.companyName} &mdash; {er.roleName}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-emerald-800 mt-1">
                An automatic confirmation email with your interview date and time will be dispatched immediately upon submission, and this data will be stored in the master Excel spreadsheet.
              </p>
            </div>

            {/* Required Confirmation Checkbox */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmChecked}
                  onChange={(e) => setConfirmChecked(e.target.checked)}
                  className="w-5 h-5 mt-0.5 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
                />
                <span className="text-xs sm:text-sm font-semibold text-slate-800 leading-snug">
                  I confirm that the information provided by me is correct.
                </span>
              </label>
            </div>

            {/* Submit Placement Registration Button */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Company Selection
              </button>

              <button
                type="button"
                disabled={!confirmChecked || isSubmitting}
                onClick={handleSubmitRegistration}
                className={`px-8 py-3.5 rounded-xl text-white font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${
                  confirmChecked && !isSubmitting
                    ? "bg-emerald-700 hover:bg-emerald-800 shadow-emerald-700/30 hover:scale-[1.02]"
                    : "bg-slate-300 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Confirming Registration &amp; Dispatching Email...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Placement Registration</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 5: Registration Successful Screen with Automated Email & Interview Schedule */}
      {step === 5 && registrationResult && (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-md space-y-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm border border-emerald-300">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Registration Successful
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Registration Confirmed!
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your placement drive registration has been successfully submitted and saved.
            </p>
          </div>

          {/* Registration ID Banner as specified */}
          <div className="bg-emerald-950 text-white rounded-xl p-5 space-y-1 border border-emerald-800">
            <span className="text-[11px] uppercase tracking-widest text-emerald-300 font-bold">
              Your Unique Registration ID
            </span>
            <div className="text-2xl sm:text-3xl font-black tracking-wider text-amber-300 font-mono">
              {registrationResult.registrationId}
            </div>
            <p className="text-[11px] text-emerald-200/80">
              Preserve this ID for entry at the recruitment centre and interview rounds.
            </p>
          </div>

          {/* AUTOMATED EMAIL & INTERVIEW SCHEDULE NOTICE AS SPECIFIED */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-xl p-6 text-left space-y-4">
            <div className="flex items-center gap-2 text-emerald-900">
              <Send className="w-5 h-5 text-emerald-700" />
              <h3 className="text-sm font-bold">
                Automatic Confirmation Email Dispatched to {email}
              </h3>
            </div>

            <div className="p-4 bg-white rounded-lg border border-emerald-200 space-y-2 text-xs text-slate-800">
              <div className="font-bold text-emerald-900 text-sm flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <span>Your Interview Appointment Details:</span>
              </div>
              <p className="text-slate-700 leading-relaxed">
                Your registration has been confirmed and you can come to interview on:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 font-semibold text-xs">
                <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Day &amp; Date</span>
                  <span className="text-slate-900">{registrationResult.interviewSchedule?.dayAndDate || "Wednesday, November 25, 2026"}</span>
                </div>
                <div className="bg-emerald-50/50 p-2 rounded border border-emerald-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Reporting Time</span>
                  <span className="text-slate-900">{registrationResult.interviewSchedule?.time || "09:30 AM IST"}</span>
                </div>
                <div className="sm:col-span-2 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Venue</span>
                  <span className="text-slate-900">{registrationResult.interviewSchedule?.venue || "TGMSC&CCC Central Career Centre, Minorities Study Circle Complex, Hyderabad, Telangana"}</span>
                </div>
              </div>
            </div>

            {/* Selected Companies List */}
            {registrationResult.selectedCompanies && registrationResult.selectedCompanies.length > 0 && (
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-slate-700">
                  Companies You Selected for Interview:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {registrationResult.selectedCompanies.map((c, idx) => (
                    <span
                      key={idx}
                      className="bg-emerald-100 text-emerald-900 border border-emerald-300 px-2.5 py-1 rounded text-xs font-bold"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* EXCEL SHEET STORAGE CONFIRMATION */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-left flex items-start gap-3 text-xs text-slate-700">
            <FileText className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Stored in Placement Master Excel Sheet:</span>
              <p className="text-slate-600 mt-0.5">
                All your submitted registration information, AI-extracted resume attributes, and selected companies have been recorded in the placement master Excel spreadsheet (<span className="font-mono text-slate-800">Placement_Registrations_Master.xlsx</span>).
              </p>
            </div>
          </div>

          {/* Actions - No Student Dashboard */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="w-full sm:w-auto px-6 py-3 bg-[#0f6e4d] hover:bg-[#0a3d24] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Print Registration Slip</span>
            </button>

            <Link
              href="/placements"
              className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors text-center"
            >
              Back to Job Openings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
