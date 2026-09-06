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
  GitBranch,
  Users,
  Clock,
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

// ── Real civic issues ────────────────────────────────────────────────────
const civicProblems = [
  {
    ImageComp: GarbageImage,
    title: "Garbage Overflow",
    desc: "Overflowing waste bins and illegal dumping in residential areas causing health hazards and unpleasant odors.",
    tag: "Sanitation",
    color: "bg-amber-100 text-amber-700",
  },
  {
    ImageComp: StreetlightImage,
    title: "Malfunctioning Street Lights",
    desc: "Broken or non-functional street lights making roads unsafe at night and increasing accident risks.",
    tag: "Electrical",
    color: "bg-sky-100 text-sky-700",
  },
  {
    ImageComp: PotholeImage,
    title: "Potholes & Road Damage",
    desc: "Cracked roads and deep potholes damaging vehicles and causing traffic congestion and accidents.",
    tag: "Roads",
    color: "bg-red-100 text-red-700",
  },
  {
    ImageComp: WaterImage,
    title: "Water Supply Issues",
    desc: "Irregular water supply, pipe leakages, and contaminated water affecting daily life and health.",
    tag: "Water",
    color: "bg-blue-100 text-blue-700",
  },
  {
    ImageComp: DrainageImage,
    title: "Drainage Problems",
    desc: "Clogged drains causing waterlogging during rains, breeding mosquitoes and spreading diseases.",
    tag: "Drainage",
    color: "bg-teal-100 text-teal-700",
  },
  {
    ImageComp: DumpingImage,
    title: "Illegal Dumping",
    desc: "Unauthorized waste dumping in open lots and public spaces degrading the neighborhood environment.",
    tag: "Environment",
    color: "bg-stone-100 text-stone-700",
  },
];

// ── Stats ──────────────────────────────────────────────────────────────
const stats = [
  { number: "10K+", label: "Issues Reported", icon: MapPin, color: "bg-emerald-500" },
  { number: "95%", label: "Resolution Rate", icon: CheckCircle2, color: "bg-emerald-500" },
  { number: "50+", label: "Cities Covered", icon: ShieldCheck, color: "bg-sky-500" },
  { number: "24hr", label: "Avg Response", icon: Clock, color: "bg-amber-500" },
];

// ── Features ────────────────────────────────────────────────────────────
const features = [
  {
    icon: Camera,
    title: "Photo Evidence",
    desc: "Snap a photo of the issue. Visual evidence helps departments understand and resolve problems faster.",
  },
  {
    icon: GitBranch,
    title: "Track in Real-time",
    desc: "Watch your complaint move from pending to resolved. Get updates at every stage of the process.",
  },
  {
    icon: Users,
    title: "Right Department",
    desc: "Your report is automatically routed to the correct department — Municipal, PWD, Electrical, Water, or General Admin.",
  },
];

