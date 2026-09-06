import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  User, Mail, Lock, Smartphone, KeyRound, Loader2, CheckCircle2, ArrowLeft, ShieldCheck, Eye, EyeOff
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import GoogleSignInButton from "@/components/GoogleSignInButton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function SignUp() {
  const [step, setStep] = useState(1); // 1: details, 2: OTP
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [otp, setOtp] = useState("");
  const [searchParams] = useSearchParams();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { signup, verifyOtpAndLogin } = useAuth();
  const navigate = useNavigate();

  // Pre-fill email from query param (when coming from ReportStart)
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email.trim())) return "Please enter a valid email address";
    return null;
  };

  const validateIndianPhone = (phone) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) return "Mobile number must be exactly 10 digits";
    if (!/^[6-9]/.test(cleaned)) return "Please enter a valid Indian mobile number (starts with 6-9)";
    return null;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    if (!phone.trim()) {
      setError("Please enter your mobile number");
      return;
    }

    const phoneError = validateIndianPhone(phone);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    if (!password.trim()) {
      setError("Please enter a password");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      const result = await signup(email.trim().toLowerCase(), password, name.trim(), phone.trim());
      if (result.success) {
        setEmailSent(result.emailSent || false);
        setStep(2);
      } else {
        setError(result.error || "Sign up failed");
      }
    } catch (err) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  // Shared verification logic
  const performVerifyOtp = async (otpValue) => {
    setError("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOtpAndLogin(
        email.trim().toLowerCase(),
        otpValue,
        name.trim(),
        phone.trim(),
        password  // Send password so backend can store it
      );
      if (result.success) {
        const redirectTo = searchParams.get("redirect") || "/my-complaints";
        navigate(redirectTo);
      } else {
        setError(result.error || "Invalid OTP");
      }
    } catch (err) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    await performVerifyOtp(otp);
  };

  const handleOtpChange = (val) => {
    setOtp(val);
    setError("");
  };

  const handleOtpComplete = (val) => {
    setOtp(val);
    performVerifyOtp(val);
  };

  const handleBack = () => {
    setStep(1);
    setOtp("");
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
                {step === 1 ? (
                  <User className="w-8 h-8 text-white" />
                ) : (
                  <KeyRound className="w-8 h-8 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-white">
                {step === 1 ? "Create Account" : "Verify Email"}
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {step === 1
                  ? "Set up your account to report issues"
                  : `Enter the 6-digit OTP sent to ${email}`}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/15 text-red-300 text-sm p-3 rounded-lg mb-4 border border-red-500/30">
                {error}
              </div>
            )}

            {!emailSent && step === 2 && (
              <div className="bg-amber-500/15 text-amber-300 text-sm p-3 rounded-lg mb-4 border border-amber-500/30">
                <strong>Note:</strong> Email service not configured. Check the server console for the OTP code.
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-5">
                <GoogleSignInButton label="Sign up with Google" />
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-white/15" />
                  <span className="text-xs uppercase tracking-wider text-white/40">
                    or sign up with email
                  </span>
                  <span className="h-px flex-1 bg-white/15" />
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label htmlFor="signup-name" className="block text-sm font-semibold text-white/80 mb-1.5">
                      Your Name
                    </label>
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(""); }}
                      className={inputClass}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="block text-sm font-semibold text-white/80 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        id="signup-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        className={inputWithIconClass()}
                        placeholder="Enter your email address"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="block text-sm font-semibold text-white/80 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        id="signup-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        className={inputWithIconClass(true)}
                        placeholder="Create a password (min 6 characters)"
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

                  <div>
                    <label htmlFor="signup-confirm-password" className="block text-sm font-semibold text-white/80 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        id="signup-confirm-password"
                        name="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                        className={inputWithIconClass(true)}
                        placeholder="Re-enter your password"
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

                  <div>
                    <label htmlFor="signup-phone" className="block text-sm font-semibold text-white/80 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                      <input
                        id="signup-phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          if (val.length <= 10) setPhone(val);
                          setError("");
                        }}
                        className={inputWithIconClass()}
                        placeholder="Enter your 10-digit mobile number"
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
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <User className="w-5 h-5" />
                        Create Account
                      </>
                    )}
                  </Button>
                </form>
              </div>
            ) : (
              <form id="verify-otp-form" onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center">
                  <Mail className="w-10 h-10 text-[#f093fb] mx-auto mb-2" />
                  <p className="text-sm text-white/60">
                    We've sent a verification code to<br />
                    <strong className="text-white">{email}</strong>
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={handleOtpChange}
                    onComplete={handleOtpComplete}
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

                <Button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-[#f5576c] to-[#ff6f91] hover:from-[#ff6f91] hover:to-[#f5576c] text-white py-6 gap-2 shadow-lg shadow-[#f5576c]/25"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Verify & Create Account
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-sm text-white/50 hover:text-white/80 underline underline-offset-2"
                  >
                    ← Change details
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 space-y-3 text-center">
              <p className="text-sm text-white/60">
                Already have an account?{" "}
                <Link to="/signin" className="text-[#f093fb] hover:text-[#ff6f91] font-medium">
                  Sign In
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