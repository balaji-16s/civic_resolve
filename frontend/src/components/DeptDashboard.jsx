import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  BarChart3, ArrowLeft, MapPin, User, Phone, Calendar, Building, Play, Check, Eye,
  RefreshCw, Search, X, LogOut, Loader2, ShieldCheck, Clock, AlertTriangle, CheckCircle2,
  Lightbulb, Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getDeptComplaints, updateDeptComplaintStatus, getDeptOfficers, assignOfficer, suggestOfficers } from "@/lib/api";

// Fix Leaflet default icon issue
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

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
  resolved: "bg-emerald-100 text-emerald-700"
};

const severityColors = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-emerald-100 text-emerald-700"
};

const deptBranding = {
  municipal: { gradient: "from-emerald-600 to-teal-700", light: "from-emerald-50 to-teal-50", accent: "emerald", icon: "🏛️" },
  electrical: { gradient: "from-amber-600 to-orange-700", light: "from-amber-50 to-orange-50", accent: "amber", icon: "⚡" },
  pwd: { gradient: "from-blue-600 to-indigo-700", light: "from-blue-50 to-indigo-50", accent: "blue", icon: "🛣️" },
  water: { gradient: "from-cyan-600 to-blue-700", light: "from-cyan-50 to-blue-50", accent: "cyan", icon: "💧" },
  general: { gradient: "from-purple-600 to-violet-700", light: "from-purple-50 to-violet-50", accent: "purple", icon: "📋" },
};

// Component to auto-fit map bounds to markers
function MapBounds({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = markers.map(([lat, lng]) => [lat, lng]);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [markers, map]);
  return null;
}

