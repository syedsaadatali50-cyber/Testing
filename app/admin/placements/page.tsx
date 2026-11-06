"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Building2,
  Users,
  FileText,
  Briefcase,
  TrendingUp,
  Search,
  Download,
  Plus,
  Edit,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Filter,
  LogOut,
  Lock,
  Mail,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  Eye,
  RefreshCw,
} from "lucide-react";

export default function AdminPlacementPage() {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [loginEmail, setLoginEmail] = useState("admin@college.edu");
  const [loginPassword, setLoginPassword] = useState("adminPassword123!");
  const [showCustomEmailInput, setShowCustomEmailInput] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Password change modal state
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // Active tab: overview | students | companies | drives
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "companies" | "drives">("overview");

  // Stats state
  const [stats, setStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Weekly Drive Scheduler state
  const [weeklyDriveDate, setWeeklyDriveDate] = useState("");
  const [weeklyDeadline, setWeeklyDeadline] = useState("");
  const [weeklyUpdating, setWeeklyUpdating] = useState(false);

  // Student list state & filters
  const [students, setStudents] = useState<any[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterQual, setFilterQual] = useState("");
  const [filterMinCgpa, setFilterMinCgpa] = useState("");
  const [filterCompanyId, setFilterCompanyId] = useState("");
  const [filterJobRoleId, setFilterJobRoleId] = useState("");
  const [filterEligibilityStatus, setFilterEligibilityStatus] = useState("");
  const [shortlistCount, setShortlistCount] = useState<number | null>(null);
  const [selectedStudentForModal, setSelectedStudentForModal] = useState<any>(null);

  // Companies & Roles state
  const [companies, setCompanies] = useState<any[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const [showAddCompanyModal, setShowAddCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [targetCompanyForRole, setTargetCompanyForRole] = useState<any>(null);
  const [editingRole, setEditingRole] = useState<any>(null);

  // Drives state
  const [drives, setDrives] = useState<any[]>([]);
  const [drivesLoading, setDrivesLoading] = useState(false);
  const [showAddDriveModal, setShowAddDriveModal] = useState(false);
  const [editingDrive, setEditingDrive] = useState<any>(null);

  // Sync weekly drive dates when drives load
  useEffect(() => {
    if (drives && drives.length > 0) {
      const d = drives[0];
      if (d.driveDate) {
        setWeeklyDriveDate(new Date(d.driveDate).toISOString().split("T")[0]);
      }
      if (d.registrationDeadline) {
        setWeeklyDeadline(new Date(d.registrationDeadline).toISOString().split("T")[0]);
      }
    }
  }, [drives]);

  // Check auth session
  const checkSession = async () => {
    try {
      const res = await fetch("/api/admin/me");
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setIsAuthenticated(true);
        setAdminUser(data.admin);
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Handle Login (Supports direct password as well as custom email)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: showCustomEmailInput ? loginEmail : undefined,
          password: loginPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      setIsAuthenticated(true);
      setAdminUser(data.admin);
    } catch (err: any) {
      setLoginError(err.message || "Invalid admin credentials");
    } finally {
      setLoginLoading(false);
    }
  };

  // Handle Logout
  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setAdminUser(null);
  };

  // Quick update drive dates
  const handleQuickUpdateDriveDates = async (newDate: string, newDead: string) => {
    if (!drives || drives.length === 0) return;
    const currentDrive = drives[0];
    setWeeklyUpdating(true);
    try {
      const res = await fetch(`/api/admin/drives/${currentDrive.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driveDate: newDate,
          registrationDeadline: newDead,
        }),
      });
      if (res.ok) {
        alert("Weekly placement drive dates updated successfully!");
        loadDrives();
        loadStats();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to update dates");
      }
    } catch {
      alert("Network error updating drive dates");
    } finally {
      setWeeklyUpdating(false);
    }
  };

  // Advance dates by 7 days for next week
  const handleAdvanceOneWeek = () => {
    if (!drives || drives.length === 0) return;
    const currentDrive = drives[0];
    const dDate = currentDrive.driveDate ? new Date(currentDrive.driveDate) : new Date();
    const dDead = currentDrive.registrationDeadline ? new Date(currentDrive.registrationDeadline) : new Date();

    dDate.setDate(dDate.getDate() + 7);
    dDead.setDate(dDead.getDate() + 7);

    const nextDriveDate = dDate.toISOString().split("T")[0];
    const nextDeadline = dDead.toISOString().split("T")[0];

    setWeeklyDriveDate(nextDriveDate);
    setWeeklyDeadline(nextDeadline);
    handleQuickUpdateDriveDates(nextDriveDate, nextDeadline);
  };

  // Fetch Stats & Drives for Overview
  const loadStats = async () => {
    setStatsLoading(true);
    try {
      const res = await fetch("/api/admin/stats");
      const data = await res.json();
      if (res.ok) setStats(data.stats);
      loadDrives();
    } catch (err) {
      console.error(err);
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch Students with current filters
  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterBranch) params.set("branch", filterBranch);
      if (filterQual) params.set("qualification", filterQual);
      if (filterMinCgpa) params.set("minCgpa", filterMinCgpa);
      if (filterCompanyId) params.set("companyId", filterCompanyId);
      if (filterJobRoleId) params.set("jobRoleId", filterJobRoleId);
      if (filterEligibilityStatus) params.set("eligibilityStatus", filterEligibilityStatus);

      const res = await fetch(`/api/admin/students?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setStudents(data.items || []);
        setTotalStudents(data.total || 0);
        setShortlistCount(data.shortlistCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  // Fetch Companies
  const loadCompanies = async () => {
    setCompaniesLoading(true);
    try {
      const res = await fetch("/api/admin/companies");
      const data = await res.json();
      if (res.ok) setCompanies(data.companies || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCompaniesLoading(false);
    }
  };

  // Fetch Drives
  const loadDrives = async () => {
    setDrivesLoading(true);
    try {
      const res = await fetch("/api/admin/drives");
      const data = await res.json();
      if (res.ok) setDrives(data.drives || []);
    } catch (err) {
      console.error(err);
    } finally {
      setDrivesLoading(false);
    }
  };

  // Trigger loading when tab changes
  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "overview") loadStats();
      if (activeTab === "students") {
        loadStudents();
        loadCompanies();
      }
      if (activeTab === "companies") loadCompanies();
      if (activeTab === "drives") {
        loadDrives();
        loadCompanies();
      }
    }
  }, [isAuthenticated, activeTab]);

  // Trigger students reload when filters change
  useEffect(() => {
    if (isAuthenticated && activeTab === "students") {
      loadStudents();
    }
  }, [
    search,
    filterBranch,
    filterQual,
    filterMinCgpa,
    filterCompanyId,
    filterJobRoleId,
    filterEligibilityStatus,
  ]);

  // Export to Excel / CSV
  const handleExport = (format: "xlsx" | "csv") => {
    const params = new URLSearchParams();
    if (filterCompanyId) params.set("companyId", filterCompanyId);
    if (filterJobRoleId) params.set("jobRoleId", filterJobRoleId);
    if (filterEligibilityStatus) params.set("eligibilityStatus", filterEligibilityStatus);
    params.set("format", format);

    window.open(`/api/admin/export?${params.toString()}`, "_blank");
  };

  // If not authenticated, render login form
  if (isAuthenticated === false) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-lg max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-white flex items-center justify-center mx-auto shadow-md">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              TGMSC&amp;CCC Admin Portal
            </h2>
            <p className="text-xs text-slate-500">
              Telangana Minorities Study Circle &amp; Career Counselling Centre &bull; Government of Telangana
            </p>
          </div>

          {loginError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {showCustomEmailInput ? (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Admin Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    placeholder="admin@college.edu"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            ) : null}

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Admin Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomEmailInput(!showCustomEmailInput)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold"
                >
                  {showCustomEmailInput ? "Use Default Admin Account" : "Custom Admin Email?"}
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  placeholder="Enter admin password (adminPassword123!)"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  <span>Unlock Admin Portal</span>
                </>
              )}
            </button>
          </form>

          {/* Official Security Notice */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1 text-center">
            <span className="font-bold text-slate-900 block">Authorized TGMSC&amp;CCC Placement Officials Only</span>
            <div>Default Portal Password: <span className="font-mono font-bold text-emerald-800">adminPassword123!</span></div>
            <div className="text-[10px] text-slate-400">Password can be changed inside the portal after login.</div>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-emerald-700 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-emerald-950 text-white p-6 rounded-2xl shadow-sm border border-emerald-900">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            TGMSC&amp;CCC Administration Console &bull; Government of Telangana
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Placement &amp; Career Counselling Cell
          </h1>
          <p className="text-xs text-emerald-200 mt-0.5">
            Logged in as <span className="text-white font-semibold">{adminUser?.name || "Placement Officer"}</span> ({adminUser?.email})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/placements"
            target="_blank"
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-900 hover:bg-emerald-850 text-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-800"
          >
            <span>Live Student Portal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={() => setShowChangePasswordModal(true)}
            className="px-3.5 py-2 text-xs font-semibold bg-emerald-900 hover:bg-emerald-850 text-emerald-100 rounded-lg transition-colors flex items-center gap-1.5 border border-emerald-800"
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>Change Password</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 text-xs font-bold bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("overview")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "overview"
              ? "bg-emerald-800 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Dashboard Overview</span>
        </button>

        <button
          onClick={() => setActiveTab("students")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "students"
              ? "bg-emerald-800 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registered Students &amp; Shortlists</span>
        </button>

        <button
          onClick={() => setActiveTab("companies")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "companies"
              ? "bg-emerald-800 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Manage Placement Companies</span>
        </button>

        <button
          onClick={() => setActiveTab("drives")}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === "drives"
              ? "bg-emerald-800 text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Placement Drives</span>
        </button>
      </div>

      {/* TAB 1: DASHBOARD OVERVIEW & STATS */}
      {activeTab === "overview" && stats && (
        <div className="space-y-6">
          {/* WEEKLY DRIVE SCHEDULER CARD */}
          <div className="bg-white rounded-2xl border-2 border-emerald-700/30 p-6 shadow-sm space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Calendar className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                    Weekly Placement Drive Schedule
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1">
                    Drive Date &amp; Candidate Reporting Manager
                  </h3>
                  <p className="text-xs text-slate-600">
                    Drives occur every week. Adjust the drive date and registration deadline below or advance by 7 days. Interview schedules and student confirmation slips adapt dynamically.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAdvanceOneWeek}
                  disabled={weeklyUpdating}
                  className="px-3.5 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                  title="Advance both drive date and deadline by exactly 7 days for next week's session"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>+7 Days (Schedule Next Week)</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                  Upcoming Drive / Interview Date
                </label>
                <input
                  type="date"
                  value={weeklyDriveDate}
                  onChange={(e) => setWeeklyDriveDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                />
                <span className="text-[10px] text-slate-500 block">
                  Students will be scheduled for interviews on this date.
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-emerald-700" />
                  Registration Deadline
                </label>
                <input
                  type="date"
                  value={weeklyDeadline}
                  onChange={(e) => setWeeklyDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none bg-white"
                />
                <span className="text-[10px] text-slate-500 block">
                  Portal closes online registrations after this deadline.
                </span>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => handleQuickUpdateDriveDates(weeklyDriveDate, weeklyDeadline)}
                  disabled={weeklyUpdating || !weeklyDriveDate || !weeklyDeadline}
                  className="w-full py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {weeklyUpdating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Dates...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Save Drive Schedule</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {drives && drives.length > 0 && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">Current Active Drive:</span>
                  <span className="font-semibold text-emerald-800">{drives[0].name}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                    {drives[0].status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Drive ID: <span className="font-mono text-slate-700">{drives[0].id}</span> &bull; Enrolled Companies: <span className="font-bold text-slate-800">{drives[0].companies?.length || 0}</span>
                </div>
              </div>
            )}
          </div>

          {/* Key Stat Cards as specified:
              Total registered students
              Total resumes
              Total eligible students
              Total participating companies
              Total job roles */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Registered Students
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {stats.totalRegisteredStudents}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                Total Submissions
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Resumes Analyzed
              </span>
              <div className="text-3xl font-black text-blue-600 mt-1">
                {stats.totalResumes}
              </div>
              <span className="text-[11px] text-blue-500 font-semibold mt-1 block">
                AI Parsed &amp; Verified
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Eligible Students
              </span>
              <div className="text-3xl font-black text-emerald-600 mt-1">
                {stats.totalEligibleStudents}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold mt-1 block">
                Eligible for &ge; 1 Company
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Companies
              </span>
              <div className="text-3xl font-black text-indigo-600 mt-1">
                {stats.totalCompanies}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                Participating Active
              </span>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Job Roles
              </span>
              <div className="text-3xl font-black text-slate-900 mt-1">
                {stats.totalJobRoles}
              </div>
              <span className="text-[11px] text-slate-500 font-semibold mt-1 block">
                Configured Criteria
              </span>
            </div>
          </div>

          {/* Recent Registrations Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Recent Drive Registrations
                </h3>
                <p className="text-xs text-slate-500">Live feed of student candidate submissions.</p>
              </div>
              <button
                onClick={() => setActiveTab("students")}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View Full Candidate Table</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Reg ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">CGPA</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentRegistrations?.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {r.registrationId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{r.student?.name}</td>
                      <td className="py-3 px-4 text-slate-600">{r.student?.email}</td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {r.student?.branch}
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">{r.student?.cgpa}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(r.submittedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                  {(!stats.recentRegistrations || stats.recentRegistrations.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No registrations submitted yet. Students will appear here as they register.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT MANAGEMENT & COMPANY SHORTLISTING (CRITICAL ADMIN FEATURE) */}
      {activeTab === "students" && (
        <div className="space-y-6">
          {/* Controls: Search, Filter per Company & Role, Export Excel/CSV */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  Registered Candidate Directory &amp; Company Shortlisting
                </h3>
                <p className="text-xs text-slate-500">
                  Filter students for a specific company or role to instantly generate recruitment shortlists.
                </p>
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExport("xlsx")}
                  className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export to Excel (.xlsx)</span>
                </button>

                <button
                  onClick={() => handleExport("csv")}
                  className="px-3.5 py-2 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            {/* CRITICAL ADMIN SHORTLIST FILTER BAR */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {/* Filter Company */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Select Company:
                </label>
                <select
                  value={filterCompanyId}
                  onChange={(e) => {
                    setFilterCompanyId(e.target.value);
                    setFilterJobRoleId(""); // reset child role
                  }}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Participating Companies</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Job Role */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Select Job Role:
                </label>
                <select
                  value={filterJobRoleId}
                  onChange={(e) => setFilterJobRoleId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 bg-white"
                  disabled={!filterCompanyId}
                >
                  <option value="">All Roles</option>
                  {companies
                    .find((c) => c.id === filterCompanyId)
                    ?.jobRoles?.map((r: any) => (
                      <option key={r.id} value={r.id}>
                        {r.roleName}
                      </option>
                    ))}
                </select>
              </div>

              {/* Filter Eligibility Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Eligibility Status:
                </label>
                <select
                  value={filterEligibilityStatus}
                  onChange={(e) => setFilterEligibilityStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Any Status</option>
                  <option value="Eligible">Eligible Only (Strict Rule Passed)</option>
                  <option value="Partially Eligible">Partially Eligible</option>
                  <option value="Not Eligible">Not Eligible</option>
                </select>
              </div>

              {/* Filter Branch */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Branch / Department:
                </label>
                <select
                  value={filterBranch}
                  onChange={(e) => setFilterBranch(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="IT">IT</option>
                  <option value="AI & ML">AI &amp; ML</option>
                  <option value="ECE">ECE</option>
                  <option value="EEE">EEE</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              </div>
            </div>

            {/* Search Input & Minimum CGPA Filter */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by student name, email, phone, or Registration ID..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-300 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  value={filterMinCgpa}
                  onChange={(e) => setFilterMinCgpa(e.target.value)}
                  placeholder="Min CGPA (e.g. 7.5)"
                  className="px-3 py-2 text-xs rounded-lg border border-slate-300 w-36 focus:ring-2 focus:ring-blue-500"
                />

                {(filterCompanyId ||
                  filterJobRoleId ||
                  filterEligibilityStatus ||
                  filterBranch ||
                  filterMinCgpa ||
                  search) && (
                  <button
                    onClick={() => {
                      setFilterCompanyId("");
                      setFilterJobRoleId("");
                      setFilterEligibilityStatus("");
                      setFilterBranch("");
                      setFilterMinCgpa("");
                      setSearch("");
                    }}
                    className="px-3 py-2 text-xs font-bold text-slate-500 hover:text-rose-600 whitespace-nowrap"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* CRITICAL SHORTLIST BANNER AS SPECIFIED IN PROMPT:
                "Select Company: TCS
                 Select Job Role: Software Developer
                 Show: 'Eligible Students: 86'
                 Then display only students eligible for that company's role." */}
            {filterCompanyId && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-950">
                    Filtered for{" "}
                    <span className="font-extrabold underline">
                      {companies.find((c) => c.id === filterCompanyId)?.name}
                    </span>
                    {filterJobRoleId && (
                      <>
                        {" "}
                        &bull; Role:{" "}
                        <span className="font-extrabold underline">
                          {
                            companies
                              .find((c) => c.id === filterCompanyId)
                              ?.jobRoles?.find((r: any) => r.id === filterJobRoleId)?.roleName
                          }
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <div className="text-xs font-black text-emerald-800 bg-emerald-200 px-3 py-1 rounded-full">
                  Eligible Students: {totalStudents}
                </div>
              </div>
            )}
          </div>

          {/* Table of Registered Students as specified:
              Registration ID, Student Name, Phone, Email, Branch, Qualification, CGPA, Resume, Eligible Companies, Registration Date, Status */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Registration ID</th>
                    <th className="py-3 px-4">Student Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Branch</th>
                    <th className="py-3 px-4">Qualification</th>
                    <th className="py-3 px-4">CGPA</th>
                    <th className="py-3 px-4">Resume</th>
                    <th className="py-3 px-4">Eligible Companies</th>
                    <th className="py-3 px-4">Reg Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                        {st.registrationId}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        {st.studentName}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{st.phone}</td>
                      <td className="py-3 px-4 text-slate-600 truncate max-w-[160px]">
                        {st.email}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">{st.branch}</td>
                      <td className="py-3 px-4 text-slate-600">{st.qualification}</td>
                      <td className="py-3 px-4 font-black text-emerald-700">{st.cgpa}</td>
                      <td className="py-3 px-4">
                        <a
                          href={st.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-semibold underline flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> View
                        </a>
                      </td>
                      <td className="py-3 px-4 max-w-[200px]">
                        {st.eligibleCompanies?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {st.eligibleCompanies.map((c: string, idx: number) => (
                              <span
                                key={idx}
                                className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold"
                              >
                                {c}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(st.registrationDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {st.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedStudentForModal(st)}
                          className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                        >
                          Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                  {students.length === 0 && !studentsLoading && (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-slate-400">
                        No registered students found matching your search and filter criteria.
                      </td>
                    </tr>
                  )}
                  {studentsLoading && (
                    <tr>
                      <td colSpan={12} className="py-12 text-center text-blue-600 font-semibold">
                        Loading student records...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COMPANY & JOB ROLE MANAGEMENT ("Manage Placement Companies") */}
      {activeTab === "companies" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-700" />
                Manage Placement Companies
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Admin can add companies, edit job roles, and update eligibility criteria every week without touching code.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingCompany(null);
                setShowAddCompanyModal(true);
              }}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Company</span>
            </button>
          </div>

          {/* Companies List */}
          <div className="grid grid-cols-1 gap-6">
            {companies.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
              >
                {/* Company Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-50 border border-slate-200 p-1 flex items-center justify-center shrink-0">
                      {c.logo ? (
                        <img src={c.logo} alt={c.name} className="w-full h-full object-contain" />
                      ) : (
                        <Building2 className="w-7 h-7 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-extrabold text-slate-900">{c.name}</h4>
                        {/* Company Status: Active, Inactive, Registration Closed */}
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            c.status === "Active"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.status === "Inactive"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 max-w-xl">{c.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setTargetCompanyForRole(c);
                        setEditingRole(null);
                        setShowAddRoleModal(true);
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Job Role</span>
                    </button>

                    <button
                      onClick={() => {
                        setEditingCompany(c);
                        setShowAddCompanyModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={async () => {
                        if (confirm(`Are you sure you want to delete company ${c.name}?`)) {
                          await fetch(`/api/admin/companies/${c.id}`, { method: "DELETE" });
                          loadCompanies();
                        }
                      }}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Company Roles Table */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                    Configured Job Roles &amp; Mandatory Criteria ({c.jobRoles?.length || 0})
                  </span>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {c.jobRoles?.map((r: any) => {
                      let quals: string[] = [];
                      let branches: string[] = [];
                      let skills: string[] = [];
                      try {
                        quals = JSON.parse(r.qualifications);
                        branches = JSON.parse(r.branches);
                        skills = JSON.parse(r.requiredSkills);
                      } catch {
                        quals = [r.qualifications];
                        branches = [r.branches];
                        skills = [r.requiredSkills];
                      }

                      return (
                        <div
                          key={r.id}
                          className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5 relative group"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-extrabold text-slate-900 text-sm block">
                                {r.roleName}
                              </span>
                              {r.salaryPackage && (
                                <span className="font-bold text-blue-700 text-xs">
                                  Package: {r.salaryPackage}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setTargetCompanyForRole(c);
                                  setEditingRole(r);
                                  setShowAddRoleModal(true);
                                }}
                                className="p-1 hover:bg-slate-200 text-slate-600 rounded"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={async () => {
                                  if (confirm(`Delete job role ${r.roleName}?`)) {
                                    await fetch(`/api/admin/job-roles/${r.id}`, {
                                      method: "DELETE",
                                    });
                                    loadCompanies();
                                  }
                                }}
                                className="p-1 hover:bg-rose-100 text-rose-600 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/60">
                            <div>
                              <span className="text-slate-400">Min CGPA:</span>{" "}
                              <span className="font-bold text-slate-900">{r.minimumCgpa}</span>
                            </div>
                            <div>
                              <span className="text-slate-400">Backlogs Allowed:</span>{" "}
                              <span className="font-bold text-slate-900">
                                Max {r.backlogRequirement}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400">Eligible Branches:</span>{" "}
                              <span className="font-medium text-slate-800">
                                {branches.join(", ")}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400">Qualifications:</span>{" "}
                              <span className="font-medium text-slate-800">{quals.join(", ")}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                              Required Skills:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {skills.map((s: string, sI: number) => (
                                <span
                                  key={sI}
                                  className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-semibold"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {(!c.jobRoles || c.jobRoles.length === 0) && (
                      <div className="col-span-2 py-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        No job roles configured yet. Click &quot;Add Job Role&quot; above to set eligibility criteria.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PLACEMENT DRIVE MANAGEMENT ("Placement Drives") */}
      {activeTab === "drives" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-emerald-700" />
                Placement Drives Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Create new placement drives, set drive dates, registration deadlines, and configure participating companies.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingDrive(null);
                setShowAddDriveModal(true);
              }}
              className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-sm transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Placement Drive</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {drives.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-slate-900">{d.name}</h4>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          d.status === "Active"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{d.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingDrive(d);
                        setShowAddDriveModal(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={async () => {
                        if (confirm(`Delete placement drive ${d.name}?`)) {
                          await fetch(`/api/admin/drives/${d.id}`, { method: "DELETE" });
                          loadDrives();
                        }
                      }}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">
                      Drive Date
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {new Date(d.driveDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">
                      Registration Deadline
                    </span>
                    <span className="font-bold text-slate-800 mt-0.5 block">
                      {new Date(d.registrationDeadline).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">
                      Participating Companies
                    </span>
                    <span className="font-bold text-blue-700 mt-0.5 block">
                      {d.companies?.length || 0} Companies
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">
                      Registered Students
                    </span>
                    <span className="font-bold text-emerald-700 mt-0.5 block">
                      {d._count?.registrations || 0} Candidates
                    </span>
                  </div>
                </div>

                {/* Company Badges */}
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Enrolled Companies:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {d.companies?.map((dc: any) => (
                      <span
                        key={dc.company.id}
                        className="bg-slate-100 text-slate-800 px-2.5 py-1 rounded text-xs font-semibold"
                      >
                        {dc.company.name} ({dc.company.jobRoles?.length || 0} roles)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT COMPANY */}
      {showAddCompanyModal && (
        <CompanyModal
          company={editingCompany}
          onClose={() => setShowAddCompanyModal(false)}
          onSuccess={() => {
            setShowAddCompanyModal(false);
            loadCompanies();
          }}
        />
      )}

      {/* MODAL 2: ADD / EDIT JOB ROLE */}
      {showAddRoleModal && targetCompanyForRole && (
        <JobRoleModal
          company={targetCompanyForRole}
          role={editingRole}
          onClose={() => setShowAddRoleModal(false)}
          onSuccess={() => {
            setShowAddRoleModal(false);
            loadCompanies();
          }}
        />
      )}

      {/* MODAL 3: CREATE / EDIT DRIVE */}
      {showAddDriveModal && (
        <DriveModal
          drive={editingDrive}
          availableCompanies={companies}
          onClose={() => setShowAddDriveModal(false)}
          onSuccess={() => {
            setShowAddDriveModal(false);
            loadDrives();
          }}
        />
      )}

      {/* MODAL 4: INSPECT STUDENT */}
      {selectedStudentForModal && (
        <StudentInspectModal
          student={selectedStudentForModal}
          onClose={() => setSelectedStudentForModal(null)}
        />
      )}

      {/* MODAL 5: CHANGE PASSWORD */}
      {showChangePasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowChangePasswordModal(false)}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------
// SUB-MODALS
// ----------------------------------------------------

function CompanyModal({ company, onClose, onSuccess }: any) {
  const [name, setName] = useState(company?.name || "");
  const [description, setDescription] = useState(company?.description || "");
  const [logo, setLogo] = useState(
    company?.logo || "https://images.unsplash.com/photo-1542744094-24638eff58bb?w=128&h=128&fit=crop"
  );
  const [status, setStatus] = useState(company?.status || "Active");
  const [website, setWebsite] = useState(company?.website || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = company ? `/api/admin/companies/${company.id}` : "/api/admin/companies";
      const method = company ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, logo, status, website }),
      });
      if (res.ok) onSuccess();
      else {
        const d = await res.json();
        alert(d.error || "Failed to save company");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900">
          {company ? "Edit Placement Company" : "Add New Placement Company"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="e.g. Google / Microsoft / TCS"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase">Company Description *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="Describe business domain and hiring mandate..."
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase">Company Logo URL</label>
            <input
              type="url"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase">
              Company Status (Active / Inactive / Registration Closed)
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
            >
              <option value="Active">Active (Eligible for students)</option>
              <option value="Inactive">Inactive</option>
              <option value="Registration Closed">Registration Closed</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-sm transition-colors"
            >
              {loading ? "Saving..." : "Save Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function JobRoleModal({ company, role, onClose, onSuccess }: any) {
  const [roleName, setRoleName] = useState(role?.roleName || "");
  const [minimumCgpa, setMinimumCgpa] = useState<string>(role?.minimumCgpa?.toString() || "7.0");
  const [qualifications, setQualifications] = useState(
    role ? (typeof role.qualifications === "string" ? role.qualifications : JSON.stringify(role.qualifications)) : '["B.Tech","B.E."]'
  );
  const [branches, setBranches] = useState(
    role ? (typeof role.branches === "string" ? role.branches : JSON.stringify(role.branches)) : '["CSE","IT","AI & ML"]'
  );
  const [graduationYears, setGraduationYears] = useState(
    role ? (typeof role.graduationYears === "string" ? role.graduationYears : JSON.stringify(role.graduationYears)) : '["2026","2027"]'
  );
  const [requiredSkills, setRequiredSkills] = useState(
    role ? (typeof role.requiredSkills === "string" ? role.requiredSkills : JSON.stringify(role.requiredSkills)) : '["Programming","DSA","Java"]'
  );
  const [preferredSkills, setPreferredSkills] = useState(
    role ? (typeof role.preferredSkills === "string" ? role.preferredSkills : JSON.stringify(role.preferredSkills)) : '["SQL","Git"]'
  );
  const [backlogRequirement, setBacklogRequirement] = useState<number>(
    role?.backlogRequirement ?? 0
  );
  const [salaryPackage, setSalaryPackage] = useState(role?.salaryPackage || "8.0 LPA");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = role ? `/api/admin/job-roles/${role.id}` : "/api/admin/job-roles";
      const method = role ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyId: company.id,
          roleName,
          minimumCgpa: parseFloat(minimumCgpa),
          qualifications,
          branches,
          graduationYears,
          requiredSkills,
          preferredSkills,
          backlogRequirement: parseInt(String(backlogRequirement), 10),
          salaryPackage,
        }),
      });
      if (res.ok) onSuccess();
      else {
        const d = await res.json();
        alert(d.error || "Failed to save job role");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-900">
          {role ? `Edit Role: ${role.roleName}` : `Add Role for ${company.name}`}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase">Job Role Name *</label>
            <input
              type="text"
              required
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="e.g. Software Developer"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase">Minimum CGPA *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                required
                value={minimumCgpa}
                onChange={(e) => setMinimumCgpa(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 uppercase">Backlog Limit *</label>
              <input
                type="number"
                min="0"
                required
                value={backlogRequirement}
                onChange={(e) => setBacklogRequirement(parseInt(e.target.value, 10))}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase">Salary Package / CTC</label>
            <input
              type="text"
              value={salaryPackage}
              onChange={(e) => setSalaryPackage(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="e.g. 7.5 LPA"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase">Eligible Branches</label>
            <input
              type="text"
              value={branches}
              onChange={(e) => setBranches(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder='["CSE","IT","AI & ML"] or CSE, IT'
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase">Required Skills (Mandatory for full match)</label>
            <input
              type="text"
              value={requiredSkills}
              onChange={(e) => setRequiredSkills(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder='["Programming","DSA","Java"]'
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase">Preferred Skills</label>
            <input
              type="text"
              value={preferredSkills}
              onChange={(e) => setPreferredSkills(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder='["SQL","Cloud"]'
            />
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-sm transition-colors"
            >
              {loading ? "Saving..." : "Save Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DriveModal({ drive, availableCompanies, onClose, onSuccess }: any) {
  const [name, setName] = useState(drive?.name || "");
  const [description, setDescription] = useState(drive?.description || "");
  const [driveDate, setDriveDate] = useState(
    drive?.driveDate ? new Date(drive.driveDate).toISOString().split("T")[0] : ""
  );
  const [registrationDeadline, setRegistrationDeadline] = useState(
    drive?.registrationDeadline
      ? new Date(drive.registrationDeadline).toISOString().split("T")[0]
      : ""
  );
  const [status, setStatus] = useState(drive?.status || "Active");
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(
    drive?.companies?.map((c: any) => c.company.id) || availableCompanies.map((c: any) => c.id)
  );
  const [loading, setLoading] = useState(false);

  const toggleCompany = (id: string) => {
    if (selectedCompanies.includes(id)) {
      setSelectedCompanies(selectedCompanies.filter((c) => c !== id));
    } else {
      setSelectedCompanies([...selectedCompanies, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const url = drive ? `/api/admin/drives/${drive.id}` : "/api/admin/drives";
      const method = drive ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          driveDate,
          registrationDeadline,
          status,
          companyIds: selectedCompanies,
        }),
      });
      if (res.ok) onSuccess();
      else {
        const d = await res.json();
        alert(d.error || "Failed to save drive");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-slate-900">
          {drive ? "Edit Placement Drive" : "Create New Placement Drive"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-bold text-slate-700 uppercase">Drive Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
              placeholder="e.g. November 2026 Campus Placement Drive"
            />
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase">Drive Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 uppercase">Drive Date *</label>
              <input
                type="date"
                required
                value={driveDate}
                onChange={(e) => setDriveDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 uppercase">Registration Deadline *</label>
              <input
                type="date"
                required
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
                className="w-full mt-1 px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="font-bold text-slate-700 uppercase">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full mt-1 px-3 py-2 border rounded-lg bg-white"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-700 uppercase block mb-1">
              Participating Companies ({selectedCompanies.length} selected):
            </label>
            <div className="space-y-1.5 max-h-36 overflow-y-auto border p-2 rounded-lg">
              {availableCompanies.map((c: any) => (
                <label key={c.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(c.id)}
                    onChange={() => toggleCompany(c.id)}
                  />
                  <span>
                    {c.name} ({c.jobRoles?.length || 0} roles)
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 rounded-lg font-bold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-sm transition-colors"
            >
              {loading ? "Saving..." : "Save Drive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StudentInspectModal({ student, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">{student.studentName}</h3>
            <span className="font-mono text-xs text-blue-600 font-bold">
              {student.registrationId}
            </span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 font-bold text-lg">
            &times;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-2.5 bg-slate-50 rounded border">
            <span className="text-slate-400 font-bold">Email:</span>
            <div className="font-semibold text-slate-900 mt-0.5">{student.email}</div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded border">
            <span className="text-slate-400 font-bold">Phone:</span>
            <div className="font-semibold text-slate-900 mt-0.5">{student.phone}</div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded border">
            <span className="text-slate-400 font-bold">Branch &amp; Qual:</span>
            <div className="font-semibold text-slate-900 mt-0.5">
              {student.qualification} &bull; {student.branch}
            </div>
          </div>
          <div className="p-2.5 bg-slate-50 rounded border">
            <span className="text-slate-400 font-bold">CGPA &amp; Backlogs:</span>
            <div className="font-bold text-emerald-700 mt-0.5">
              {student.cgpa} CGPA &bull; {student.backlogs} Backlogs
            </div>
          </div>
        </div>

        <div className="pt-2">
          <a
            href={student.resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Open Candidate Resume Document</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="space-y-2 pt-2">
          <span className="text-xs font-bold text-slate-700 uppercase">
            Evaluated Company Eligibility Results:
          </span>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {student.allEligibilityResults?.map((er: any, idx: number) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg border text-xs flex items-center justify-between"
              >
                <div>
                  <span className="font-bold text-slate-900">{er.companyName}</span>
                  <span className="text-slate-500 ml-1">({er.roleName})</span>
                  <p className="text-[11px] text-slate-600 mt-0.5">{er.explanation}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                    er.status === "Eligible"
                      ? "bg-emerald-100 text-emerald-800"
                      : er.status === "Partially Eligible"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {er.status} ({er.score}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");
      setSuccess("Password updated successfully! You can now use your new password.");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Change Admin Password</h3>
              <p className="text-[11px] text-slate-500">Update your TGMSC placement officer password</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
            &times;
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded-lg">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase text-[11px]">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase text-[11px]">New Password *</label>
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="font-bold text-slate-700 uppercase text-[11px]">Confirm New Password *</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg font-bold text-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold shadow-sm transition-colors flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Password</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
