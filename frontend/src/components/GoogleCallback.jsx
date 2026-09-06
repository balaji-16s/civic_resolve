import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

const ERROR_MESSAGES = {
  access_denied: "You cancelled the Google sign-in or denied access.",
  not_configured: "Google Sign-In isn't configured on the server yet. Ask the admin to add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
  token_exchange_failed: "We couldn't complete the Google sign-in (token exchange failed). Please try again.",
  invalid_token: "Google returned an invalid token. Please try again.",
  profile_fetch_failed: "We couldn't fetch your Google profile. Please try again.",
  no_email: "Your Google account doesn't have an email address we can use.",
  email_not_verified: "Your Google email address isn't verified, so we can't create an account.",
};

export default function GoogleCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get("token");
    const err = searchParams.get("error");

    if (err) {
      setError(ERROR_MESSAGES[err] || "Google sign-in failed. Please try again.");
      setLoading(false);
      return;
    }

    if (!token) {
      setError("Missing token from Google sign-in. Please try again.");
      setLoading(false);
      return;
    }

    // The state param carries the post-login destination (set by the Google button)
    const state = searchParams.get("state") || "/my-complaints";
    const redirectTo = state.startsWith("/") ? state : "/my-complaints";

    const complete = async () => {
      const result = await loginWithGoogle(token);
      if (result.success) {
        navigate(redirectTo, { replace: true });
      } else {
        setError(result.error || "Failed to complete Google sign-in.");
        setLoading(false);
      }
    };
    complete();
    // Run once on mount
    // eslint-disable-next-line
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute top-20 -left-20 w-96 h-96 bg-[#f093fb]/15 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-[#f5576c]/15 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "1.5s" }} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 pointer-events-none" />

      <div className="relative w-full max-w-md text-center">
        {loading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#f093fb] to-[#f5576c] rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-[#f5576c]/30">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
            <h1 className="text-xl font-bold text-white">Signing you in...</h1>
            <p className="text-white/60 text-sm">Completing your Google sign-in</p>
          </div>
        ) : (
          <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-left">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-300" />
              </div>
              <h1 className="text-lg font-bold text-white mt-1.5">Google Sign-In Failed</h1>
            </div>
            <p className="text-sm text-white/70 mb-6">{error}</p>
            <div className="space-y-2">
              <Link
                to="/signin"
                className="block w-full text-center px-4 py-3 bg-gradient-to-r from-[#f5576c] to-[#ff6f91] hover:from-[#ff6f91] hover:to-[#f5576c] text-white font-semibold rounded-xl shadow-lg shadow-[#f5576c]/25 transition-all"
              >
                Back to Sign In
              </Link>
              <Link
                to="/"
                className="block w-full text-center px-4 py-3 bg-white/10 hover:bg-white/20 text-white/80 font-medium rounded-xl border border-white/15 transition-all"
              >
                <span className="inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  Go to Home
                </span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}