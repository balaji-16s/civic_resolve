import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  FileText, MapPin, Calendar, Building, Clock, CheckCircle2,
  AlertCircle, Loader2, LogOut, RefreshCw, Phone, User, ArrowRight, Camera
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
  pending: { label: "Pending", bg: "bg-amber-50 text-amber-700", icon: Clock },
  "in-progress": { label: "In Progress", bg: "bg-blue-50 text-blue-700", icon: Loader2 },
  resolved: { label: "Resolved", bg: "bg-emerald-50 text-emerald-700", icon: CheckCircle2 },
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

  useEffect(() => { fetchComplaints(); }, []);

  const handleLogout = () => { logout(); navigate("/"); };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">My Complaints</h1>
              <p className="text-xs text-slate-500">{user?.name} ({user?.email})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={fetchComplaints} disabled={loading} className="gap-2">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 text-red-600 hover:bg-red-50">
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Filed", value: stats.total, bg: "bg-emerald-50 border-emerald-500" },
            { label: "Pending", value: stats.pending, bg: "bg-amber-50 border-amber-500" },
            { label: "Resolved", value: stats.resolved, bg: "bg-sky-50 border-sky-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-xl p-5 shadow-sm border-t-4 ${s.bg}`}>
              <div className="text-3xl font-bold text-slate-900">{s.value}</div>
              <div className="text-sm text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="flex gap-3">
          <Link to="/report-form" className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl shadow-sm transition-all">
            <Camera className="w-4 h-4" />
            Report New Issue
            <ArrowRight className="w-4 h-4" />
          </Link>
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
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        )}

        {/* Complaints List */}
        {!loading && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Your Complaints</CardTitle>
            </CardHeader>
            <CardContent>
              {complaints.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="font-medium text-slate-700">No complaints yet</p>
                  <p className="text-sm text-slate-500 mb-4">Report an issue to start tracking it here</p>
                  <Button onClick={() => navigate("/report")} className="bg-emerald-600 hover:bg-emerald-700">
                    <Camera className="w-4 h-4 mr-2" /> Report an Issue
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {complaints.map((complaint) => {
                    const StatusIcon = statusConfig[complaint.status]?.icon || Clock;
                    return (
                      <div key={complaint.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <span className="text-xs text-slate-400 font-mono">#{complaint.id.slice(0, 8)}</span>
                            <h3 className="font-semibold text-slate-900 mt-1">{issueLabels[complaint.issueType] || complaint.issueType}</h3>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1 ${statusConfig[complaint.status]?.bg || "bg-slate-100"}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[complaint.status]?.label || complaint.status}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-3 line-clamp-2">{complaint.description}</p>
                        {complaint.photo && (
                          <div className="mb-3">
                            <img src={complaint.photo} alt="Complaint photo" className="max-w-[200px] rounded-lg object-cover border border-slate-200" />
                          </div>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <span className="text-slate-400 flex items-center gap-1"><MapPin className="w-3 h-3" /> {complaint.location}</span>
                          <span className="text-slate-400 flex items-center gap-1"><Building className="w-3 h-3" /> {complaint.assignedDepartment}</span>
                          <span className="text-slate-400 flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(complaint.submittedAt).toLocaleDateString()}</span>
                          <span className={`flex items-center gap-1 font-medium ${(complaint.severity === "high" && "text-red-600") || (complaint.severity === "medium" && "text-amber-600") || "text-slate-400"}`}>
                            <AlertCircle className="w-3 h-3" /> Severity: {complaint.severity?.toUpperCase() || "AUTO"}
                          </span>
                        </div>
                        {complaint.assignedOfficer && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-sm">
                            <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-sky-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-700">{complaint.assignedOfficer}</p>
                              {complaint.officerPhone && (
                                <p className="text-xs text-slate-400 flex items-center gap-1">
                                  <Phone className="w-3 h-3" /> {complaint.officerPhone}
                                </p>
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
