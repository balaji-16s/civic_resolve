import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Send, MapPin, Camera, ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { createComplaint } from "@/lib/api";

const issueTypes = [
  { value: "garbage", label: "Garbage Collection" },
  { value: "pothole", label: "Pothole / Road Damage" },
  { value: "streetlight", label: "Street Light Issue" },
  { value: "drainage", label: "Drainage Problem" },
  { value: "water", label: "Water Supply Issue" },
  { value: "traffic", label: "Traffic Signal Problem" },
  { value: "park", label: "Park Maintenance" },
  { value: "other", label: "Other" },
];

const deptInfo = {
  garbage: { dept: "Municipal Department", icon: "🗑️" },
  pothole: { dept: "Public Works Department (PWD)", icon: "🛣️" },
  streetlight: { dept: "Electrical Department", icon: "💡" },
  drainage: { dept: "Municipal Department", icon: "🌊" },
  water: { dept: "Water Department", icon: "🚰" },
  traffic: { dept: "General Administration", icon: "🚦" },
  park: { dept: "Municipal Department", icon: "🌳" },
  other: { dept: "General Administration", icon: "📋" },
};

export default function Report() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);

  const [formData, setFormData] = useState({
    issueType: "",
    description: "",
    location: "",
  });

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "issueType") setError("");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPhotoPreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPhotoPreview(null);
    }
  };

  const getLocation = () => {
    setIsGettingLocation(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          updateField("location", `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          setIsGettingLocation(false);
        },
        () => {
          alert("Unable to get your location. Please enter manually.");
          setIsGettingLocation(false);
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.issueType) {
      setError("Please select an issue type.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createComplaint({
        issueType: formData.issueType,
        description: formData.description,
        location: formData.location,
        photo: photoPreview,
      });

      setIsSuccess(true);
      setFormData({ issueType: "", description: "", location: "" });
      setPhotoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";

      setTimeout(() => setIsSuccess(false), 5000);
    } catch (err) {
      setError(err.message || "Failed to submit complaint. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-lg border-2 border-white/15 bg-white/10 text-white placeholder-white/40 focus:border-[#f5576c] focus:bg-white/15 focus:ring-2 focus:ring-[#f5576c]/20 transition-all outline-none";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#302b63] to-[#24243e] relative overflow-hidden py-8 px-4">
      {/* Decorative background */}
      <div className="absolute top-20 -left-20 w-96 h-96 bg-[#f093fb]/15 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-20 -right-20 w-96 h-96 bg-[#f5576c]/15 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-[#4facfe]/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "0.8s" }} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 pointer-events-none" />

      <div className="relative max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20 mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center text-white mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/80 text-xs border border-white/10">
            <span className="w-2 h-2 bg-[#f5576c] rounded-full animate-pulse" />
            Logged in as {user?.name}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Report an Issue</h1>
          <p className="text-white/60">Help us make your community better by reporting civic issues</p>
        </div>

        <Card className="border-0 shadow-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white">
          <CardContent className="p-6 sm:p-8">
            {isSuccess && (
              <div className="flex items-center gap-3 bg-emerald-500/90 text-white p-4 rounded-xl mb-6">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Your complaint has been submitted successfully!</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/15 text-red-300 text-sm p-3 rounded-lg mb-4 border border-red-500/30">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Type */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">
                  Issue Type *
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => updateField("issueType", e.target.value)}
                  className={inputClass}
                  required
                >
                  <option value="">Select issue type</option>
                  {issueTypes.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Assigned Department (auto-shown based on issue type) */}
              {formData.issueType && (
                <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{deptInfo[formData.issueType]?.icon || "📋"}</span>
                    <div>
                      <p className="text-xs text-[#f093fb] font-semibold uppercase tracking-wide">Assigned Department</p>
                      <p className="text-sm font-semibold text-white">{deptInfo[formData.issueType]?.dept || "General Administration"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className={`${inputClass} resize-y min-h-[100px]`}
                  placeholder="Describe the issue in detail..."
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">
                  Location *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className={`${inputClass} flex-1`}
                    placeholder="Enter location or get current location"
                    required
                  />
                  <Button
                    type="button"
                    onClick={getLocation}
                    disabled={isGettingLocation}
                    className="bg-white/15 hover:bg-white/25 text-white border border-white/20 shrink-0 gap-2"
                  >
                    {isGettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    {isGettingLocation ? "Getting..." : "Get Location"}
                  </Button>
                </div>
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">
                  Upload Photo
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center cursor-pointer hover:border-[#f5576c] hover:bg-[#f5576c]/5 transition-all"
                >
                  <Camera className="w-8 h-8 mx-auto mb-2 text-white/40" />
                  <p className="text-sm text-white/50">Click to upload photo or drag and drop</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>
                {photoPreview && (
                  <div className="mt-3 text-center">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="max-w-[200px] max-h-[200px] rounded-xl shadow-md mx-auto"
                    />
                  </div>
                )}
              </div>

              {/* User info */}
              <div className="bg-white/10 rounded-xl p-4 border border-white/10">
                <p className="text-sm text-white/70">
                  <span className="font-semibold text-white">Logged in as:</span> {user?.name} — {user?.email}
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#f5576c] to-[#ff6f91] hover:from-[#ff6f91] hover:to-[#f5576c] text-white py-6 rounded-xl text-base gap-2 shadow-lg shadow-[#f5576c]/25"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Complaint
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}