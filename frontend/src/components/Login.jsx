import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { User, LogIn, ShieldCheck, ArrowLeft, Mail, Smartphone, KeyRound, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
export default function Login() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { requestOtp, verifyOtpAndLogin } = useAuth();
  const navigate = useNavigate();

  const validateEmail = (email) => { const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/; return re.test(email.trim()) ? null : "Invalid email"; };
  const validatePhone = (phone) => { const c = phone.replace(/\D/g, ""); if (c.length !== 10) return "10 digits required"; if (!/^[6-9]/.test(c)) return "Start with 6-9"; return null; };

  const handleSendOtp = async (e) => {
    e.preventDefault(); setError("");
    if (!name.trim()) { setError("Enter your name"); return; }
    const ee = validateEmail(email); if (ee) { setError(ee); return; }
    if (!phone.trim()) { setError("Enter mobile number"); return; }
    const pe = validatePhone(phone); if (pe) { setError(pe); return; }
    setLoading(true);
    try {
      const r = await requestOtp(email.toLowerCase());
      if (r.success) { setEmailSent(r.emailSent || false); setStep(2); }
    } catch (err) { setError(err.message || "Failed"); } finally { setLoading(false); }
  };

  const verify = async (v) => {
    setError("");
    if (v.length < 6) { setError("Enter complete OTP"); return; }
    setLoading(true);
    try {
      const r = await verifyOtpAndLogin(email.toLowerCase(), v, name.trim(), phone.trim());
      if (r.success) navigate("/my-complaints"); else setError(r.error || "Invalid OTP");
    } catch (err) { setError(err.message || "Failed"); } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-emerald-600 to-sky-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 mb-6"><ArrowLeft className="w-4 h-4" />Back</Link>
        <Card className="border-0 shadow-xl">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                {step === 1 ? <User className="w-7 h-7 text-white" /> : <KeyRound className="w-7 h-7 text-white" />}
              </div>
              <h1 className="text-2xl font-bold text-white mb-1">{step === 1 ? "Citizen Login" : "Verify OTP"}</h1>
              <p className="text-white/70 text-sm">{step === 1 ? "Enter details to get OTP" : `OTP sent to ${email}`}</p>
            </div>
            {error && <div className="bg-red-500/20 text-red-200 text-sm p-3 rounded-lg mb-4 border border-red-500/30">{error}</div>}
            {!emailSent && step === 2 && <div className="bg-yellow-500/20 text-yellow-200 text-sm p-3 rounded-lg mb-4 border border-yellow-500/30">Email not configured. Check server console for OTP.</div>}
            {step === 1 ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div><label className="block text-sm font-semibold text-white/80 mb-1.5">Name</label><input value={name} onChange={e => { setName(e.target.value); setError(""); }} className="w-full px-4 py-2.5 rounded-lg border-2 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white focus:ring-2 focus:ring-white/20 outline-none" placeholder="Your name" /></div>
                <div><label className="block text-sm font-semibold text-white/80 mb-1.5">Email</label><div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><input type="email" value={email} onChange={e => { setEmail(e.target.value); setError(""); }} className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white focus:ring-2 focus:ring-white/20 outline-none" placeholder="Email address" /></div><p className="text-xs text-white/40 mt-1">OTP sent here</p></div>
                <div><label className="block text-sm font-semibold text-white/80 mb-1.5">Mobile</label><div className="relative"><Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" /><input type="tel" value={phone} onChange={e => { const v = e.target.value.replace(/\D/g, ""); if (v.length <= 10) setPhone(v); setError(""); }} className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-white/20 bg-white/10 text-white placeholder-white/40 focus:border-white focus:ring-2 focus:ring-white/20 outline-none" placeholder="10-digit number" /></div></div>
                <Button type="submit" disabled={loading} className="w-full bg-white text-emerald-700 hover:bg-emerald-50 py-3">{loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</> : <><LogIn className="w-4 h-4 mr-2" />Send OTP</>}</Button>
              </form>
            ) : (
              <form onSubmit={e => { e.preventDefault(); verify(otp); }} className="space-y-6">
                <div className="text-center"><Mail className="w-10 h-10 text-white/60 mx-auto mb-2" /><p className="text-sm text-white/70">Code sent to <strong className="text-white">{email}</strong></p></div>
                <div className="flex justify-center"><InputOTP maxLength={6} value={otp} onChange={setOtp} onComplete={verify}><InputOTPGroup>{[0,1,2,3,4,5].map(idx => <InputOTPSlot key={idx} index={idx} className="w-11 h-12 text-lg font-bold border-2 border-white/20 bg-white/5 text-white data-[active=true]:border-white" />)}</InputOTPGroup></InputOTP></div>
                <Button type="submit" disabled={loading || otp.length < 6} className="w-full bg-white text-emerald-700 hover:bg-emerald-50 py-3">{loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verifying...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Verify & Login</>}</Button>
                <div className="text-center"><button type="button" onClick={() => { setStep(1); setOtp(""); setError(""); setEmailSent(false); }} className="text-sm text-white/50 hover:text-white underline">← Change details</button></div>
              </form>
            )}
            <div className="mt-6 pt-6 border-t border-white/10 text-center"><p className="text-sm text-white/60 mb-3">Government official?</p><Link to="/gov-login" className="inline-flex items-center gap-2 text-white font-medium"><ShieldCheck className="w-4 h-4" />Government Login</Link></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
