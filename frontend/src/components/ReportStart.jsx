import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, Search } from "lucide-react";
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
    e.preventDefault();
    setError("");

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const result = await checkEmail(email.trim().toLowerCase());
      const encodedEmail = encodeURIComponent(email.trim().toLowerCase());
      if (result.exists) {
        // Existing user → go to sign in with email pre-filled, redirect to report-form
        navigate(`/signin?email=${encodedEmail}&redirect=%2Freport-form`);
      } else {
        // New user → go to sign up with email pre-filled, redirect to report-form
        navigate(`/signup?email=${encodedEmail}&redirect=%2Freport-form`);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden flex items-center justify-center p-4">
      {/* Decorative background */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-[#f093fb]/15 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-[#f5576c]/15 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-[#4facfe]/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "0.8s" }} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#f093fb] to-[#f5576c] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#f5576c]/30">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">Report an Issue</h1>
              <p className="text-white/60 text-sm mt-1">
                Enter your email to get started. We'll check if you're a new or returning user.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/15 text-red-300 text-sm p-3 rounded-lg mb-4 border border-red-500/30">
                {error}
              </div>
            )}

            <div className="space-y-5">
              <GoogleSignInButton label="Continue with Google" redirect="/report-form" />
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-white/15" />
                <span className="text-xs uppercase tracking-wider text-white/40">
                  or continue with email
                </span>
                <span className="h-px flex-1 bg-white/15" />
              </div>
            </div>

            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div>
                <label htmlFor="check-email" className="block text-sm font-semibold text-white/80 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    id="check-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-white/15 bg-white/10 text-white placeholder-white/40 focus:border-[#f5576c] focus:bg-white/15 focus:ring-2 focus:ring-[#f5576c]/20 transition-all outline-none"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#f5576c] to-[#ff6f91] hover:from-[#ff6f91] hover:to-[#f5576c] text-white py-6 gap-2 shadow-lg shadow-[#f5576c]/25"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Continue
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-center">
              <p className="text-sm text-white/60">
                Already signed in?{" "}
                <Link to="/report-form" className="text-[#f093fb] hover:text-[#ff6f91] font-medium">
                  Go to Report
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}