import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import {
  BarChart3, ArrowLeft, MapPin, User, Phone, Calendar, Building, Play, Check, Eye,
  RefreshCw, Search, X, LogOut, Loader2, TrendingUp, AlertTriangle, Clock, Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { getAllComplaints, updateComplaintStatus, getInsights } from "@/lib/api";

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

const statusColors = { pending: "bg-amber-100 text-amber-700", "in-progress": "bg-blue-100 text-blue-700", resolved: "bg-emerald-100 text-emerald-700" };
const severityColors = { high: "bg-red-100 text-red-700", medium: "bg-amber-100 text-amber-700", low: "bg-emerald-100 text-emerald-700" };

const categoryColors = ["#6366f1", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#14b8a6", "#f97316"];

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [allComplaints, setAllComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [filters, setFilters] = useState({ status: "", category: "", severity: "" });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadComplaints = async () => {
    setLoading(true);
    setError("");
    try {
      const [data, insightsData] = await Promise.all([
        getAllComplaints(),
        getInsights(),
      ]);
      setAllComplaints(data);
      setFilteredComplaints(data);
      setInsights(insightsData);
    } catch (err) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  useEffect(() => {
    let result = [...allComplaints];
    if (filters.status) result = result.filter((c) => c.status === filters.status);
    if (filters.category) result = result.filter((c) => c.issueType === filters.category);
    if (filters.severity) result = result.filter((c) => c.severity === filters.severity);
    setFilteredComplaints(result);
  }, [filters, allComplaints]);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      await updateComplaintStatus(id, newStatus);
      await loadComplaints();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const stats = {
    total: allComplaints.length,
    pending: allComplaints.filter((c) => c.status === "pending").length,
    inProgress: allComplaints.filter((c) => c.status === "in-progress").length,
    resolved: allComplaints.filter((c) => c.status === "resolved").length,
  };

  const activeComplaints = allComplaints.filter(c => c.status !== "resolved");

  const categoryData = {};
  allComplaints.forEach((c) => {
    const label = issueLabels[c.issueType] || c.issueType;
    categoryData[label] = (categoryData[label] || 0) + 1;
  });

  const doughnutData = {
    labels: Object.keys(categoryData),
    datasets: [{ data: Object.values(categoryData), backgroundColor: categoryColors.slice(0, Object.keys(categoryData).length) }],
  };

  const barData = {
    labels: ["Pending", "In Progress", "Resolved"],
    datasets: [{ label: "Complaints", data: [stats.pending, stats.inProgress, stats.resolved], backgroundColor: ["#f59e0b", "#3b82f6", "#10b981"] }],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0f0c29] via-[#1e1b3a] to-[#24243e] relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-32 -left-24 w-96 h-96 bg-[#f093fb]/10 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute bottom-40 -right-24 w-96 h-96 bg-[#f5576c]/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-[#4facfe]/10 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "0.8s" }} />
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-40 pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-[#0f0c29] via-[#302b63] to-[#24243e] text-white border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <BarChart3 className="w-7 h-7" />
            Government Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-sm font-medium transition-all">
              <ArrowLeft className="w-4 h-4" />
              Home
            </Link>
            <button onClick={() => navigate("/gov/departments")} className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-sm font-medium transition-all">
              <Building className="w-4 h-4" />
              Departments
            </button>
            <button onClick={() => { logout(); navigate("/gov-login", { replace: true }); }} className="inline-flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 rounded-xl px-4 py-2 text-sm font-medium transition-all">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
            <button onClick={loadComplaints} disabled={loading} className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-sm font-medium transition-all">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Phase 4: AI Insights Panel */}
        {!loading && insights && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-[#f093fb] to-[#f5576c] px-6 py-4 text-white">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <h3 className="font-semibold">AI-Powered Insights</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Summary row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#f093fb]/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#f5576c]">{insights.summary.totalComplaints}</div>
                  <div className="text-xs text-[#f5576c]/70">Total All Time</div>
                </div>
                <div className="bg-[#4facfe]/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#4facfe]">{insights.summary.currentWeek}</div>
                  <div className="text-xs text-[#4facfe]/70">This Week</div>
                </div>
                <div className="bg-[#ffd200]/10 rounded-xl p-3 text-center">
                  <div className="text-2xl font-bold text-[#e8c200]">{insights.summary.previousWeek}</div>
                  <div className="text-xs text-[#ffd200]/70">Last Week</div>
                </div>
                <div className={`rounded-xl p-3 text-center ${
                  insights.summary.weekChange > 0 ? "bg-red-50" : "bg-emerald-50"
                }`}>
                  <div className={`text-2xl font-bold ${
                    insights.summary.weekChange > 0 ? "text-red-600" : "text-emerald-600"
                  }`}>
                    {insights.summary.weekChange > 0 ? "+" : ""}{insights.summary.weekChange}%
                  </div>
                  <div className="text-xs text-gray-500">Week Change</div>
                </div>
              </div>

              {/* Severity distribution */}
              {insights.severityDistribution && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Shield className="w-4 h-4" /> Severity Distribution
                  </h4>
                  <div className="flex gap-2">
                    {Object.entries(insights.severityDistribution).map(([sev, count]) => (
                      <div key={sev} className={`flex-1 rounded-xl p-3 text-center text-sm ${
                        sev === "high" ? "bg-red-50 text-red-700" :
                        sev === "medium" ? "bg-amber-50 text-amber-700" :
                        "bg-emerald-50 text-emerald-700"
                      }`}>
                        <div className="font-bold text-lg">{count}</div>
                        <div className="text-xs uppercase tracking-wide">{sev}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Insight messages */}
              {insights.insights && insights.insights.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Actionable Insights
                  </h4>
                  {insights.insights.map((insight, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-xl text-sm ${
                      insight.severity === "critical" ? "bg-red-50 border border-red-200" :
                      insight.severity === "warning" ? "bg-amber-50 border border-amber-200" :
                      "bg-blue-50 border border-blue-100"
                    }`}>
                      <span className="text-lg">{insight.icon}</span>
                      <p className={`${
                        insight.severity === "critical" ? "text-red-700" :
                        insight.severity === "warning" ? "text-amber-700" :
                        "text-blue-700"
                      }`}>
                        {insight.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Top trends */}
              {insights.trends && insights.trends.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Weekly Trends by Category
                  </h4>
                  <div className="space-y-1.5">
                    {insights.trends.slice(0, 5).map((trend, idx) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-gray-50">
                        <span className="text-sm text-gray-600">{trend.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-400">
                            {trend.previousWeek} → {trend.currentWeek}
                          </span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            trend.direction === "up" ? "bg-red-100 text-red-600" :
                            trend.direction === "down" ? "bg-emerald-100 text-emerald-600" :
                            "bg-gray-100 text-gray-500"
                          }`}>
                            {trend.change > 0 ? "+" : ""}{trend.change}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Complaints", value: stats.total, color: "border-l-[#f5576c]" },
            { label: "Pending", value: stats.pending, color: "border-l-[#ffd200]" },
            { label: "In Progress", value: stats.inProgress, color: "border-l-[#4facfe]" },
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
            <Loader2 className="w-8 h-8 animate-spin text-[#f5576c]" />
          </div>
        )}

        {/* Map Section */}
        {!loading && activeComplaints.filter(c => c.location && c.location.includes(",")).length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#f5576c]" />
              Active Complaint Locations
            </h3>
            <div className="h-[400px] rounded-xl overflow-hidden border border-gray-200">
              <MapContainer
                center={[15.9129, 79.7400]}
                zoom={7}
                className="h-full w-full"
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
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
                              <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                                complaint.status === "pending" ? "bg-amber-100 text-amber-700" :
                                complaint.status === "in-progress" ? "bg-blue-100 text-blue-700" :
                                "bg-emerald-100 text-emerald-700"
                              }`}>
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
              <h3 className="font-semibold text-gray-900 mb-4">Complaints by Category</h3>
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
            <div className="grid sm:grid-cols-4 gap-4 items-end">
              <div>
                <label htmlFor="filter-status" className="block text-sm font-semibold text-gray-700 mb-1">Filter by Status</label>
                <select id="filter-status" name="filter-status" value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-[#f5576c] outline-none transition-all">
                  <option value="">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label htmlFor="filter-category" className="block text-sm font-semibold text-gray-700 mb-1">Filter by Category</label>
                <select id="filter-category" name="filter-category" value={filters.category} onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-[#f5576c] outline-none transition-all">
                  <option value="">All Categories</option>
                  {Object.entries(issueLabels).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filter-severity" className="block text-sm font-semibold text-gray-700 mb-1">Filter by Severity</label>
                <select id="filter-severity" name="filter-severity" value={filters.severity} onChange={(e) => setFilters((f) => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 bg-gray-50 focus:border-[#f5576c] outline-none transition-all">
                  <option value="">All Severities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 gap-2" onClick={() => setFilters({ status: "", category: "", severity: "" })}>
                  <X className="w-4 h-4" /> Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Complaints List */}
        {!loading && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-gray-900">All Complaints</h3>
              <span className="text-sm text-gray-500">
                {filteredComplaints.length} of {allComplaints.length} complaints
              </span>
            </div>
            <div className="p-6 space-y-4">
              {filteredComplaints.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No complaints match the current filters.</p>
                </div>
              ) : (
                filteredComplaints.map((complaint) => (
                  <div key={complaint.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-xs text-gray-400 font-mono">ID: {complaint.id.slice(0, 8)}</span>
                      <div className="flex gap-2">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {complaint.location}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" /> {complaint.userName}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {complaint.userPhone}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(complaint.submittedAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {complaint.assignedDepartment}</span>
                      <span className={`flex items-center gap-1 ${complaint.assignedOfficer ? "text-indigo-500 font-medium" : ""}`}>
                        <User className="w-3 h-3" />
                        {complaint.assignedOfficer ? `Officer: ${complaint.assignedOfficer}` : "Unassigned"}
                      </span>
                    </div>
                    {/* Photo display */}
                    {complaint.photo && (
                      <div className="mb-3">
                        <img
                          src={complaint.photo}
                          alt="Complaint photo"
                          className="max-w-[200px] max-h-[150px] rounded-lg object-cover border border-gray-200 cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setSelectedComplaint(complaint)}
                        />
                      </div>
                    )}
                    <div className="mt-4 flex gap-2 flex-wrap">
                      {/* Gov admin is view-only — status changes handled by department officers */}
                      <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setSelectedComplaint(complaint)}>
                        <Eye className="w-3.5 h-3.5" /> View Details
                      </Button>
                    </div>
                  </div>
                ))
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
              <button onClick={() => setSelectedComplaint(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              {[
                ["ID", selectedComplaint.id],
                ["Type", issueLabels[selectedComplaint.issueType] || selectedComplaint.issueType],
                ["Severity", selectedComplaint.severity?.toUpperCase() || "AUTO"],
                ["Status", selectedComplaint.status.replace("-", " ").toUpperCase()],
                ["Description", selectedComplaint.description],
                ["Location", selectedComplaint.location],
                ["User", `${selectedComplaint.userName} (${selectedComplaint.userPhone})`],
                ["Department", selectedComplaint.assignedDepartment],
                ["Submitted", new Date(selectedComplaint.submittedAt).toLocaleString()],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-3">
                  <span className="font-semibold text-gray-500 w-24 shrink-0">{label}</span>
                  <span className="text-gray-900">{value}</span>
                </div>
              ))}
              {/* Photo in detail modal */}
              {selectedComplaint.photo && (
                <div className="mt-2">
                  <span className="font-semibold text-gray-500 text-sm block mb-2">Photo</span>
                  <img
                    src={selectedComplaint.photo}
                    alt="Complaint photo"
                    className="max-w-full max-h-[300px] rounded-xl object-cover border border-gray-200"
                  />
                </div>
              )}
            </div>
            <Button className="w-full mt-6" variant="outline" onClick={() => setSelectedComplaint(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
