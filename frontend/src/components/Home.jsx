import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Camera,
  BarChart3,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MapPin,
  Building2,
} from "lucide-react";
import {
  GarbageImage,
  StreetlightImage,
  PotholeImage,
  WaterImage,
  DrainageImage,
  DumpingImage,
  CitySkyline,
} from "@/components/IssueImages";

// ── Real civic issues with CARTOON illustrations ──────────────────────
const civicProblems = [
  {
    ImageComp: GarbageImage,
    title: "Garbage Overflow",
    desc: "Overflowing waste bins and illegal dumping in residential areas causing health hazards and unpleasant odors.",
    tag: "Sanitation",
    tagColor: "bg-amber-100 text-amber-700",
  },
  {
    ImageComp: StreetlightImage,
    title: "Malfunctioning Street Lights",
    desc: "Broken or non-functional street lights making roads unsafe at night and increasing accident risks.",
    tag: "Electrical",
    tagColor: "bg-yellow-100 text-yellow-700",
  },
  {
    ImageComp: PotholeImage,
    title: "Potholes & Road Damage",
    desc: "Cracked roads and deep potholes damaging vehicles and causing traffic congestion and accidents.",
    tag: "Roads",
    tagColor: "bg-red-100 text-red-700",
  },
  {
    ImageComp: WaterImage,
    title: "Water Supply Issues",
    desc: "Irregular water supply, pipe leakages, and contaminated water affecting daily life and health.",
    tag: "Water",
    tagColor: "bg-blue-100 text-blue-700",
  },
  {
    ImageComp: DrainageImage,
    title: "Drainage Problems",
    desc: "Clogged drains causing waterlogging during rains, breeding mosquitoes and spreading diseases.",
    tag: "Drainage",
    tagColor: "bg-teal-100 text-teal-700",
  },
  {
    ImageComp: DumpingImage,
    title: "Illegal Dumping",
    desc: "Unauthorized waste dumping in open lots and public spaces degrading the neighborhood environment.",
    tag: "Environment",
    tagColor: "bg-stone-100 text-stone-700",
  },
];

// ── Stats ──────────────────────────────────────────────────────────────
const stats = [
  { number: "10K+", label: "Issues Reported", icon: MapPin },
  { number: "95%", label: "Resolution Rate", icon: CheckCircle2 },
  { number: "50+", label: "Cities Covered", icon: ShieldCheck },
  { number: "24hr", label: "Avg Response Time", icon: BarChart3 },
];

