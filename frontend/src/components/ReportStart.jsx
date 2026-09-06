import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, Camera, LogIn, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import { checkEmail } from "@/lib/api";

export default function ReportStart() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckEmail = async (e) => {
    e.preventDefault(); setError("");
    if (!email.trim()) { setError("Enter your email"); return; }
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim())) { setError("Invalid email"); return; }
    setLoading(true);
    try {
      const result = await checkEmail(email.toLowerCase());
      const enc = encodeURIComponent(email.toLowerCase());
      navigate(result.exists ? `/signin?email=${enc}&redirect=%2Freport-form` : `/signup?email=${enc}&redirect=%2Freport-form`);
    } catch (err) { setError(err.message || "Something went wrong"); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Camera className="w-7 h-7 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">Report an Issue</h1>
              <p className="text-slate-500 text-sm">Sign in to report a civic issue</p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <GoogleSignInButton label="Sign in with Google" />
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-xs uppercase tracking-wider text-slate-400">or with email</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
              <form onSubmit={handleCheckEmail} className="space-y-4">
                <div>
                  <label htmlFor="report-email" className="block text-base font-bold text-slate-800 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      id="report-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-black bg-white focus:border-black focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div className="text-right">
                  <Link to="/forgot-password" className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
                    Forgot Password?
                  </Link>
                </div>

                <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Checking...</> : <><LogIn className="w-4 h-4 mr-2" />Continue</>}
                </Button>
              </form>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-center">
              <p className="text-sm text-slate-500">
                Don't have an account? <Link to="/signup" className="text-emerald-600 hover:text-emerald-700 font-medium">Create Account</Link>
              </p>
              <p className="text-sm text-slate-500">
                Government official? <Link to="/gov-login" className="inline-flex items-center gap-1 text-sky-600 hover:text-sky-700 font-medium"><ShieldCheck className="w-3.5 h-3.5" />Government Login</Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}