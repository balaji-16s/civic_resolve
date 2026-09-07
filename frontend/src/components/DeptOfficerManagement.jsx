import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Users, ShieldCheck, LogOut, RefreshCw, Loader2, X,
  Edit2, Trash2, UserPlus, UserCheck, Phone, ArrowLeft,
  Briefcase, CheckCircle2, ListChecks, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import {
  getDeptOfficers,
  getDeptComplaints,
  addOfficer,
  updateOfficer,
  removeOfficer,
} from "@/lib/api";

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

const statusChip = {
  pending: "bg-amber-100 text-amber-700",
  "in-progress": "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
};

export default function DeptOfficerManagement() {
  const navigate = useNavigate();
  const { deptUser, logout } = useAuth();
  const [officers, setOfficers] = useState([]);
  const [head, setHead] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);

  const deptName = deptUser?.deptName || "Department";

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [officersData, complaintsData] = await Promise.all([
        getDeptOfficers(),
        getDeptComplaints(),
      ]);
      setHead(officersData.head);
      setOfficers(officersData.officers || []);
      setComplaints(complaintsData || []);
    } catch (err) {
      setError(err.message || "Failed to load officers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddOfficer = async (name, username, phone) => {
    try {
      await addOfficer(name, username, phone);
      await loadData();
    } catch (err) {
      alert("Failed to add officer: " + err.message);
      throw err;
    }
  };

  const handleUpdateOfficer = async (username, name, phone) => {
    try {
      await updateOfficer(username, name, phone);
      await loadData();
    } catch (err) {
      alert("Failed to update officer: " + err.message);
      throw err;
    }
  };

  const handleRemoveOfficer = async (username) => {
    if (!window.confirm("Remove this officer? Their active complaints will be reassigned automatically.")) return;
    try {
      await removeOfficer(username);
      await loadData();
    } catch (err) {
      alert("Failed to remove officer: " + err.message);
    }
  };

  // active (non-resolved) complaints grouped by the officer name they're assigned to
  const workByOfficer = {};
  complaints
    .filter((c) => c.status !== "resolved")
    .forEach((c) => {
      const key = c.assignedOfficer;
      if (!key) return;
      (workByOfficer[key] = workByOfficer[key] || []).push(c);
    });

  const totalActive = officers.reduce((s, o) => s + (o.activeComplaints || 0), 0);
  const totalResolved = officers.reduce((s, o) => s + (o.resolvedCount || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-600 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Building2 className="w-8 h-8 opacity-80" />
                <h1 className="text-2xl font-bold">{deptName}</h1>
              </div>
              <p className="text-white/80 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Officer Records & Workload — Manage your team, track who is doing what
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/dept-dashboard")}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-sm font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Complaints
              </button>
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

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Officers", value: officers.length, color: "border-l-indigo-500" },
            { label: "Active Work Items", value: totalActive, color: "border-l-amber-500" },
            { label: "Resolved Items", value: totalResolved, color: "border-l-emerald-500" },
            { label: "Team Workload", value: totalActive + totalResolved, color: "border-l-blue-500" },
          ].map((s) => (
            <div key={s.label} className={`bg-white rounded-2xl p-5 shadow-sm border-l-4 ${s.color}`}>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-sm text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Head info */}
        <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Department Head</h2>
            <p className="text-sm text-gray-500">
              {head?.name} ({head?.username}){head?.phone ? ` · ${head.phone}` : ""}
            </p>
          </div>
        </div>

        {/* Officers list */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              Officers & Their Current Work ({officers.length})
            </h3>
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                  <UserPlus className="w-4 h-4" />
                  Add Officer
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Officer</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    try {
                      await handleAddOfficer(
                        formData.get("name"),
                        formData.get("username"),
                        formData.get("phone")
                      );
                      setAddOpen(false);
                    } catch (err) {
                      // error already alerted by handleAddOfficer
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" name="name" type="text" placeholder="Officer Name" required className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" name="username" type="text" placeholder="username" required className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" name="phone" type="tel" placeholder="10-digit phone number" required className="w-full" />
                  </div>
                  <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
                    Add Officer
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="divide-y divide-gray-100">
            {officers.length === 0 && (
              <div className="px-6 py-12 text-center text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No officers in this department yet. Add one to get started.</p>
              </div>
            )}
            {officers.map((officer) => {
              const activeWork = workByOfficer[officer.name] || [];
              const resolvedCount = officer.resolvedCount || 0;
              const activeCount = officer.activeComplaints || 0;
              const overdueCount = activeWork.filter((c) => {
                const days = Math.floor((Date.now() - new Date(c.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
                return days >= 5 && c.status === "pending";
              }).length;
              return (
                <div key={officer.username} className="px-6 py-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                        <UserCheck className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{officer.name}</p>
                        <p className="text-sm text-gray-500 flex items-center gap-3">
                          <span>{officer.username}</span>
                          {officer.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {officer.phone}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-5 flex-wrap">
                      <div className="text-center">
                        <div className="text-xl font-bold text-amber-600">{activeCount}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wide">Active</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-emerald-600">{resolvedCount}</div>
                        <div className="text-[11px] text-gray-400 uppercase tracking-wide">Resolved</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => setEditingOfficer(officer)}
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => handleRemoveOfficer(officer.username)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Current work assigned to this officer */}
                  <div className="mt-4 pl-14">
                    {activeWork.length === 0 ? (
                      <p className="text-xs text-gray-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        No pending work assigned right now.
                      </p>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5" />
                          Currently working on ({activeWork.length}):
                        </p>
                        {activeWork.map((c) => {
                          const days = Math.floor((Date.now() - new Date(c.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
                          const delayed = days >= 5 && c.status === "pending";
                          return (
                            <div key={c.id} className={`flex items-center gap-2 text-sm rounded-lg px-3 py-1.5 border ${delayed ? "border-red-200 bg-red-50/40" : "border-gray-100 bg-gray-50"}`}>
                              <ListChecks className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                              <span className="font-mono text-[11px] text-gray-400">{c.id.slice(0, 8)}</span>
                              <span className="text-gray-700">{issueLabels[c.issueType] || c.issueType}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${statusChip[c.status] || "bg-gray-100 text-gray-600"}`}>
                                {c.status.replace("-", " ")}
                              </span>
                              {delayed && (
                                <span className="text-[10px] text-red-600 flex items-center gap-0.5">
                                  <AlertTriangle className="w-3 h-3" /> {days}d old
                                </span>
                              )}
                              <span className="ml-auto hidden md:block text-[11px] text-gray-400">{c.location}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Edit Officer modal */}
      {editingOfficer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setEditingOfficer(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Officer</h3>
              <button onClick={() => setEditingOfficer(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await handleUpdateOfficer(
                    editingOfficer.username,
                    formData.get("name"),
                    formData.get("phone")
                  );
                  setEditingOfficer(null);
                } catch (err) {
                  // error already alerted
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="edit-name">Name</Label>
                <Input id="edit-name" name="name" type="text" defaultValue={editingOfficer.name} required className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input type="text" value={editingOfficer.username} disabled className="w-full bg-gray-50 text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone</Label>
                <Input id="edit-phone" name="phone" type="tel" defaultValue={editingOfficer.phone} required className="w-full" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingOfficer(null)}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