export default function Home() {
  const { isAuthenticated, isCitizen } = useAuth();

  return (
    <div>
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <CitySkyline className="w-full h-full object-cover" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f0c29]/90 via-[#302b63]/80 to-[#24243e]/90" />
        <div className="absolute top-20 -left-20 w-96 h-96 bg-[#f093fb]/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-[#f5576c]/15 rounded-full blur-3xl animate-float" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-[#4facfe]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "0.8s" }} />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-white/90 text-sm mb-6 border border-white/10 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-[#f5576c] animate-pulse-glow" />
                <span>CivicResolve Platform</span>
                <span className="text-white/40 hidden sm:inline">— Smart Citizen Reporting</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white mb-6 leading-tight">
                Report Issues That
                <br />
                <span className="bg-gradient-to-r from-[#f093fb] via-[#f5576c] to-[#ffd200] bg-clip-text text-transparent">
                  Matter Most
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-white/60 max-w-xl mb-10 leading-relaxed">
                From garbage overflow and broken street lights to potholes and water shortages — 
                report any civic issue with a photo and get it resolved by the right department, fast.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to={isAuthenticated ? "/report-form" : "/report"}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#f5576c] to-[#ff6f91] hover:from-[#ff6f91] hover:to-[#f5576c] text-white font-semibold rounded-xl shadow-xl shadow-[#f5576c]/30 transition-all hover:-translate-y-1 hover:shadow-2xl"
                >
                  <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Report an Issue
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                {isAuthenticated && isCitizen ? (
                  <Link
                    to="/my-complaints"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white/90 font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Track My Complaints
                  </Link>
                ) : (
                  <Link
                    to="/signin"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white/90 font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Track Complaints
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-6 mt-10 pt-8 border-t border-white/10">
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#f5576c]" />
                  <span>Free to Use</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#f5576c]" />
                  <span>Track in Real-time</span>
                </div>
                <div className="flex items-center gap-2 text-white/50 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-[#f5576c]" />
                  <span>Govt. Integrated</span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block animate-fade-in-right">
              <div className="grid grid-cols-2 gap-4">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={i}
                      className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all hover:-translate-y-1 hover:shadow-xl"
                      style={{ animationDelay: `${i * 0.1 + 0.3}s` }}
                    >
                      <Icon className="w-5 h-5 text-[#f5576c] mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-2xl sm:text-3xl font-bold text-white mb-1">{s.number}</div>
                      <div className="text-white/50 text-sm">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <ChevronDown className="w-6 h-6 text-white/30" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          YOU CAN REPORT — Cartoon SVGs
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-white via-rose-50/30 to-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#f5576c]/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#f093fb]/5 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#f5576c] to-[#ff6f91] text-white rounded-full px-5 py-2 text-sm font-medium mb-4 shadow-lg shadow-[#f5576c]/25">
              <Camera className="w-4 h-4" />
              What You Can Report
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              See a Problem?{" "}
              <span className="bg-gradient-to-r from-[#f5576c] to-[#f093fb] bg-clip-text text-transparent">
                Report It
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Real issues from real communities. Tap the button and send it straight to the right department.
            </p>
          </div>

          {/* Cards with Cartoon SVGs */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {civicProblems.map((problem, i) => {
              const ImgComponent = problem.ImageComp;
              return (
                <div
                  key={i}
                  className="group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl border border-gray-100 transition-all hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {/* Cartoon illustration area */}
                  <div className="relative h-52 bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-6 overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(245,87,108,0.06)_0%,transparent_60%)]" />
                    <ImgComponent className="w-full h-full group-hover:scale-110 transition-transform duration-500" />
                    {/* Tag */}
                    <div className="absolute top-4 left-4">
                      <span className={`${problem.tagColor} text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm`}>
                        {problem.tag}
                      </span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{problem.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-5">{problem.desc}</p>
                    <Link
                      to={isAuthenticated ? "/report-form" : "/report"}
                      className="inline-flex items-center gap-1.5 text-[#f5576c] hover:text-[#ff6f91] font-semibold text-sm group/link transition-colors"
                    >
                      Report this issue
                      <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-16 animate-fade-in-up">
            <p className="text-gray-400 mb-5">Don't see your issue? Just choose "Other" in the form — we've got you covered.</p>
            <Link
              to={isAuthenticated ? "/report-form" : "/report"}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#f5576c] to-[#ff6f91] hover:from-[#ff6f91] hover:to-[#f5576c] text-white font-semibold rounded-xl shadow-lg shadow-[#f5576c]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Camera className="w-5 h-5" />
              Report Any Issue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          LOGIN PORTALS — Dept, Govt, Citizen
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-24 bg-gradient-to-br from-indigo-50 via-white to-purple-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-gradient-to-br from-[#f093fb]/10 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-tl from-[#4facfe]/10 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full px-5 py-2 text-sm font-medium mb-4 shadow-lg shadow-indigo-500/25">
              <Building2 className="w-4 h-4" />
              Access Portals
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Choose Your{" "}
              <span className="bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
                Portal
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Three dedicated portals for citizens, government administrators, and department officials.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Citizen Portal */}
            <div className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl border border-gray-100 transition-all hover:-translate-y-2 animate-fade-in-up">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-indigo-500/20">
                <Camera className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Citizen Portal</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Report civic issues like garbage, potholes, streetlights, and more. Track the status of your complaints in real-time.
              </p>
              <Link
                to={isAuthenticated ? "/my-complaints" : "/signup"}
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
              >
                {isAuthenticated ? "View My Complaints" : "Sign Up / Sign In"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Government Portal */}
            <div className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl border border-gray-100 transition-all hover:-translate-y-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Government Portal</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Overall dashboard for government administrators. View all complaints across departments with analytics and maps.
              </p>
              <Link
                to="/gov-login"
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm"
              >
                Government Login
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Department Portal */}
            <div className="group bg-white rounded-2xl p-8 shadow-md hover:shadow-2xl border border-gray-100 transition-all hover:-translate-y-2 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-amber-500/20">                            <Building2 className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Department Portal</h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6">
                Department-specific dashboards for Municipal, Electrical, PWD, Water, and General Administration officials.
              </p>
              <Link
                to="/dept-login"
                className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-sm"
              >
                Department Login
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#f5576c]/5 rounded-full blur-3xl" />
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#f093fb]/10 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#4facfe]/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Ready to Make a{" "}
              <span className="bg-gradient-to-r from-[#f093fb] to-[#f5576c] bg-clip-text text-transparent">
                Difference
              </span>
              ?
            </h2>
          </div>
          <p className="text-lg text-white/50 max-w-2xl mx-auto mb-10 animate-fade-in-up">
            Join thousands of citizens already using CivicResolve to report issues, track progress, and improve their communities — one report at a time.
          </p>
          <div className="flex justify-center animate-fade-in-up">
            <Link
              to={isAuthenticated ? "/report-form" : "/signup"}
              className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#f5576c] to-[#ff6f91] hover:from-[#ff6f91] hover:to-[#f5576c] text-white font-bold rounded-xl shadow-xl shadow-[#f5576c]/30 transition-all hover:-translate-y-1 hover:shadow-2xl"
            >
              {isAuthenticated ? <Camera className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              {isAuthenticated ? "Report an Issue Now" : "Get Started — It's Free"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
