import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Briefcase, UserCheck, ShieldCheck, Phone, Mail, MapPin } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "TGMSC&CCC Placement Drive | Telangana Minorities Study Circle & Career Counselling Centre",
  description: "Official Placement Drive Portal — Government of Telangana, Minorities Welfare Department",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex flex-col min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
        {/* Official Telangana Government Banner Strip */}
        <div className="bg-[#0a3d24] text-emerald-100 text-xs py-2 px-4 border-b border-[#0f6e4d]">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-white tracking-wide">Government of Telangana</span>
              <span className="text-emerald-400">&bull;</span>
              <span className="text-emerald-200">Minorities Welfare Department</span>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <span className="hidden sm:inline text-amber-300 font-medium">
                Telangana Minorities Study Circle &amp; Career Counselling Centre (TGMSC&amp;CCC)
              </span>
              <span className="flex items-center gap-1 text-emerald-200">
                <Phone className="w-3 h-3 text-amber-400" /> +91 (040) 2323-6112
              </span>
            </div>
          </div>
        </div>

        {/* Clean Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between h-20">
              {/* Official TGMSC&CCC Logos & Title */}
              <Link href="/placements" className="flex items-center space-x-3.5 group">
                <div className="relative w-12 h-12 flex-shrink-0 flex items-center justify-center">
                  <Image
                    src="/images/tgmsc_logo.png"
                    alt="Government of Telangana"
                    width={48}
                    height={48}
                    className="object-contain"
                    priority
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-[#0a3d24]">
                      TGMSC&amp;CCC
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-[#0a3d24] border border-emerald-300 font-semibold px-2 py-0.5 rounded uppercase">
                      Placement Cell
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    Telangana Minorities Study Circle &amp; Career Counselling Centre
                  </p>
                </div>
              </Link>

              {/* Navigation Links - Student Dashboard completely removed */}
              <nav className="flex items-center space-x-2 sm:space-x-3">
                <Link
                  href="/placements"
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-[#0a3d24] hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                  <span>Job Openings</span>
                </Link>

                <Link
                  href="/placements/register"
                  className="px-4 py-2 text-xs sm:text-sm font-semibold bg-[#0f6e4d] hover:bg-[#0a3d24] text-white rounded-lg transition-all shadow-xs flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Register for Drive</span>
                </Link>

                <div className="h-5 w-px bg-slate-200 mx-1 hidden sm:block" />

                <Link
                  href="/admin/placements"
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                  <span>Admin</span>
                </Link>

                <div className="relative w-10 h-10 flex-shrink-0 hidden md:flex items-center justify-center p-0.5 ml-1">
                  <Image
                    src="/images/tgmsc_emblem.png"
                    alt="Taleem Se Taraqqi"
                    width={38}
                    height={38}
                    className="object-contain"
                  />
                </div>
              </nav>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">{children}</main>

        {/* Clean Professional Government Footer */}
        <footer className="bg-[#0a3d24] text-emerald-100 border-t border-[#0f6e4d] mt-16 text-xs">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="space-y-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded bg-white p-0.5 flex items-center justify-center">
                    <Image
                      src="/images/tgmsc_logo.png"
                      alt="Telangana Emblem"
                      width={28}
                      height={28}
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-white text-sm block">TGMSC&amp;CCC</span>
                    <span className="text-[10px] text-emerald-300 block">Government of Telangana</span>
                  </div>
                </div>
                <p className="text-emerald-200/80 leading-relaxed text-[11px] pt-1">
                  Telangana Minorities Study Circle &amp; Career Counselling Centre, Minorities Welfare Department. Empowering candidates with weekly placement drives and career opportunities.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-2 text-xs">Placement Drive Details</h4>
                <ul className="space-y-1.5 text-[11px] text-emerald-200/90">
                  <li>&bull; Drives conducted on a weekly basis</li>
                  <li>&bull; Strict rule-based eligibility evaluation</li>
                  <li>&bull; Direct resume parsing &amp; skill extraction</li>
                  <li>&bull; Automatic registration confirmation dispatched</li>
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-2 text-xs">Centre Contact</h4>
                <div className="space-y-1.5 text-[11px] text-emerald-200/90">
                  <p className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                    <span>Opp. Jamia Nizamia, Minorities Study Circle Complex, Hyderabad, Telangana</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>placements@tgmsc.gov.in</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Phone: +91 (040) 2323-6112</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-[#0f6e4d] mt-8 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-emerald-400">
              <p>&copy; {new Date().getFullYear()} TGMSC&amp;CCC &bull; Telangana Minorities Study Circle &amp; Career Counselling Centre, Government of Telangana.</p>
              <div className="flex items-center gap-3 mt-2 sm:mt-0">
                <Link href="/placements/register" className="hover:text-white transition-colors">Register for Drive</Link>
                <span>&bull;</span>
                <Link href="/admin/placements" className="hover:text-white transition-colors">Admin Portal</Link>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
