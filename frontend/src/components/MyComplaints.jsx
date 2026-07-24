import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  FileText, MapPin, Calendar, Building, Clock, CheckCircle2,
  AlertCircle, Loader2, LogOut, RefreshCw, Phone, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMyComplaints } from "@/lib/api";

const issueLabels = {
  garbage: "Garbage Collection",
  pothole: "Pothole / Road Damage",
  streetlight: "Street Light Issue",
  drainage: "Drainage Problem",
  water: "Water Supply Issue",
  traffic: "Traffic Signal Problem",
  park: "Park Maintenance",
  other: "Other",
};

const statusConfig = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700", icon: Clock },
  "in-progress": { label: "In Progress", color: "bg-blue-100 text-blue-700", icon: Loader2 },
  resolved: { label: "Resolved", color: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
};

export default function MyComplaints() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyComplaints();
      setComplaints(data);
    } catch (err) {
      setError(err.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    inProgress: complaints.filter((c) => c.status === "in-progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="w-7 h-7" />
                My Complaints
              </h1>
              <p className="text-indigo-200 text-sm mt-1">
                Welcome, {user?.name} ({user?.email})
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 gap-2"
                onClick={fetchComplaints}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
              <Button
                variant="ghost"
                className="text-white hover:bg-white/20 gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Filed", value: stats.total, color: "border-l-indigo-500" },
            { label: "Pending", value: stats.pending, color: "border-l-amber-500" },
            { label: "Resolved", value: stats.resolved, color: "border-l-emerald-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl p-4 shadow-sm border-l-4 ${s.color}`}>
              <div className="text-2xl font-bold text-gray-900">{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        )}

        {/* Complaints List */}
        {!loading && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Submitted Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-gray-500">No complaints found</p>
                  <p className="text-sm mt-1">
                    Report an issue to start tracking it here.
                  </p>
                  <Button
                    className="mt-4 bg-indigo-500 hover:bg-indigo-600"
                    onClick={() => navigate("/report")}
                  >
                    Report an Issue
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => {
                    const StatusIcon = statusConfig[complaint.status]?.icon || Clock;
                    return (
                      <div key={complaint.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xs text-gray-400 font-mono">ID: {complaint.id.slice(0, 8)}</span>
                            <h3 className="font-semibold text-gray-900 mt-1">
                              {issueLabels[complaint.issueType] || complaint.issueType}
                            </h3>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${statusConfig[complaint.status]?.color || "bg-gray-100"}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[complaint.status]?.label || complaint.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-3">{complaint.description}</p>
                        {complaint.photo && (
                          <div className="mb-3">
                            <img
                              src={complaint.photo}
                              alt="Complaint photo"
                              className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-gray-200"
                            />
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" /> {complaint.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" /> {complaint.assignedDepartment}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(complaint.submittedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Severity: {complaint.severity?.toUpperCase() || "Auto"}
                          </span>
                        </div>

                        {/* Assigned Officer Details */}
                        {complaint.assignedOfficer && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <div className="inline-flex items-center gap-3 bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-xs">
                              <User className="w-3.5 h-3.5" />
                              <span className="font-medium">{complaint.assignedOfficer}</span>
                              {complaint.officerPhone && (
                                <span className="flex items-center gap-1 text-blue-500">
                                  <Phone className="w-3 h-3" />
                                  {complaint.officerPhone}
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
