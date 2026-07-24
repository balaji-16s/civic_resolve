import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Home, Camera, BarChart3, FileText, LogIn, LogOut, User, Building } from "lucide-react";

export default function Layout() {
  const location = useLocation();
  const { isAuthenticated, isGov, isCitizen, isDept, user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (  
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
              <ShieldCheck className="w-6 h-6" />
              CivicResolve
            </Link>

            <div className="flex items-center gap-1">
              {/* Public & Citizen: Home */}
              <Link
                to="/"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isActive("/") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">Home</span>
              </Link>

              {/* Dept Login button in menu */}
              {!isDept && !isGov && (
                <Link
                  to="/dept-login"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dept-login") ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span className="hidden sm:inline">Dept Login</span>
                </Link>
              )}

              {/* Govt Login button in menu */}
              {!isDept && !isGov && (
                <Link
                  to="/gov-login"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/gov-login") ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span className="hidden sm:inline">Govt Login</span>
                </Link>
              )}

              {/* Public & Citizen: Report Issue - logged in users go directly to form */}
              {!isGov && (
                <Link
                  to={isAuthenticated ? "/report-form" : "/report"}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/report") || isActive("/report-form") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <Camera className="w-4 h-4" />
                  <span className="hidden sm:inline">Report Issue</span>
                </Link>
              )}

              {/* Citizen only: My Complaints */}
              {isCitizen && (
                <Link
                  to="/my-complaints"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/my-complaints") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">My Complaints</span>
                </Link>
              )}

              {/* Gov only: Dashboard */}
              {isGov && (
                <Link
                  to="/dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dashboard") ? "bg-emerald-50 text-emerald-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              )}

              {/* Dept only: Dept Dashboard */}
              {isDept && (
                <Link
                  to="/dept-dashboard"
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive("/dept-dashboard") ? "bg-amber-50 text-amber-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Dept Dashboard</span>
                </Link>
              )}

              {/* Auth buttons */}
              <div className="ml-2 pl-2 border-l border-gray-200 flex items-center gap-1">
                {isAuthenticated ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 hidden sm:inline">
                      <User className="w-3 h-3 inline mr-1" />
                      {user?.name}
                    </span>
                    <button
                      onClick={logout}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="hidden sm:inline">Logout</span>
                    </button>
                  </div>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive("/signup") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      Sign Up
                    </Link>
                    <Link
                      to="/signin"
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive("/signin") ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      <LogIn className="w-4 h-4" />
                      <span className="hidden sm:inline">Sign In</span>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">Built for CivicResolve Platform</p>
          <p className="text-xs mt-1">Empowering citizens, enabling transparent governance</p>
        </div>
      </footer>
    </div>
  );
}
