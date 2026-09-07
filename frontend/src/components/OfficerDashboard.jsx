import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, Phone, Calendar, User, Play, Check, Clock, AlertTriangle,
  RefreshCw, Search, X, LogOut, Loader2, ChevronRight, Eye
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getMyDeptComplaints, updateDeptComplaintStatus } from "@/lib/api";

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

const statusColors = {
  pending: "bg-amber-100 text-amber-700",
  "in-progress": "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
};
const statusBadgeBg = {
  pending: "bg-amber-50 border-amber-200 text-amber-700",
  "in-progress": "bg-blue-50 border-blue-200 text-blue-700",
  resolved: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const { deptUser, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedComplaint, setExpandedComplaint] = useState(null);
  const [filters, setFilters] = useState({ status: "", severity: "" });

  const role = deptUser?.role;
  const deptSlug = deptUser?.deptSlug || "general";
  const officerName = deptUser?.name;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMyDeptComplaints();
      setComplaints(data);
    } catch (err) {
      setError(err.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDeptComplaintStatus(id, newStatus);
      await loadData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    inProgress: complaints.filter((c) => c.status === "in-progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  const activeComplaints = complaints.filter((c) => c.status !== "resolved");

  const filteredComplaints = complaints.filter((c) => {
    if (filters.status && c.status !== filters.status) return false;
    if (filters.severity && c.severity !== filters.severity) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <User className="w-8 h-8 opacity-80" />
                <h1 className="text-2xl font-bold">Officer Dashboard</h1>
              </div>
              <p className="text-white/80 text-sm flex items-center gap-2">
                <Badge>{role === "head" ? "Department Head" : "Officer"}</Badge>
                {deptUser?.deptName} — {officerName}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={loadData}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-sm font-medium transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/dept-login", { replace: true });
                }}
                className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl px-4 py-2 text-sm font-medium transition-all"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Assigned", value: stats.total, color: "border-l-indigo-500" },
            { label: "Pending", value: stats.pending, color: "border-l-amber-500" },
            { label: "In Progress", value: stats.inProgress, color: "border-l-blue-500" },
            { label: "Resolved", value: stats.resolved, color: "border-l-emerald-500" },
          ].map((s) => (
            <div
              key={s.label}
              className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${s.color}`}
            >
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        )}

        {/* Map — active complaints with valid coordinates */}
        {!loading &&
          activeComplaints.filter((c) => c.location && c.location.includes(",")).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-red-500" />
                Active Complaint Locations
              </h3>
              <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200">
                <MapContainer center={[15.9129, 79.7400]} zoom={7} className="h-full w-full">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                  />
                  {activeComplaints
                    .filter((c) => c.location && c.location.includes(","))
                    .map((c) => {
                      const [lat, lng] = c.location.split(",").map(Number);
                      if (isNaN(lat) || isNaN(lng)) return null;
                      return { ...c, lat, lng };
                    })
                    .filter(Boolean)
                    .map((complaint) => (
                      <Marker key={complaint.id} position={[complaint.lat, complaint.lng]}>
                        <Popup>
                          <div className="text-sm">
                            <strong className="text-gray-900">
                              {issueLabels[complaint.issueType] || complaint.issueType}
                            </strong>
                            <p className="text-gray-500 mt-1 text-xs">
                              {complaint.description?.substring(0, 80)}...
                            </p>
                            <span
                              className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                statusColors[complaint.status] || "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {complaint.status.replace("-", " ")}
                            </span>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                </MapContainer>
              </div>
            </div>
          )}

        {/* Filters */}
        {!loading && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Severity</label>
                <select
                  value={filters.severity}
                  onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 outline-none transition-all"
                >
                  <option value="">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => setFilters({ status: "", severity: "" })}>
                <X className="w-4 h-4" /> Clear
              </Button>
            </div>
          </div>
        )}

        {/* Complaints list */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Your Complaints</h3>
              <span className="text-sm text-gray-500">
                {filteredComplaints.length} of {complaints.length}
              </span>
            </div>
            <div className="p-6 space-y-4">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No complaints match the current filters.</p>
                </div>
              ) : (
                filteredComplaints.map((complaint) => {
                  const daysPending = Math.floor(
                    (new Date() - new Date(complaint.submittedAt)) / (1000 * 60 * 60 * 24)
                  );
                  const isDelayed = daysPending >= 5 && complaint.status === "pending";
                  return (
                    <div
                      key={complaint.id}
                      className={`border rounded-xl p-5 hover:shadow-md transition-shadow ${
                        isDelayed ? "border-red-300 bg-red-50/30" : "border-gray-200"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                        <div>
                          <span className="text-xs text-gray-400 font-mono">
                            ID: {complaint.id.slice(0, 8)}
                          </span>
                          {isDelayed && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {daysPending} days
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                              complaint.severity === "high"
                                ? "bg-red-100 text-red-700"
                                : complaint.severity === "medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {complaint.severity}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${
                              statusColors[complaint.status] || "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {complaint.status.replace("-", " ")}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-1">
                        {issueLabels[complaint.issueType] || complaint.issueType}
                      </h4>
                      <p className="text-sm text-gray-500 mb-3">{complaint.description}</p>

                      {complaint.photo && (
                        <div className="mb-3">
                          <img
                            src={complaint.photo}
                            alt="Complaint photo"
                            className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setExpandedComplaint(complaint)}
                          />
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {complaint.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {complaint.userName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" /> {complaint.userPhone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />{" "}
                          {new Date(complaint.submittedAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {daysPending}d ago
                        </span>
                      </div>

                      <div className="mt-4 flex gap-2 flex-wrap">
                        {complaint.status === "pending" && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-blue-500 hover:bg-blue-600"
                            onClick={() => handleUpdateStatus(complaint.id, "in-progress")}
                          >
                            <Play className="w-3.5 h-3.5" /> Start Work
                          </Button>
                        )}
                        {complaint.status === "in-progress" && (
                          <Button
                            size="sm"
                            className="gap-1.5 bg-emerald-500 hover:bg-emerald-600"
                            onClick={() => handleUpdateStatus(complaint.id, "resolved")}
                          >
                            <Check className="w-3.5 h-3.5" /> Mark Resolved
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() => setExpandedComplaint(complaint)}
                        >
                          <Eye className="w-3.5 h-3.5" /> View Details
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expanded complaint modal */}
      {expandedComplaint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setExpandedComplaint(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Complaint Details</h3>
              <button
                onClick={() => setExpandedComplaint(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["ID", expandedComplaint.id],
                ["Type", issueLabels[expandedComplaint.issueType] || expandedComplaint.issueType],
                ["Severity", expandedComplaint.severity?.toUpperCase()],
                ["Status", expandedComplaint.status.replace("-", " ").toUpperCase()],
                ["Description", expandedComplaint.description],
                ["Location", expandedComplaint.location],
                ["Citizen", `${expandedComplaint.userName} (${expandedComplaint.userPhone})`],
                ["Submitted", new Date(expandedComplaint.submittedAt).toLocaleString()],
                ["Officer", `${deptUser?.name || "You"} (${deptUser?.phone || "—"})`],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="font-semibold text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-gray-900">{value}</span>
                </div>
              ))}
              {expandedComplaint.photo && (
                <div className="mt-2">
                  <span className="font-semibold text-gray-500 text-sm block mb-2">Photo</span>
                  <img
                    src={expandedComplaint.photo}
                    alt="Complaint photo"
                    className="max-w-full max-h-[300px] rounded-xl object-cover border border-gray-200"
                  />
                </div>
              )}
            </div>
            <Button className="w-full mt-6" variant="outline" onClick={() => setExpandedComplaint(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
      {children}
    </span>
  );
}

export {};
