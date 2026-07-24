import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  LogIn, Mail, Lock, ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff, KeyRound, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center p-4">
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
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {step === "signin" ? (
                  <LogIn className="w-8 h-8 text-white" />
                ) : (
                  <KeyRound className="w-8 h-8 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {step === "signin" ? "Welcome Back" : "Set Up Password"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {step === "signin"
                  ? "Sign in to your account to track complaints"
                  : `Enter the OTP sent to ${email} and set a password`}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                {error}
              </div>
            )}

            {step === "signin" ? (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label htmlFor="signin-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="signin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="Enter your email address"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signin-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="signin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="Enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-right -mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium hover:underline"
                  >
                    Forgot Password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 gap-2"
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
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-4">
                {!emailSent && (
                  <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-lg border border-yellow-200">
                    <strong>Note:</strong> Email service not configured. Check the server console for the OTP code.
                  </div>
                )}

                <div className="text-center">
                  <Mail className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    An OTP was sent to<br />
                    <strong className="text-gray-700">{email}</strong>
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
                          className="w-11 h-12 text-lg font-bold border-2 data-[active=true]:border-indigo-500"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div>
                  <label htmlFor="new-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="Create a new password (min 6 characters)"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirm-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                      className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="Re-enter your password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 gap-2"
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
                    className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-center">
              <p className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Link to="/signup" className="text-indigo-600 hover:text-indigo-700 font-medium">
                  Create Account
                </Link>
              </p>
              <p className="text-sm text-gray-500">
                Are you a government official?{" "}
                <Link to="/gov-login" className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium">
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
