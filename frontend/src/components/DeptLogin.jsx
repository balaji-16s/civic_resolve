import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, LogIn, ArrowLeft, Eye, EyeOff, Building2, Users, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const departments = [
  { slug: "municipal", name: "Municipal Department", icon: "🏛️", desc: "Garbage, Drainage & Parks", color: "from-emerald-500 to-teal-600" },
  { slug: "electrical", name: "Electrical Department", icon: "⚡", desc: "Street Lights & Electrical", color: "from-amber-500 to-orange-600" },
  { slug: "pwd", name: "Public Works (PWD)", icon: "🛣️", desc: "Roads & Infrastructure", color: "from-blue-500 to-indigo-600" },
  { slug: "water", name: "Water Department", icon: "💧", desc: "Water Supply", color: "from-cyan-500 to-blue-600" },
  { slug: "general", name: "General Administration", icon: "📋", desc: "Traffic & Other Issues", color: "from-purple-500 to-violet-600" },
];

export default function DeptLogin() {
  const navigate = useNavigate();
  const { deptLogin } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password");
      return;
    }

    setLoading(true);
    const result = await deptLogin({ username: username.trim(), password });
    setLoading(false);

    if (result.success) {
      navigate("/dept-dashboard");
    } else {
      setError(result.error || "Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Department Selection Cards */}
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white mb-1">Department Login</h1>
              <p className="text-gray-400 text-sm">Select your department and sign in</p>
            </div>
            <div className="space-y-3">
              {departments.map((dept) => (
                <button
                  key={dept.slug}
                  onClick={() => setSelectedDept(dept)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedDept?.slug === dept.slug
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-gray-700 bg-gray-800/50 hover:border-gray-500 hover:bg-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{dept.icon}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-white text-sm">{dept.name}</p>
                      <p className="text-xs text-gray-400">{dept.desc}</p>
                    </div>
                    <ChevronRight className={`w-4 h-4 ${selectedDept?.slug === dept.slug ? "text-indigo-400" : "text-gray-600"}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <div>
            {selectedDept ? (
              <Card className="border-0 shadow-2xl bg-gray-800/50 backdrop-blur-xl border border-gray-700">
                <CardContent className="p-8">
                  <div className="text-center mb-8">
                    <div className={`w-16 h-16 bg-gradient-to-br ${selectedDept.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                      <span className="text-2xl">{selectedDept.icon}</span>
                    </div>
                    <h2 className="text-xl font-bold text-white">{selectedDept.name}</h2>
                    <p className="text-gray-400 text-sm mt-1">
                      Sign in as Head or Officer
                    </p>
                  </div>

                  {error && (
                    <div className="bg-red-900/50 text-red-300 text-sm p-3 rounded-lg mb-4 border border-red-800">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="dept-username" className="block text-sm font-semibold text-gray-300 mb-1.5">
                        Username
                      </label>
                      <input
                        id="dept-username"
                        name="username"
                        type="text"
                        autoComplete="username"
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(""); }}
                        className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                        placeholder={`${selectedDept.slug}_head or ${selectedDept.slug}_officer_1`}
                      />
                    </div>

                    <div>
                      <label htmlFor="dept-password" className="block text-sm font-semibold text-gray-300 mb-1.5">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          id="dept-password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="current-password"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setError(""); }}
                          className="w-full px-4 py-2.5 pr-12 rounded-lg border-2 border-gray-600 bg-gray-700/50 text-white placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                          placeholder="Enter your password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loading}
                      className={`w-full bg-gradient-to-r ${selectedDept.color} text-white py-6 gap-2 disabled:opacity-60`}
                    >
                      <LogIn className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
                      {loading ? "Signing in..." : "Access Department Dashboard"}
                    </Button>
                  </form>

                  <div className="mt-6 pt-6 border-t border-gray-700 text-center">
                    <p className="text-xs text-gray-500 space-y-1">
                      <span className="block">Head: <span className="text-gray-400 font-mono">{selectedDept.slug}_head / head@123</span></span>
                      <span className="block">Officer: <span className="text-gray-400 font-mono">{selectedDept.slug}_officer_1 / officer@123</span></span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Building2 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="text-lg font-medium mb-1">Select a Department</p>
                  <p className="text-sm">Choose a department from the left to sign in</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
