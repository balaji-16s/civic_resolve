import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Building2, Users, ShieldCheck, LogOut, RefreshCw, Loader2, X,
  Edit2, Trash2, UserPlus, UserCheck, Phone, ArrowLeft,
  Briefcase, Crown, CheckCircle2
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import {
  govGetDepartmentsOverview,
  govGetDeptOfficers,
  govAddOfficer,
  govUpdateOfficer,
  govRemoveOfficer,
  govUpdateHead,
} from "@/lib/api";

const DEPARTMENTS = [
  { slug: "municipal", name: "Municipal Department", icon: "🏛️" },
  { slug: "electrical", name: "Electrical Department", icon: "⚡" },
  { slug: "pwd", name: "Public Works Department (PWD)", icon: "🛣️" },
  { slug: "general", name: "General Administration", icon: "📋" },
  { slug: "water", name: "Water Department", icon: "💧" },
];

export default function GovDepartmentManagement() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeDept, setActiveDept] = useState(DEPARTMENTS[0]);
  const [officers, setOfficers] = useState([]);
  const [head, setHead] = useState(null);
  const [overview, setOverview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState(null);
  const [editingHead, setEditingHead] = useState(false);

  const loadOverview = async () => {
    setLoadingOverview(true);
    try {
      const data = await govGetDepartmentsOverview();
      setOverview(data.departments || []);
    } catch (err) {
      console.error("Failed to load overview:", err);
    } finally {
      setLoadingOverview(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const loadDept = async (dept) => {
    setLoading(true);
    setError("");
    try {
      const data = await govGetDeptOfficers(dept.slug);
      setHead(data.head);
      setOfficers(data.officers || []);
    } catch (err) {
      setError(err.message || "Failed to load department");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDept(activeDept);
  }, [activeDept]);

  const handleAddOfficer = async (name, username, phone) => {
    try {
      await govAddOfficer(activeDept.slug, name, username, phone);
      await Promise.all([loadDept(activeDept), loadOverview()]);
    } catch (err) {
      alert("Failed to add officer: " + err.message);
      throw err;
    }
  };

  const handleUpdateOfficer = async (username, name, phone) => {
    try {
      await govUpdateOfficer(activeDept.slug, username, name, phone);
      await Promise.all([loadDept(activeDept), loadOverview()]);
    } catch (err) {
      alert("Failed to update officer: " + err.message);
      throw err;
    }
  };

  const handleRemoveOfficer = async (username) => {
    if (!window.confirm("Remove this officer? Their active complaints will be reassigned automatically.")) return;
    try {
      await govRemoveOfficer(activeDept.slug, username);
      await Promise.all([loadDept(activeDept), loadOverview()]);
    } catch (err) {
      alert("Failed to remove officer: " + err.message);
    }
  };

  const handleUpdateHead = async (name, phone) => {
    try {
      await govUpdateHead(activeDept.slug, head?.username || "", name, phone);
      await Promise.all([loadDept(activeDept), loadOverview()]);
    } catch (err) {
      alert("Failed to update head: " + err.message);
      throw err;
    }
  };

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
                <h1 className="text-2xl font-bold">Government Department Management</h1>
              </div>
              <p className="text-white/80 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Manage department heads & officers across all departments
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate("/dashboard")}
                className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-sm font-medium transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </button>
              <button
                onClick={() => {
                  logout();
                  navigate("/gov-login", { replace: true });
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

        {/* ── Records of every department head & its officers ── */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Department Heads — Records & Performance
            </h3>
            <button onClick={loadOverview} className="text-gray-400 hover:text-gray-600 p-1" title="Refresh overview">
              <RefreshCw className={`w-4 h-4 ${loadingOverview ? "animate-spin" : ""}`} />
            </button>
          </div>
          {loadingOverview ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="px-6 py-3 font-semibold">Department</th>
                    <th className="px-6 py-3 font-semibold">Head</th>
                    <th className="px-6 py-3 font-semibold text-center">Officers</th>
                    <th className="px-6 py-3 font-semibold text-center">Pending</th>
                    <th className="px-6 py-3 font-semibold text-center">In Progress</th>
                    <th className="px-6 py-3 font-semibold text-center">Resolved</th>
                    <th className="px-6 py-3 font-semibold text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {overview.map((d) => (
                    <tr
                      key={d.deptSlug}
                      className={`hover:bg-indigo-50/40 transition-colors cursor-pointer ${
                        activeDept.slug === d.deptSlug ? "bg-indigo-50/70" : ""
                      }`}
                      onClick={() => {
                        const dept = DEPARTMENTS.find((x) => x.slug === d.deptSlug);
                        if (dept) setActiveDept(dept);
                      }}
                    >
                      <td className="px-6 py-3 font-medium text-gray-900">
                        {d.deptName}
                        <span className="ml-2 text-xs text-gray-400">{DEPARTMENTS.find((x) => x.slug === d.deptSlug)?.icon}</span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-gray-800">{d.head?.name || "—"}</div>
                        <div className="text-xs text-gray-400">
                          {d.head?.username}
                          {d.head?.phone ? ` · ${d.head.phone}` : ""}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center font-semibold text-gray-700">{d.officerCount}</td>
                      <td className="px-6 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-semibold">{d.complaints?.pending ?? 0}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">{d.complaints?.inProgress ?? 0}</span>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-semibold">{d.complaints?.resolved ?? 0}</span>
                      </td>
                      <td className="px-6 py-3 text-center font-semibold text-gray-700">{d.complaints?.total ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Department tabs */}
        <Tabs
          value={activeDept.slug}
          onValueChange={(slug) => {
            const dept = DEPARTMENTS.find((x) => x.slug === slug);
            if (dept) setActiveDept(dept);
          }}
        >
          <TabsList className="grid grid-cols-5">
            {DEPARTMENTS.map((dept) => (
              <TabsTrigger key={dept.slug} value={dept.slug} className="gap-1">
                {dept.icon} {dept.name.split("(")[0].trim()}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeDept.slug} className="mt-6 space-y-6">
            {/* Head info + edit */}
            <div className="bg-white rounded-2xl shadow-sm p-6 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    Department Head
                    <span className="text-xs font-medium text-gray-400">({activeDept.name})</span>
                  </h2>
                  <p className="text-sm text-gray-500">
                    {head?.name} ({head?.username})
                    {head?.phone ? ` · ${head.phone}` : ""}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingHead(true)}>
                <Edit2 className="w-4 h-4" />
                Edit Head
              </Button>
            </div>

            {/* Officers list */}
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Officers & Workload — {activeDept.name} ({officers.length})
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
                      <DialogTitle>Add New Officer — {activeDept.name}</DialogTitle>
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
                  const activeCount = officer.activeComplaints || 0;
                  const resolvedCount = officer.resolvedCount || 0;
                  const totalCount = activeCount + resolvedCount;
                  const workloadPct = totalCount === 0 ? 0 : Math.round((activeCount / totalCount) * 100);
                  return (
                    <div
                      key={officer.username}
                      className="px-6 py-4 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
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

                      <div className="flex items-center gap-6 flex-wrap">
                        {/* mini workload bar */}
                        <div className="w-40">
                          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                            <span className="flex items-center gap-0.5 text-amber-600 font-medium">
                              <Briefcase className="w-3 h-3" /> {activeCount} active
                            </span>
                            <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> {resolvedCount} resolved
                            </span>
                          </div>
                          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-emerald-500"
                              style={{ width: `${activeCount === 0 ? 0 : workloadPct}%` }}
                              title={`${activeCount} active of ${totalCount} total`}
                            />
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditingOfficer(officer)}>
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
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Officer modal */}
      {editingOfficer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setEditingOfficer(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Officer — {activeDept.name}</h3>
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

      {/* Edit Head modal */}
      {editingHead && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setEditingHead(false)}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-gray-900">Edit Department Head — {activeDept.name}</h3>
              <button onClick={() => setEditingHead(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                try {
                  await handleUpdateHead(formData.get("name"), formData.get("phone"));
                  setEditingHead(false);
                } catch (err) {
                  // error already alerted
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="head-name">Head Name</Label>
                <Input id="head-name" name="name" type="text" defaultValue={head?.name} required className="w-full" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input type="text" value={head?.username || ""} disabled className="w-full bg-gray-50 text-gray-400" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="head-phone">Phone</Label>
                <Input id="head-phone" name="phone" type="tel" defaultValue={head?.phone} required className="w-full" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                  Save Changes
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditingHead(false)}>
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
