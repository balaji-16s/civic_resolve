import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-teal-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Report an Issue</h1>
              <p className="text-gray-500 text-sm mt-1">
                Enter your email to get started. We'll check if you're a new or returning user.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div>
                <label htmlFor="check-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    id="check-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setError(""); }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-6 gap-2"
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

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-center">
              <p className="text-sm text-gray-500">
                Already signed in?{" "}
                <Link to="/report-form" className="text-blue-600 hover:text-blue-700 font-medium">
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
