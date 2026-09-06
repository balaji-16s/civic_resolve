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

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) setEmail(emailParam);
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

    if (!name.trim()) { setError("Please enter your name"); return; }
    const emailError = validateEmail(email);
    if (emailError) { setError(emailError); return; }
    if (!phone.trim()) { setError("Please enter your mobile number"); return; }
    const phoneError = validateIndianPhone(phone);
    if (phoneError) { setError(phoneError); return; }
    if (!password.trim()) { setError("Please enter a password"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); return; }

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

  const performVerifyOtp = async (otpValue) => {
    setError("");
    if (otpValue.length < 6) { setError("Please enter the complete 6-digit OTP"); return; }
    setLoading(true);
    try {
      const result = await verifyOtpAndLogin(email.trim().toLowerCase(), otpValue, name.trim(), phone.trim(), password);
      if (result.success) {
        const redirectTo = searchParams.get("redirect") || "/my-complaints";
        navigate(redirectTo);
      } else {
        setError(result.error || "Invalid OTP");
      }
    } catch (err) {
      setError(err.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => { e.preventDefault(); await performVerifyOtp(otp); };
  const handleOtpChange = (val) => { setOtp(val); setError(""); };
  const handleOtpComplete = (val) => { setOtp(val); performVerifyOtp(val); };
  const handleBack = () => { setStep(1); setOtp(""); setError(""); setEmailSent(false); };

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
                {step === 1 ? <User className="w-7 h-7 text-emerald-600" /> : <KeyRound className="w-7 h-7 text-emerald-600" />}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 mb-1">
                {step === 1 ? "Create Account" : "Verify Email"}
              </h1>
              <p className="text-slate-500 text-sm">
                {step === 1 ? "Set up your account to report issues" : `Enter the 6-digit OTP sent to ${email}`}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                {error}
              </div>
            )}

            {!emailSent && step === 2 && (
              <div className="bg-amber-50 text-amber-700 text-sm p-3 rounded-lg border border-amber-200">
                <strong>Note:</strong> Email service not configured. Check server console for OTP.
              </div>
            )}

            {step === 1 ? (
              <div className="space-y-5">
                <GoogleSignInButton label="Sign up with Google" />
                <div className="flex items-center gap-3">
                  <span className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs uppercase tracking-wider text-slate-400">or with email</span>
                  <span className="h-px flex-1 bg-slate-200" />
                </div>
                <form onSubmit={handleSignup} className="space-y-4">
                  <div>
                    <label htmlFor="signup-name" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Your Name
                    </label>
                    <input
                      id="signup-name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); setError(""); }}
                      className="w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label htmlFor="signup-email" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="signup-email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(""); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(""); }}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                        placeholder="Create a password (min 6 chars)"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-confirm-password" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                        className="w-full pl-10 pr-10 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                        placeholder="Re-enter your password"
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="signup-phone" className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        id="signup-phone"
                        type="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={(e) => { const val = e.target.value.replace(/\D/g, ""); if (val.length <= 10) setPhone(val); setError(""); }}
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none"
                        placeholder="Enter your 10-digit mobile number"
                      />
                    </div>
                  </div>

                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3">
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Creating account...</> : <><User className="w-4 h-4 mr-2" />Create Account</>}
                  </Button>
                </form>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center">
                  <Mail className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">Verification code sent to <strong className="text-slate-700">{email}</strong></p>
                </div>

                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={handleOtpChange} onComplete={handleOtpComplete}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((idx) => (
                        <InputOTPSlot key={idx} index={idx} className="w-11 h-12 text-lg font-bold border-2 border-slate-200 bg-slate-50 text-slate-900 data-[active=true]:border-emerald-500" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button type="submit" disabled={loading || otp.length < 6} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verifying...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Verify & Create Account</>}
                </Button>

                <div className="text-center">
                  <button type="button" onClick={handleBack} className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2">
                    ← Change details
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-slate-100 space-y-3 text-center">
              <p className="text-sm text-slate-500">
                Already have an account? <Link to="/signin" className="text-emerald-600 hover:text-emerald-700 font-medium">Sign In</Link>
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
