import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  User, LogIn, ShieldCheck, ArrowLeft, Mail, Smartphone, KeyRound, Loader2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function Login() {
  const [step, setStep] = useState(1); // 1: details, 2: OTP
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const { requestOtp, verifyOtpAndLogin } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!re.test(email.trim())) return "Please enter a valid email address";
    return null;
  };

  const validateIndianPhone = (phone) => {
    // Indian mobile numbers: exactly 10 digits, starting with 6, 7, 8, or 9
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length !== 10) return "Mobile number must be exactly 10 digits";
    if (!/^[6-9]/.test(cleaned)) return "Please enter a valid Indian mobile number (starts with 6-9)";
    return null;
  };

  const handleSendOtp = async (e) => {
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

    setLoading(true);
    try {
      const result = await requestOtp(email.trim().toLowerCase());
      if (result.success) {
        setEmailSent(result.emailSent || false);
        setStep(2);
      }
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  // Shared verification logic that works with the value directly (avoids stale state)
  const performVerifyOtp = async (otpValue) => {
    setError("");
    if (otpValue.length < 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOtpAndLogin(email.trim().toLowerCase(), otpValue, name.trim(), phone.trim());
      if (result.success) {
        navigate("/my-complaints");
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
    // Use the value directly from onComplete to avoid React stale-state race
    performVerifyOtp(val);
  };

  const handleBack = () => {
    setStep(1);
    setOtp("");
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
                {step === 1 ? (
                  <User className="w-8 h-8 text-white" />
                ) : (
                  <KeyRound className="w-8 h-8 text-white" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                {step === 1 ? "Citizen Login" : "Verify OTP"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {step === 1
                  ? "Enter your details to get started"
                  : `Enter the 6-digit OTP sent to ${email}`}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                {error}
              </div>
            )}

            {!emailSent && step === 2 && (
              <div className="bg-yellow-50 text-yellow-700 text-sm p-3 rounded-lg mb-4 border border-yellow-200">
                <strong>Note:</strong> Email service not configured. Check the server console for the OTP code.
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="login-name" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Your Name
                  </label>
                  <input
                    id="login-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label htmlFor="login-email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="login-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="Enter your email address"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    OTP will be sent to this email
                  </p>
                </div>

                <div>
                  <label htmlFor="login-phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      id="login-phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "");
                        if (val.length <= 10) setPhone(val);
                        setError("");
                      }}
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
                      placeholder="Enter your 10-digit mobile number"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Stored for complaint reference (OTP sent to email)
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Send OTP to Email
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form id="verify-otp-form" onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="text-center">
                  <Mail className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    We've sent a 6-digit code to<br />
                    <strong className="text-gray-700">{email}</strong>
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
                          className="w-11 h-12 text-lg font-bold border-2 data-[active=true]:border-indigo-500"
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <Button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white py-6 gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Verify & Login
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBack}
                    className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
                  >
                    ← Change email or phone
                  </button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-500 mb-3">
                Are you a government official?
              </p>
              <Link
                to="/gov-login"
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
              >
                <ShieldCheck className="w-4 h-4" />
                Government Login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
