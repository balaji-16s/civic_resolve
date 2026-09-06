import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, LogIn, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
export default function GovLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { govLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!username.trim() || !password.trim()) { setError("Enter both username and password"); return; }
    setLoading(true);
    const result = await govLogin({ username: username.trim(), password });
    setLoading(false);
    if (result.success) navigate("/dashboard");
    else setError(result.error || "Invalid credentials");
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 mb-6"><ArrowLeft className="w-4 h-4" />Back to Home</Link>
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShieldCheck className="w-7 h-7 text-sky-600" /></div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Government Login</h1>
              <p className="text-slate-500 text-sm">Authorized personnel only</p>
            </div>
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
                <input value={username} onChange={e => { setUsername(e.target.value); setError(""); }} className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all outline-none" placeholder="Enter username" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={e => { setPassword(e.target.value); setError(""); }} className="w-full px-4 py-2.5 pr-10 rounded-lg border-2 border-slate-200 bg-white focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all outline-none" placeholder="Enter password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-sky-600 hover:bg-sky-700 text-white py-3">{loading ? <><LogIn className="w-4 h-4 animate-spin mr-2" />Signing in...</> : <><LogIn className="w-4 h-4 mr-2" />Access Dashboard</>}</Button>
            </form>
            <div className="mt-6 pt-6 border-t border-slate-100 text-center"><p className="text-xs text-slate-500">Demo: <span className="text-slate-400 font-mono">admin / admin123</span></p></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
