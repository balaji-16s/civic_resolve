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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-800 via-blue-900 to-teal-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          className="text-white hover:bg-white/20 mb-6"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center text-white mb-8">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 text-white/90 text-xs mb-4">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Logged in as {user?.name}
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">Report an Issue</h1>
          <p className="text-white/80">Help us make your community better by reporting civic issues</p>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardContent className="p-6 sm:p-8">
            {isSuccess && (
              <div className="flex items-center gap-3 bg-emerald-500 text-white p-4 rounded-xl mb-6">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>Your complaint has been submitted successfully!</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg mb-4 border border-red-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Issue Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Issue Type *
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => updateField("issueType", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
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
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{deptInfo[formData.issueType]?.icon || "📋"}</span>
                    <div>
                      <p className="text-xs text-blue-500 font-semibold uppercase tracking-wide">Assigned Department</p>
                      <p className="text-sm font-semibold text-gray-900">{deptInfo[formData.issueType]?.dept || "General Administration"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Description *
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none resize-y min-h-[100px]"
                  placeholder="Describe the issue in detail..."
                  required
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Location *
                </label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => updateField("location", e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    placeholder="Enter location or get current location"
                    required
                  />
                  <Button
                    type="button"
                    onClick={getLocation}
                    disabled={isGettingLocation}
                    className="bg-teal-500 hover:bg-teal-600 text-white shrink-0 gap-2"
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
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                  Upload Photo
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                >
                  <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500">Click to upload photo or drag and drop</p>
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
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-700">
                  <span className="font-semibold">Logged in as:</span> {user?.name} — {user?.email}
                </p>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white py-6 rounded-xl text-base gap-2"
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
