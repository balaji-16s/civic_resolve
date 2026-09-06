import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LogIn, Mail, Lock, ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff, KeyRound, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function SignIn() {
  const [step, setStep] = useState("signin"); // "signin", "setup-password"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const [emailSent, setEmailSent] = useState(false);

  const { signin, setPassword: setupPassword } = useAuth();
  const navigate = useNavigate();

  // Pre-fill email from query param (when coming from ReportStart)
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      const result = await signin(email.trim().toLowerCase(), password);
      if (result.success) {
        const redirectTo = searchParams.get("redirect") || "/my-complaints";
        navigate(redirectTo);
      } else if (result.needsPasswordSetup) {
        // Legacy OTP-only user - needs to set up password
        setEmailSent(result.emailSent || false);
        setStep("setup-password");
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError(err.message || "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (otp.length < 6) {
      setError("Please enter the complete OTP");
      return;
    }

    setLoading(true);
    try {
      const result = await setupPassword(email.trim().toLowerCase(), otp, newPassword);
      if (result.success) {
        const redirectTo = searchParams.get("redirect") || "/my-complaints";
        navigate(redirectTo);
      } else {
        setError(result.error || "Failed to set password");
      }
    } catch (err) {
      setError(err.message || "Failed to set password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val) => {
    setOtp(val);
    setError("");
  };

  const handleBackToSignIn = () => {
    setStep("signin");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setEmailSent(false);
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border-2 border-white/15 bg-white/10 text-white placeholder-white/40 focus:border-[#f5576c] focus:bg-white/15 focus:ring-2 focus:ring-[#f5576c]/20 transition-all outline-none";

  const inputWithIconClass = (hasRightIcon = false) =>
    `${hasRightIcon ? "pl-10 pr-10" : "pl-10 pr-4"} py-2.5 rounded-lg border-2 border-white/15 bg-white/10 text-white placeholder-white/40 focus:border-[#f5576c] focus:bg-white/15 focus:ring-2 focus:ring-[#f5576c]/20 transition-all outline-none w-full`;

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
                {step === "signin" ? (
                  <LogIn className="w-8 h-8 text-white" />
                ) : (
                  <KeyRound className="w-8 h-8 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">
                {step === "signin" ? "Welcome Back" : "Set Up Password"}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {step === "signin"
                  ? "Sign in to your account to track complaints"
                  : `Enter the OTP sent to ${email} and set a password`}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/15 text-red-300 text-sm p-3 rounded-lg mb-4 border border-red-500/30">
                {error}
              </div>
            )}

            {step === "signin" ? (
              <div className="space-y-5">
                <GoogleSignInButton label="Sign in with Google" />
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/15" />
                  <span className="text-xs uppercase tracking-wider text-white/40">
                    or sign in with email
                  </span>
                  <span className="h-px flex-1 bg-white/15" />
                </div>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label htmlFor="signin-email" className="block text-sm font-semibold text-white/80 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        id="signin-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        className={inputWithIconClass()}
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signin-password" className="block text-sm font-semibold text-white/80 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        id="signin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        className={inputWithIconClass(true)}
                        placeholder="Enter your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right -mt-2">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-[#f093fb] hover:text-[#ff6f91] font-medium hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-[#f5576c] to-[#ff6f91] hover:from-[#ff6f91] hover:to-[#f5576c] text-white py-6 gap-2 shadow-lg shadow-[#f5576c]/25"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5" />
                        Sign In
                      </>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-4">
                {!emailSent && (
                  <div className="bg-amber-500/15 text-amber-300 text-sm p-3 rounded-lg border border-amber-500/30">
                    <strong>Note:</strong> Email service not configured. Check the server console for the OTP code.
                  </div>
                )}

                <div className="text-center">
                  <Mail className="w-10 h-10 text-[#f093fb] mx-auto mb-2" />
                  <p className="text-sm text-white/60">
                    An OTP was sent to<br />
                    <strong className="text-white">{email}</strong>
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <InputOTPSlot
                          key={idx}
                          index={idx}
                          className="w-11 h-12 text-lg font-bold border-2 border-white/15 bg-white/5 text-white data-[active=true]:border-[#f5576c]"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-semibold text-white/80 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      className={inputWithIconClass(true)}
                      placeholder="Create a new password (min 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-white/80 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      className={inputWithIconClass(true)}
                      placeholder="Re-enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/80"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                      Setting up...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Set Password & Sign In
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBackToSignIn}
                    className="text-sm text-white/50 hover:text-white/80 underline underline-offset-2"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-center">
              <p className="text-sm text-white/60">
                Don't have an account?{" "}
                <Link to="/signup" className="text-[#f093fb] hover:text-[#ff6f91] font-medium">
                  Create Account
                </Link>
              </p>
              <p className="text-sm text-white/60">
                Are you a government official?{" "}
                <Link to="/gov-login" className="inline-flex items-center gap-1 text-[#f093fb] hover:text-[#ff6f91] font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Government Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}