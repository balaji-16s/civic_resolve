import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  Mail, Lock, ArrowLeft, Loader2, ShieldCheck, Eye, EyeOff, KeyRound, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function ForgotPassword() {
  const [step, setStep] = useState("email"); // "email", "otp", "success"
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { forgotPassword, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const result = await forgotPassword(email.trim().toLowerCase());
      if (result.success) {
        setEmailSent(result.emailSent || false);
        setStep("otp");
      } else {
        setError(result.error || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length < 6) {
      setError("Please enter the complete OTP");
      return;
    }

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

    setLoading(true);
    try {
      const result = await resetPassword(email.trim().toLowerCase(), otp, newPassword);
      if (result.success) {
        setStep("success");
        setTimeout(() => navigate("/my-complaints"), 2000);
      } else {
        setError(result.error || "Failed to reset password");
      }
    } catch (err) {
      setError(err.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (val) => {
    setOtp(val);
    setError("");
  };

  const handleBack = () => {
    setStep("email");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setEmailSent(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-indigo-700 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          to="/signin"
          className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sign In
        </Link>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-8">
            {step === "success" ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
                <p className="text-gray-500 text-sm">
                  Your password has been reset successfully. Redirecting to your complaints...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 bg-gradient-to-br from-blue-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    {step === "email" ? (
                      <KeyRound className="w-8 h-8 text-white" />
                    ) : (
                      <Lock className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {step === "email" ? "Forgot Password" : "Reset Password"}
                  </h1>
                  <p className="text-gray-500 text-sm mt-1">
                    {step === "email"
                      ? "Enter your email and we'll send you a verification code"
                      : `Enter the OTP sent to ${email} and create a new password`}
                  </p>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {step === "email" ? (
                  <form onSubmit={handleSendOtp} className="space-y-4">
                    <div>
                      <label htmlFor="forgot-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="forgot-email"
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
                        <><Loader2 className="w-5 h-5 animate-spin" /> Sending OTP...</>
                      ) : (
                        <><Mail className="w-5 h-5" /> Send Verification Code</>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-4">
                    {!emailSent && (
                      <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-lg border border-yellow-200">
                        <strong>Note:</strong> Email service not configured. Check the server console for the OTP code.
                      </div>
                    )}

                    <div className="text-center">
                      <Mail className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        A verification code was sent to<br />
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
                              className="w-11 h-12 text-lg font-bold border-2 data-[active=true]:border-blue-500"
                            />
                          ))}
                        </InputOTPGroup>
                      </InputOTP>
                    </div>

                    <div>
                      <label htmlFor="reset-new-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        New Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="reset-new-password"
                          type={showNewPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                          className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                          placeholder="New password (min 6 characters)"
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
                      <label htmlFor="reset-confirm-password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          id="reset-confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                          className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                          placeholder="Re-enter your new password"
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
                      className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-6 gap-2"
                    >
                      {loading ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Resetting Password...</>
                      ) : (
                        <><CheckCircle2 className="w-5 h-5" /> Reset Password</>
                      )}
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
                      >
                        ← Use a different email
                      </button>
                    </div>
                  </form>
                )}

                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                  <p className="text-sm text-gray-500">
                    Remember your password?{" "}
                    <Link to="/signin" className="text-blue-600 hover:text-blue-700 font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