export default function Home() {
  const { isAuthenticated, isCitizen } = useAuth();

  return (
    <div className="min-h-screen">
      {/* ═══════════════════════════════════════════════════════════════
          HERO SECTION — Clean, modern with subtle background image
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Background with overlay */}
        <div className="absolute inset-0">
          <CitySkyline className="w-full h-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/85 to-sky-900/90" />
        </div>

        {/* Floating decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="animate-fade-in-up stagger-1">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 text-emerald-100 text-sm mb-6 border border-white/10 shadow-lg">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                <span>CivicResolve Platform</span>
                <span className="text-white/40 hidden sm:inline">— Smart Citizen Reporting</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                Make Your City
                <br />
                <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-sky-300 bg-clip-text text-transparent">
                  Better Today
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-emerald-100/80 max-w-lg mb-8 leading-relaxed">
                From garbage overflow to broken street lights — snap a photo, report it, and track the resolution. 
                Join citizens making their communities better, one report at a time.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-10">
                <Link
                  to={isAuthenticated ? "/report-form" : "/report"}
                  className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-emerald-900 font-semibold rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
                >
                  <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Report an Issue
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                {isAuthenticated && isCitizen ? (
                  <Link
                    to="/my-complaints"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <BarChart3 className="w-5 h-5" />
                    Track My Complaints
                  </Link>
                ) : (
                  <Link
                    to="/signin"
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 backdrop-blur-sm transition-all hover:-translate-y-1 hover:shadow-xl"
                  >
                    <Users className="w-5 h-5" />
                    Sign In to Track
                  </Link>
                )}
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap gap-6 text-emerald-100/70 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Free to use</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Real-time tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Government integrated</span>
                </div>
              </div>
            </div>

            {/* Right: Stats cards */}
            <div className="hidden lg:block animate-fade-in-up stagger-3">
              <div className="grid grid-cols-2 gap-4">
                {stats.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div
                      key={i}
                      className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/10 hover:bg-white/20 transition-all hover:-translate-y-1 hover:shadow-xl"
                    >
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors">
                        <Icon className="w-5 h-5 text-emerald-300" />
                      </div>
                      <div className="text-3xl font-bold text-white mb-1">{s.number}</div>
                      <div className="text-emerald-100/70 text-sm">{s.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
            <ChevronDown className="w-6 h-6 text-white/30" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FEATURES SECTION — What you can do
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="text-center max-w-3xl mx-auto mb-16 animate-fade-in-up stagger-1">
            <span className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Camera className="w-4 h-4" />
              Simple & Effective
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Report Issues in Three Steps
            </h2>
            <p className="text-slate-500 text-lg">
              No complicated forms. No waiting in line. Just snap, report, and track.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.15}s` }}
                >
                  <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-200 transition-colors">
                    <Icon className="w-7 h-7 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          WHAT YOU CAN REPORT — Civic issue cards
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-50 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-sky-50 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up stagger-1">
            <span className="inline-flex items-center gap-2 bg-sky-100 text-sky-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <MapPin className="w-4 h-4" />
              Common Issues
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              See a Problem? Report It
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              These are some of the most commonly reported civic issues. Every report goes to the right department.
            </p>
          </div>

          {/* Issue cards grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {civicProblems.map((problem, i) => {
              const ImgComponent = problem.ImageComp;
              return (
                <div
                  key={i}
                  className="group relative bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all animate-fade-in-up"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  {/* Illustrations */}
                  <div className="relative h-44 bg-slate-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(5,150,105,0.05)_0%,transparent_60%)]" />
                    <ImgComponent className="w-3/4 h-3/4 group-hover:scale-110 transition-transform duration-500" />
                    {/* Tag */}
                    <span className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full shadow-sm ${problem.color}`}>
                      {problem.tag}
                    </span>
                  </div>
                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-slate-900 mb-2">{problem.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">{problem.desc}</p>
                    <Link
                      to={isAuthenticated ? "/report-form" : "/report"}
                      className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 font-semibold text-sm group/link transition-colors"
                    >
                      Report this
                      <ArrowRight className="w-3.5 h-3.5 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-12 animate-fade-in-up stagger-4">
            <p className="text-slate-400 mb-5">Don't see your issue? Choose "Other" — we've got you covered.</p>
            <Link
              to={isAuthenticated ? "/report-form" : "/report"}
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <Camera className="w-5 h-5" />
              Report Any Issue
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          PORTALS SECTION — Three access points
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 animate-fade-in-up stagger-1">
            <span className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 rounded-full px-4 py-1.5 text-sm font-medium mb-4">
              <Building2 className="w-4 h-4" />
              Access Portals
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Choose Your Portal
            </h2>
            <p className="text-slate-500 text-lg max-w-2xl mx-auto">
              Three dedicated portals for citizens, government administrators, and department officials.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Citizen Portal */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all animate-fade-in-up stagger-2">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-5">
                <Users className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Citizen Portal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Report civic issues and track their progress. Your voice matters — every report gets attention.
              </p>
              <Link
                to={isAuthenticated ? "/my-complaints" : "/signup"}
                className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-semibold text-sm group/link"
              >
                {isAuthenticated ? "View My Complaints" : "Create Account"}
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Government Portal */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all animate-fade-in-up stagger-3">
              <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mb-5">
                <ShieldCheck className="w-7 h-7 text-sky-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Government Portal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Comprehensive dashboard for administrators. View all complaints, analytics, and oversee resolution across departments.
              </p>
              <Link
                to="/gov-login"
                className="inline-flex items-center gap-2 text-sky-600 hover:text-sky-700 font-semibold text-sm group/link"
              >
                Government Login
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Department Portal */}
            <div className="group bg-white rounded-2xl p-8 shadow-sm border border-slate-100 hover:shadow-xl hover:-translate-y-2 transition-all animate-fade-in-up stagger-4">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mb-5">
                <Building2 className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Department Portal</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6">
                Department-specific dashboards for Municipal, Electrical, PWD, Water, and General Administration teams.
              </p>
              <Link
                to="/dept-login"
                className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold text-sm group/link"
              >
                Department Login
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FINAL CTA SECTION
          ═══════════════════════════════════════════════════════════════ */}
      <section className="py-20 sm:py-28 bg-slate-900 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up stagger-1">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
              Join thousands of citizens using CivicResolve to report issues, track progress, and improve their communities.
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to={isAuthenticated ? "/report-form" : "/signup"}
                className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-1 hover:shadow-2xl"
              >
                {isAuthenticated ? <Camera className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                {isAuthenticated ? "Report an Issue Now" : "Get Started — It's Free"}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/signin"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl border border-white/20 transition-all hover:-translate-y-1"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

