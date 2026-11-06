import Link from "next/link";
import Image from "next/image";
import prisma from "@/lib/prisma";
import {
  Briefcase,
  Calendar,
  Building2,
  ArrowRight,
  Clock,
  ChevronRight,
  CheckCircle2,
  FileText,
  Send,
  UserCheck,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PlacementsHomePage() {
  // Fetch active drives with companies and roles
  const drives = await prisma.placementDrive.findMany({
    where: { status: "Active" },
    include: {
      companies: {
        include: {
          company: {
            include: {
              jobRoles: {
                where: { active: true },
              },
            },
          },
        },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const activeDrive = drives[0];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Official Government Banner Header (Clean, dignified, matching tgmsc2-placement) */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-5 text-center sm:text-left">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 shrink-0 bg-white p-1 rounded-lg border border-slate-200 flex items-center justify-center">
            <Image
              src="/images/tgmsc_logo.png"
              alt="Government of Telangana"
              width={56}
              height={56}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="inline-block text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 mb-1">
              Government of Telangana &bull; Minorities Welfare Department
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              TGMSC&amp;CCC — Placement Drive
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Weekly Campus Recruitment &amp; Internship Drive &bull; Sign in &amp; select any job openings you&apos;d like to be considered for
            </p>
          </div>
        </div>

        <div className="w-14 h-14 shrink-0 hidden sm:flex items-center justify-center p-1 bg-white border border-slate-200 rounded-lg">
          <Image
            src="/images/tgmsc_emblem.png"
            alt="Taleem Se Taraqqi"
            width={48}
            height={48}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Current Weekly Drive Status Strip */}
      {activeDrive && (
        <div className="bg-[#0a3d24] text-white rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                Weekly Drive Active
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white">
              {activeDrive.name}
            </h2>
            <p className="text-xs text-emerald-100/80">
              {activeDrive.description || "Weekly recruitment session for degree, engineering, and science graduates."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="bg-[#0f6e4d] px-3.5 py-2 rounded-lg text-xs">
              <span className="text-emerald-200 text-[10px] block font-semibold uppercase">Drive Date</span>
              <span className="font-bold text-white">{formatDate(activeDrive.driveDate)}</span>
            </div>

            <div className="bg-[#0f6e4d] px-3.5 py-2 rounded-lg text-xs">
              <span className="text-emerald-200 text-[10px] block font-semibold uppercase">Registration Deadline</span>
              <span className="font-bold text-white">{formatDate(activeDrive.registrationDeadline)}</span>
            </div>

            <Link
              href="/placements/register"
              className="px-5 py-2.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0a3d24] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Register Now</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}

      {/* Available Job Openings Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-700" />
              Available Job Openings
            </h3>
            <p className="text-xs text-slate-500">
              Participating employers in the current weekly drive. Upload your resume to check eligibility.
            </p>
          </div>
          <Link
            href="/placements/register"
            className="text-xs font-bold text-[#0f6e4d] hover:underline flex items-center gap-1"
          >
            <span>Register &amp; Check Eligibility</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Clean Job Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeDrive?.companies.map(({ company }) => (
            <div
              key={company.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:border-emerald-500 hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 inline-block mb-1">
                      {company.name.includes("(") ? company.name.split("(")[1].replace(")", "") : "OPENING"}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900 line-clamp-1">
                      {company.name}
                    </h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700 shrink-0">
                    Active
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2">
                  {company.description}
                </p>

                {/* Job Roles */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  {company.jobRoles.map((role) => {
                    let quals: string[] = [];
                    try {
                      quals = JSON.parse(role.qualifications);
                    } catch {
                      quals = [role.qualifications];
                    }

                    return (
                      <div key={role.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 text-xs">{role.roleName}</span>
                          {role.salaryPackage && (
                            <span className="font-bold text-[#0f6e4d] text-[11px] bg-emerald-50 px-1.5 py-0.5 rounded">
                              {role.salaryPackage}
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                          <span>Min CGPA: <b className="text-slate-700">{role.minimumCgpa}</b></span>
                          <span>Qualifications: <b className="text-slate-700">{quals.slice(0, 2).join(", ")}</b></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100">
                <Link
                  href={`/placements/register?driveId=${activeDrive?.id}&company=${company.id}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-[#0f6e4d] hover:bg-emerald-50 py-1.5 rounded transition-colors"
                >
                  <span>Apply for this Opening</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Clean 4-Step Registration Guide */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
          How to Register for Weekly Drives
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-[#0f6e4d] text-xs">1. Fill Basic Details</div>
            <p className="text-slate-600">Enter your Name, Phone, Email, Gender, and Qualification degree.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-[#0f6e4d] text-xs">2. Upload Resume</div>
            <p className="text-slate-600">AI automatically extracts your branch, year, CGPA, backlogs, and technical skills.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-[#0f6e4d] text-xs">3. Select Openings</div>
            <p className="text-slate-600">Review your eligibility and check the boxes for any companies you wish to apply for.</p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200/80 space-y-1">
            <div className="font-bold text-[#0f6e4d] text-xs">4. Interview Call-Up</div>
            <p className="text-slate-600">Receive your Registration ID and automatic interview confirmation email.</p>
          </div>
        </div>

        <div className="pt-2 text-center">
          <Link
            href="/placements/register"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#0f6e4d] hover:bg-[#0a3d24] text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
          >
            <UserCheck className="w-4 h-4" />
            <span>Start Registration Now</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
