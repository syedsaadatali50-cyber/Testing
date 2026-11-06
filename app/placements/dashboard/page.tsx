"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  UserCheck,
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Download,
  Building2,
  Calendar,
  Sparkles,
  Search,
  ExternalLink,
  GraduationCap,
  Award,
  ArrowRight,
  ShieldCheck,
  Check,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function StudentDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";

  const [registrationIdInput, setRegistrationIdInput] = useState(initialId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "eligibility" | "details">("overview");

  // Fetch student registration
  const fetchStudentData = async (regId: string) => {
    if (!regId.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/placements/student/${encodeURIComponent(regId.trim())}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Registration not found");
      }
      setData(json.registration);
    } catch (err: any) {
      setError(err.message || "Failed to load registration details.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialId) {
      fetchStudentData(initialId);
    }
  }, [initialId]);

  // Download Registration Details as PDF
  const downloadRegistrationPdf = () => {
    if (!data) return;

    const doc = new jsPDF();

    // TGMSC&CCC Header
    doc.setFillColor(10, 61, 36); // #0a3d24 Emerald
    doc.rect(0, 0, 210, 36, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.text("TGMSC&CCC — GOVERNMENT OF TELANGANA", 14, 16);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Telangana Minorities Study Circle & Career Counselling Centre — Drive Registration Slip", 14, 24);

    doc.setFontSize(8);
    doc.text(`Official Slip Generated: ${new Date().toLocaleDateString()}`, 14, 30);

    // Registration ID Stamp
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`REGISTRATION ID: ${data.registrationId}`, 14, 46);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Placement Drive: ${data.drive.name}`, 14, 53);
    doc.text(`Drive Status: ${data.status} | Verified`, 14, 59);

    // Candidate details table
    autoTable(doc, {
      startY: 65,
      head: [["Candidate Profile Attribute", "Registered Information"]],
      body: [
        ["Full Name", data.student.name],
        ["Email Address", data.student.email],
        ["Phone Number", data.student.phone],
        ["Gender", data.student.gender],
        ["Degree & Qualification", data.student.qualification],
        ["Department / Branch", data.student.branch],
        ["Graduation Batch", `${data.student.graduationYear}`],
        ["Academic CGPA", `${data.student.cgpa} / 10.0`],
        ["Active Backlogs", `${data.student.backlogs}`],
        ["Resume Document", "Verified & Analyzed by AI Placement Engine"],
      ],
      theme: "striped",
      headStyles: { fillColor: [15, 110, 77] },
      styles: { fontSize: 8.5 },
    });

    // Eligible companies table
    const eligibleRows = data.eligibilitySummary.eligibleResults.map((r: any) => [
      r.company.name,
      r.jobRole.roleName,
      "Eligible",
      `${r.score}%`,
      r.jobRole.salaryPackage || "Standard",
    ]);

    const partiallyRows = data.eligibilitySummary.partiallyEligibleResults.map((r: any) => [
      r.company.name,
      r.jobRole.roleName,
      "Partially Eligible",
      `${r.score}%`,
      r.jobRole.salaryPackage || "Standard",
    ]);

    const allTableRows = [...eligibleRows, ...partiallyRows];

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [["Company", "Job Role", "Eligibility Status", "Score", "Package"]],
      body:
        allTableRows.length > 0
          ? allTableRows
          : [["No fully eligible roles", "-", "Pending Verification", "-", "-"]],
      theme: "grid",
      headStyles: { fillColor: [10, 61, 36] },
      styles: { fontSize: 8 },
    });

    // Footer signature notice
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      "Notice: This is an official system-generated registration slip. Please bring this with your ID badge to all drive interview rounds.",
      14,
      finalY
    );
    doc.text("Authorized by TGMSC&CCC Placement Directorate, Minorities Welfare Department, Government of Telangana.", 14, finalY + 6);

    doc.save(`Placement_Registration_${data.registrationId}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            Candidate Portal
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Student Placement Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            View your placement drive registration status, verified eligibility, and participating company shortlists.
          </p>
        </div>

        {/* Lookup / Search Input */}
        <div className="flex items-center gap-2 max-w-md w-full">
          <div className="relative flex-1">
            <input
              type="text"
              value={registrationIdInput}
              onChange={(e) => setRegistrationIdInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") fetchStudentData(registrationIdInput);
              }}
              placeholder="Enter Registration ID (e.g. PD-2026-00001)"
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-mono focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>
          <button
            onClick={() => fetchStudentData(registrationIdInput)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            {loading ? "Searching..." : "Lookup Registration"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs font-semibold flex items-center justify-between">
          <span>{error}</span>
          <Link
            href="/placements/register"
            className="text-xs underline font-bold hover:text-rose-950"
          >
            Register Now
          </Link>
        </div>
      )}

      {!data && !loading && !error && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <UserCheck className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-800">
              Lookup Your Placement Drive Registration
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Please enter your unique Registration ID (e.g.{" "}
              <span className="font-mono font-semibold">PD-2026-00001</span>) received after submitting the registration form.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href="/placements/register"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm"
            >
              <span>New Student Registration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* When student registration data is loaded */}
      {data && (
        <div className="space-y-8">
          {/* STATS TILES AS SPECIFIED IN PROMPT:
              Show:
              Placement Drive Status: Registered ✓
              Resume: Uploaded ✓
              Eligibility Analysis: Completed ✓
              Eligible Companies: 4
              Partially Eligible: 2
              Not Eligible: 3
              Registration ID: PD-2026-00124
              Also provide:
              "View Eligibility"
              "View Registration"
              "Download Registration Details" */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {/* 1. Placement Drive Status */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Drive Status
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm font-black text-emerald-700">Registered</span>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              </div>
            </div>

            {/* 2. Resume */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Resume
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm font-black text-emerald-700">Uploaded</span>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              </div>
            </div>

            {/* 3. Eligibility Analysis */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Analysis
              </span>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm font-black text-emerald-700">Completed</span>
                <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
              </div>
            </div>

            {/* 4. Eligible Companies */}
            <div className="bg-white rounded-xl border-2 border-emerald-500 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                Eligible Roles
              </span>
              <div className="text-2xl font-black text-emerald-600 mt-0.5">
                {data.eligibilitySummary.eligibleCount}
              </div>
            </div>

            {/* 5. Partially Eligible */}
            <div className="bg-white rounded-xl border border-amber-300 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider block">
                Partially Eligible
              </span>
              <div className="text-2xl font-black text-amber-600 mt-0.5">
                {data.eligibilitySummary.partiallyEligibleCount}
              </div>
            </div>

            {/* 6. Not Eligible */}
            <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-rose-700 tracking-wider block">
                Not Eligible
              </span>
              <div className="text-2xl font-black text-rose-600 mt-0.5">
                {data.eligibilitySummary.notEligibleCount}
              </div>
            </div>

            {/* 7. Registration ID */}
            <div className="col-span-2 sm:col-span-4 lg:col-span-1 bg-slate-900 text-white rounded-xl p-4 shadow-xs flex flex-col justify-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Registration ID
              </span>
              <div className="text-sm font-mono font-black text-cyan-400 mt-0.5 truncate">
                {data.registrationId}
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons as requested */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "overview"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                Dashboard Overview
              </button>

              <button
                onClick={() => setActiveTab("eligibility")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  activeTab === "eligibility"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span>View Eligibility</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 text-emerald-800">
                  {data.eligibilitySummary.eligibleCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("details")}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
                  activeTab === "details"
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                View Registration
              </button>
            </div>

            {/* Download Registration Details (PDF) */}
            <button
              onClick={downloadRegistrationPdf}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Download Registration Details (PDF)</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & RESUME ANALYSIS */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg">
                      {data.student.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{data.student.name}</h3>
                      <p className="text-xs text-slate-500">
                        {data.student.qualification} in {data.student.branch} &bull; Batch{" "}
                        {data.student.graduationYear} &bull; CGPA:{" "}
                        <span className="font-bold text-slate-800">{data.student.cgpa}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={data.student.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      <span>View Uploaded Resume</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>

                {/* Candidate registered technical skills */}
                <div className="pt-4 space-y-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                    Verified Technical Skills:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {data.student.technicalSkills.map((sk: string, sIdx: number) => (
                      <span
                        key={sIdx}
                        className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded text-xs font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Placement Drive Status Details */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      Enrolled Drive
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5">{data.drive.name}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400">
                    Registration Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Drive Date:</span>
                    <div className="font-bold text-white mt-0.5">
                      {new Date(data.drive.driveDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Registration Date:</span>
                    <div className="font-bold text-white mt-0.5">
                      {new Date(data.submittedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Backlogs Status:</span>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      {data.student.backlogs === 0 ? "0 Backlogs (Clear)" : `${data.student.backlogs} Active`}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Participating Companies:</span>
                    <div className="font-bold text-cyan-400 mt-0.5">
                      {data.drive.totalCompanies} Active
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: VIEW ELIGIBILITY BREAKDOWN */}
          {activeTab === "eligibility" && (
            <div className="space-y-6">
              {/* Eligible Roles */}
              <div className="space-y-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  Eligible Companies &amp; Roles ({data.eligibilitySummary.eligibleCount})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.eligibilitySummary.eligibleResults.map((er: any) => {
                    let matched: string[] = [];
                    try {
                      matched = JSON.parse(er.matchedCriteria);
                    } catch {
                      matched = [er.matchedCriteria];
                    }

                    return (
                      <div
                        key={er.id}
                        className="bg-white rounded-xl border-2 border-emerald-500 p-5 shadow-xs space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-base font-extrabold text-slate-900">
                              {er.company.name}
                            </h4>
                            <p className="text-xs font-bold text-blue-700">{er.jobRole.roleName}</p>
                            {er.jobRole.salaryPackage && (
                              <span className="text-[11px] font-semibold text-slate-500">
                                Package: {er.jobRole.salaryPackage}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                            {er.score}% Match
                          </span>
                        </div>

                        <div className="bg-emerald-50 rounded-lg p-3 text-xs space-y-1">
                          <span className="font-bold text-emerald-900 block text-[11px] uppercase">
                            Why you are eligible:
                          </span>
                          <ul className="space-y-0.5 text-emerald-950">
                            {matched.map((m, i) => (
                              <li key={i} className="flex items-center gap-1.5">
                                <span className="text-emerald-600">&bull;</span>
                                <span>{m}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Partially Eligible Roles */}
              {data.eligibilitySummary.partiallyEligibleCount > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                    Partially Eligible Roles ({data.eligibilitySummary.partiallyEligibleCount})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.eligibilitySummary.partiallyEligibleResults.map((er: any) => {
                      let missing: string[] = [];
                      try {
                        missing = JSON.parse(er.missingCriteria);
                      } catch {
                        missing = [er.missingCriteria];
                      }

                      return (
                        <div
                          key={er.id}
                          className="bg-white rounded-xl border border-amber-300 p-5 shadow-xs space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-base font-extrabold text-slate-900">
                                {er.company.name}
                              </h4>
                              <p className="text-xs font-bold text-blue-700">{er.jobRole.roleName}</p>
                            </div>
                            <span className="text-sm font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                              {er.score}% Match
                            </span>
                          </div>

                          <div className="bg-amber-50 rounded-lg p-3 text-xs space-y-1">
                            <span className="font-bold text-amber-900 block text-[11px] uppercase">
                              Missing Requirements:
                            </span>
                            <ul className="space-y-0.5 text-amber-950">
                              {missing.map((m, i) => (
                                <li key={i} className="flex items-center gap-1.5">
                                  <span className="text-amber-600">&minus;</span>
                                  <span>{m}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Not Eligible Roles */}
              {data.eligibilitySummary.notEligibleCount > 0 && (
                <div className="space-y-3 pt-4">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-rose-600" />
                    Not Eligible Roles ({data.eligibilitySummary.notEligibleCount})
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.eligibilitySummary.notEligibleResults.map((er: any) => {
                      let missing: string[] = [];
                      try {
                        missing = JSON.parse(er.missingCriteria);
                      } catch {
                        missing = [er.missingCriteria];
                      }

                      let reqSkills: string[] = [];
                      try {
                        reqSkills = JSON.parse(er.jobRole.requiredSkills || "[]");
                      } catch {
                        reqSkills = er.jobRole.requiredSkills
                          ? er.jobRole.requiredSkills.split(",").map((s: string) => s.trim())
                          : [];
                      }
                      const studentSkills: string[] = (data.student.technicalSkills || []).map((s: string) =>
                        s.toLowerCase()
                      );
                      const missingSkills = reqSkills.filter(
                        (s: string) =>
                          !studentSkills.some(
                            (ss: string) =>
                              ss.includes(s.toLowerCase()) || s.toLowerCase().includes(ss)
                          )
                      );

                      return (
                        <div
                          key={er.id}
                          className="bg-white rounded-xl border border-rose-200 p-5 shadow-xs space-y-3 opacity-95"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <h4 className="text-base font-extrabold text-slate-900">
                                {er.company.name}
                              </h4>
                              <p className="text-xs font-semibold text-slate-500">{er.jobRole.roleName}</p>
                            </div>
                            <span className="text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              Not Eligible
                            </span>
                          </div>

                          <div className="bg-rose-50 rounded-lg p-3 text-xs text-rose-950 space-y-1">
                            <span className="font-bold block text-[11px] text-rose-900 uppercase tracking-wider">
                              Why You Are Not Eligible:
                            </span>
                            <ul className="space-y-1">
                              {missing.map((m, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-rose-600 font-bold">&times;</span>
                                  <span>{m}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-800 space-y-1.5 border border-slate-200">
                            <span className="font-bold block text-[11px] text-slate-700 uppercase tracking-wider">
                              Skills You Lack for {er.company.name}:
                            </span>
                            {missingSkills.length > 0 ? (
                              <div className="flex flex-wrap gap-1 pt-0.5">
                                {missingSkills.map((sk: string, i: number) => (
                                  <span
                                    key={i}
                                    className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px] border border-rose-200"
                                  >
                                    &minus; {sk}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-emerald-800 font-medium">
                                Technical skills matched; ineligibility is due to academic criteria / backlogs.
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: VIEW REGISTRATION DETAILS */}
          {activeTab === "details" && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">
                  Full Placement Registration Record
                </h3>
                <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                  {data.registrationId}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Student Name
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">
                    {data.student.name}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {data.student.email}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Phone Number
                  </span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {data.student.phone}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Gender
                  </span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {data.student.gender}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Qualification
                  </span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {data.student.qualification}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Branch / Department
                  </span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {data.student.branch}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Graduation Year
                  </span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {data.student.graduationYear}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    CGPA / Percentage
                  </span>
                  <span className="font-extrabold text-blue-700 text-sm mt-0.5 block">
                    {data.student.cgpa} / 10.0
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-400 font-bold uppercase text-[10px] block">
                    Active Backlogs
                  </span>
                  <span className="font-semibold text-slate-800 text-sm mt-0.5 block">
                    {data.student.backlogs}
                  </span>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={downloadRegistrationPdf}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Registration Slip</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