export default function DeptDashboard() {
  const navigate = useNavigate();
  const { deptUser, logout } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [filters, setFilters] = useState({ status: "", severity: "" });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [officers, setOfficers] = useState([]);
  const [suggestions, setSuggestions] = useState({});  // complaintId -> ranked suggestions
  const [loadingSuggestions, setLoadingSuggestions] = useState({});

  const deptSlug = deptUser?.deptSlug || "general";
  const role = deptUser?.role || "officer";
  const branding = deptBranding[deptSlug] || deptBranding.general;

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [complaintsData, officersData] = await Promise.all([
        getDeptComplaints(),
        getDeptOfficers(),
      ]);
      setComplaints(complaintsData);
      setFilteredComplaints(complaintsData);
      setOfficers(officersData.officers || []);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    let result = [...complaints];
    if (filters.status) result = result.filter((c) => c.status === filters.status);
    if (filters.severity) result = result.filter((c) => c.severity === filters.severity);
    setFilteredComplaints(result);
  }, [filters, complaints]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateDeptComplaintStatus(id, newStatus);
      await loadData();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleAssignOfficer = async (complaintId, officerUsername) => {
    try {
      await assignOfficer(complaintId, officerUsername);
      setSuggestions((prev) => { const next = { ...prev }; delete next[complaintId]; return next; });
      await loadData();
    } catch (err) {
      alert("Failed to assign officer: " + err.message);
    }
  };

  const loadSuggestions = async (complaintId) => {
    if (suggestions[complaintId] || loadingSuggestions[complaintId]) return;
    setLoadingSuggestions((prev) => ({ ...prev, [complaintId]: true }));
    try {
      const data = await suggestOfficers(complaintId);
      setSuggestions((prev) => ({ ...prev, [complaintId]: data.suggestions || [] }));
    } catch (err) {
      console.error("Failed to load suggestions:", err);
    } finally {
      setLoadingSuggestions((prev) => ({ ...prev, [complaintId]: false }));
    }
  };

  const stats = {
    total: complaints.length,
    pending: complaints.filter((c) => c.status === "pending").length,
    inProgress: complaints.filter((c) => c.status === "in-progress").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  const activeComplaints = complaints.filter(c => c.status !== "resolved");

  const categoryData = {};
  complaints.forEach((c) => {
    const label = issueLabels[c.issueType] || c.issueType;
    categoryData[label] = (categoryData[label] || 0) + 1;
  });

  const doughnutData = {
    labels: Object.keys(categoryData),
    datasets: [{ data: Object.values(categoryData), backgroundColor: ["#10b981", "#f59e0b", "#3b82f6", "#8b5cf6", "#ef4444"] }],
  };

  const barData = {
    labels: ["Pending", "In Progress", "Resolved"],
    datasets: [{ label: "Complaints", data: [stats.pending, stats.inProgress, stats.resolved], backgroundColor: ["#f59e0b", "#3b82f6", "#10b981"] }],
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`bg-gradient-to-r ${branding.gradient} text-white`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl">{branding.icon}</span>
                <h1 className="text-2xl font-bold">{deptUser?.deptName || "Department Dashboard"}</h1>
              </div>
              <p className="text-white/80 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                {role === "head" ? "Department Head" : "Department Officer"} — {deptUser?.name}
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={loadData} disabled={loading} className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-sm font-medium transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button onClick={() => { logout(); navigate("/dept-login", { replace: true }); }} className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl px-4 py-2 text-sm font-medium transition-all">
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-200">{error}</div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Complaints", value: stats.total, color: "border-l-gray-500" },
            { label: "Pending", value: stats.pending, color: "border-l-amber-500" },
            { label: "In Progress", value: stats.inProgress, color: "border-l-blue-500" },
            { label: "Resolved", value: stats.resolved, color: "border-l-emerald-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${s.color}`}>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        )}

        {/* Map Section */}
        {!loading && activeComplaints.filter(c => c.location && c.location.includes(",")).length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-red-500" />
              Active Complaint Locations
            </h3>
            <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200">
              <MapContainer center={[15.9129, 79.7400]} zoom={7} className="h-full w-full">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                {(() => {
                  const markers = activeComplaints
                    .filter(c => c.location && c.location.includes(","))
                    .map(c => {
                      const [lat, lng] = c.location.split(",").map(Number);
                      if (isNaN(lat) || isNaN(lng)) return null;
                      return { ...c, lat, lng };
                    })
                    .filter(Boolean);
                  const markerPositions = markers.map(m => [m.lat, m.lng]);
                  return (
                    <>
                      <MapBounds markers={markerPositions} />
                      {markers.map((complaint) => (
                        <Marker key={complaint.id} position={[complaint.lat, complaint.lng]}>
                          <Popup>
                            <div className="text-sm">
                              <strong className="text-gray-900">{issueLabels[complaint.issueType] || complaint.issueType}</strong>
                              <p className="text-gray-500 mt-1 text-xs">{complaint.description?.substring(0, 80)}...</p>
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${statusColors[complaint.status]}`}>
                                {complaint.status.replace("-", " ")}
                              </span>
                            </div>
                          </Popup>
                        </Marker>
                      ))}
                    </>
                  );
                })()}
              </MapContainer>
            </div>
          </div>
        )}

        {/* Charts */}
        {!loading && (
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Complaints by Type</h3>
              <div className="max-h-[250px] flex justify-center">
                {Object.keys(categoryData).length > 0 ? (
                  <Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: "bottom" } } }} />
                ) : (
                  <p className="text-gray-400 py-10">No data available</p>
                )}
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Status Distribution</h3>
              <div className="max-h-[250px]">
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        {!loading && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="grid sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Filter by Status</label>
                <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 outline-none transition-all">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Filter by Severity</label>
                <select value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-indigo-500 outline-none transition-all">
                  <option value="">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <Button variant="outline" className="gap-2" onClick={() => setFilters({ status: "", severity: "" })}>
                <X className="w-4 h-4" /> Clear Filters
              </Button>
            </div>
          </div>
        )}

        {/* Complaints List */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">Department Complaints</h3>
              <span className="text-sm text-gray-500">{filteredComplaints.length} of {complaints.length}</span>
            </div>
            <div className="p-6 space-y-4">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No complaints match the current filters.</p>
                </div>
              ) : (
                filteredComplaints.map((complaint) => {
                  const daysPending = Math.floor((new Date() - new Date(complaint.submittedAt)) / (1000 * 60 * 60 * 24));
                  const isDelayed = daysPending >= 5 && complaint.status === "pending";

                  return (
                    <div key={complaint.id} className={`border rounded-xl p-5 hover:shadow-md transition-shadow ${isDelayed ? "border-red-300 bg-red-50/30" : "border-gray-200"}`}>
                      <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                        <div>
                          <span className="text-xs text-gray-400 font-mono">ID: {complaint.id.slice(0, 8)}</span>
                          {isDelayed && (
                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {daysPending} days
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${severityColors[complaint.severity] || "bg-gray-100 text-gray-700"}`}>
                            {complaint.severity}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase ${statusColors[complaint.status] || "bg-gray-100 text-gray-700"}`}>
                            {complaint.status.replace("-", " ")}
                          </span>
                        </div>
                      </div>

                      <h4 className="font-semibold text-gray-900 mb-1">{issueLabels[complaint.issueType] || complaint.issueType}</h4>
                      <p className="text-sm text-gray-500 mb-3">{complaint.description}</p>

                      {complaint.photo && (
                        <div className="mb-3">
                          <img src={complaint.photo} alt="Complaint photo" className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setSelectedComplaint(complaint)} />
                        </div>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {complaint.location}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {complaint.userName}</span>
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {complaint.userPhone}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(complaint.submittedAt).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {daysPending}d ago</span>
                      </div>

                      {complaint.assignedOfficer && (
                        <div className="mt-2 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5 inline-flex items-center gap-1.5">
                          <User className="w-3 h-3" /> Assigned to: {complaint.assignedOfficer} {complaint.officerPhone && `(${complaint.officerPhone})`}
                        </div>
                      )}

                      {/* Action buttons for officers */}
                      <div className="mt-4 flex gap-2 flex-wrap">
                        {complaint.status === "pending" && (
                          <Button size="sm" className="gap-1.5 bg-blue-500 hover:bg-blue-600" onClick={() => handleUpdateStatus(complaint.id, "in-progress")}>
                            <Play className="w-3.5 h-3.5" /> Start Work
                          </Button>
                        )}
                        {complaint.status === "in-progress" && (
                          <Button size="sm" className="gap-1.5 bg-emerald-500 hover:bg-emerald-600" onClick={() => handleUpdateStatus(complaint.id, "resolved")}>
                            <Check className="w-3.5 h-3.5" /> Mark Resolved
                          </Button>
                        )}
                        {/* Phase 2: AI Officer Suggestions (Head-only) */}
                        {role === "head" && complaint.status !== "resolved" && (
                          <div className="flex flex-wrap gap-2 items-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                              onClick={() => loadSuggestions(complaint.id)}
                              disabled={loadingSuggestions[complaint.id]}
                            >
                              <Lightbulb className="w-3.5 h-3.5" />
                              {loadingSuggestions[complaint.id] ? "Thinking..." : "AI Suggest"}
                            </Button>

                            {suggestions[complaint.id] && suggestions[complaint.id].length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {suggestions[complaint.id].map((off, idx) => (
                                  <button
                                    key={off.username}
                                    onClick={() => handleAssignOfficer(complaint.id, off.username)}
                                    className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                                      idx === 0
                                        ? "bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                                        : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                    }`}
                                  >
                                    {idx === 0 && <Star className="w-3 h-3 text-amber-400" />}
                                    {off.name}
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                                      off.activeComplaints === 0
                                        ? "bg-emerald-100 text-emerald-600"
                                        : "bg-amber-100 text-amber-600"
                                    }`}>
                                      {off.activeComplaints} active
                                    </span>
                                  </button>
                                ))}
                                <select
                                  onChange={(e) => {
                                    if (e.target.value) handleAssignOfficer(complaint.id, e.target.value);
                                    e.target.value = "";
                                  }}
                                  className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 outline-none"
                                  defaultValue=""
                                >
                                  <option value="" disabled>All officers...</option>
                                  {officers.map((off) => (
                                    <option key={off.username} value={off.username}>{off.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {!suggestions[complaint.id] && (
                              <select
                                onChange={(e) => {
                                  if (e.target.value) handleAssignOfficer(complaint.id, e.target.value);
                                  e.target.value = "";
                                }}
                                className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 bg-gray-50 outline-none"
                                defaultValue=""
                              >
                                <option value="" disabled>Assign officer...</option>
                                {officers.map((off) => (
                                  <option key={off.username} value={off.username}>{off.name}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        )}
                        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSelectedComplaint(complaint)}>
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

      {/* Details Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setSelectedComplaint(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Complaint Details</h3>
              <button onClick={() => setSelectedComplaint(null)} className="text-gray-400 hover:text-gray-600 p-1"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["ID", selectedComplaint.id],
                ["Type", issueLabels[selectedComplaint.issueType] || selectedComplaint.issueType],
                ["Severity", selectedComplaint.severity?.toUpperCase()],
                ["Status", selectedComplaint.status.replace("-", " ").toUpperCase()],
                ["Description", selectedComplaint.description],
                ["Location", selectedComplaint.location],
                ["Citizen", `${selectedComplaint.userName} (${selectedComplaint.userPhone})`],
                ["Assigned To", selectedComplaint.assignedOfficer || "Not assigned"],
                ["Officer Phone", selectedComplaint.officerPhone || "—"],
                ["Submitted", new Date(selectedComplaint.submittedAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="font-semibold text-gray-500 w-28 shrink-0">{label}</span>
                  <span className="text-gray-900">{value}</span>
                </div>
              ))}
              {selectedComplaint.photo && (
                <div className="mt-2">
                  <span className="font-semibold text-gray-500 text-sm block mb-2">Photo</span>
                  <img src={selectedComplaint.photo} alt="Complaint photo" className="max-w-full max-h-[300px] rounded-xl object-cover border border-gray-200" />
                </div>
              )}
            </div>
            <Button className="w-full mt-6" variant="outline" onClick={() => setSelectedComplaint(null)}>Close</Button>
          </div>
        </div>
      )}
    </div>
  );
}
