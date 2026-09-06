import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, MapPin, Camera, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { createComplaint } from "@/lib/api";

const issueTypes = [
  { value: "garbage", label: "Garbage Collection", dept: "Municipal Department", icon: "🗑️" },
  { value: "pothole", label: "Pothole / Road Damage", dept: "PWD", icon: "🛣️" },
  { value: "streetlight", label: "Street Light Issue", dept: "Electrical Department", icon: "💡" },
  { value: "drainage", label: "Drainage Problem", dept: "Municipal Department", icon: "🌊" },
  { value: "water", label: "Water Supply Issue", dept: "Water Department", icon: "🚰" },
  { value: "traffic", label: "Traffic Signal Problem", dept: "General Admin", icon: "🚦" },
  { value: "park", label: "Park Maintenance", dept: "Municipal Department", icon: "🌳" },
  { value: "other", label: "Other", dept: "General Admin", icon: "📋" },
];
export default function Report() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [gettingLocation, setGettingLocation] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({ issueType: "", description: "", location: "" });

  const update = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); if (field === "issueType") setError(""); };

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) { const reader = new FileReader(); reader.onload = (e) => setPhoto(e.target.result); reader.readAsDataURL(file); }
    else setPhoto(null);
  };

  const getLocation = () => {
    setGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => { update("location", `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`); setGettingLocation(false); },
        () => { setGettingLocation(false); }
      );
    } else setGettingLocation(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setError("");
    if (!form.issueType) { setError("Select an issue type"); return; }
    setSubmitting(true);
    try {
      await createComplaint({ issueType: form.issueType, description: form.description, location: form.location, photo });
      setSuccess(true); setForm({ issueType: "", description: "", location: "" }); setPhoto(null); if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) { setError(err.message || "Failed to submit"); }
    finally { setSubmitting(false); }
  };

  const inputClass = "w-full px-4 py-2.5 rounded-lg border-2 border-slate-200 bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all outline-none";
  const selected = issueTypes.find(t => t.value === form.issueType);

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" className="text-slate-600 hover:text-slate-900 mb-6" onClick={() => navigate("/")}><ArrowLeft className="w-4 h-4 mr-2" />Back</Button>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 rounded-full px-4 py-1.5 text-xs font-medium mb-4"><span className="w-2 h-2 bg-emerald-500 rounded-full" />Logged in as {user?.name}</div>
          <h1 className="text-3xl font-bold text-slate-900">Report an Issue</h1>
          <p className="text-slate-500 mt-1">Help improve your community by reporting civic issues</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {success && <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 p-4 rounded-xl mb-6 text-sm"><CheckCircle2 className="w-5 h-5 shrink-0" />Your complaint has been submitted successfully!</div>}
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">{error}</div>}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Issue Type *</label>
                <select value={form.issueType} onChange={e => update("issueType", e.target.value)} className={inputClass} required>
                  <option value="">Select issue type...</option>
                  {issueTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              {selected && (
                <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 flex items-center gap-3">
                  <span className="text-2xl">{selected.icon}</span>
                  <div><p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">Assigned Department</p><p className="text-sm font-semibold text-slate-900">{selected.dept}</p></div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description *</label>
                <textarea value={form.description} onChange={e => update("description", e.target.value)} className={`${inputClass} resize-y min-h-[100px]`} placeholder="Describe the issue in detail..." required />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location *</label>
                <div className="flex gap-3">
                  <input type="text" value={form.location} onChange={e => update("location", e.target.value)} className={`${inputClass} flex-1`} placeholder="Enter location or use GPS" required />
                  <Button type="button" onClick={getLocation} disabled={gettingLocation} className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 gap-2">{gettingLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}{gettingLocation ? "Getting..." : "Use GPS"}</Button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Photo (optional)</label>
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-all">
                  <Camera className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                  <p className="text-sm text-slate-500">Click to upload photo</p>
                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                </div>
                {photo && <div className="mt-3 text-center"><img src={photo} alt="Preview" className="max-w-[200px] rounded-xl shadow-md mx-auto" /></div>}
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-sm text-slate-500"><span className="font-semibold text-slate-700">Reporting as:</span> {user?.name} — {user?.email}</p>
              </div>

              <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3">{submitting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Submitting...</> : <><Send className="w-4 h-4 mr-2" />Submit Complaint</>}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}