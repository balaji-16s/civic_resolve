import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Home, Camera, BarChart3, FileText, LogIn, LogOut, User, Building } from "lucide-react";
export default function Layout() {
  const location = useLocation();
  const { isAuthenticated, isGov, isCitizen, isDept, user, deptUser, logout } = useAuth();
  const isActive = (path) => location.pathname === path;
  const deptHomePath = deptUser?.role === "head" ? "/dept-dashboard" : "/officer-dashboard";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-emerald-600">
              <ShieldCheck className="w-6 h-6" />
              CivicResolve
            </Link>

            <div className="flex items-center gap-1">
              <Link to="/" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                <Home className="w-4 h-4" /><span className="hidden sm:inline">Home</span>
              </Link>

              {!isDept && !isGov && (
                <Link to="/dept-login" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/dept-login") ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                  <Building className="w-4 h-4" /><span className="hidden sm:inline">Dept Login</span>
                </Link>
              )}

              {!isDept && !isGov && (
                <Link to="/gov-login" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/gov-login") ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                  <ShieldCheck className="w-4 h-4" /><span className="hidden sm:inline">Govt Login</span>
                </Link>
              )}

              {!isGov && (
                <Link to={isAuthenticated ? "/report-form" : "/report"} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/report") || isActive("/report-form") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                  <Camera className="w-4 h-4" /><span className="hidden sm:inline">Report Issue</span>
                </Link>
              )}

              {isCitizen && (
                <Link to="/my-complaints" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/my-complaints") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                  <FileText className="w-4 h-4" /><span className="hidden sm:inline">My Complaints</span>
                </Link>
              )}

              {isGov && (
                <Link to="/dashboard" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/dashboard") ? "bg-sky-50 text-sky-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                  <BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}

              {isDept && (
                <Link to={deptHomePath} className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive(deptHomePath) ? "bg-amber-50 text-amber-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                  <BarChart3 className="w-4 h-4" /><span className="hidden sm:inline">{deptUser?.role === "head" ? "Head Dashboard" : "My Work"}</span>
                </Link>
              )}

              <div className="ml-2 pl-2 border-l border-slate-200 flex items-center gap-1">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 hidden sm:inline"><User className="w-3 h-3 inline mr-1" />{user?.name}</span>
                    <button onClick={logout} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-all">
                      <LogOut className="w-4 h-4" /><span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <Link to="/signup" className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/signup") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>Sign Up</Link>
                    <Link to="/signin" className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${isActive("/signin") ? "bg-emerald-50 text-emerald-700" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"}`}>
                      <LogIn className="w-4 h-4" /><span className="hidden sm:inline">Sign In</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="bg-slate-900 text-slate-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">CivicResolve Platform</p>
          <p className="text-xs mt-1 text-slate-500">Empowering citizens, enabling transparent governance</p>
        </div>
      </footer>
    </div>
  );
}
