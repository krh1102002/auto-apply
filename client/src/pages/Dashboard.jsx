import React, { useEffect, useState } from "react";
import axios from "axios";
import useAuthStore from "../store/authStore";
import useApplicationStore from "../store/applicationStore";
import useJobStore from "../store/jobStore";
import API_BASE_URL from "../config/api";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  Sparkles,
  Rocket,
  TrendingUp,
  Zap,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
// Lazy load 3D components
const CareerOrb = React.lazy(() => import("../three-ui/CareerOrb"));
const FloatingShapes = React.lazy(() => import("../three-ui/FloatingShapes"));
const StatOrb = React.lazy(() => import("../three-ui/StatOrb"));

const glassClass =
  "bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl";
const glassCardClass = `${glassClass} rounded-3xl transition-all duration-500 border-white/5 hover:bg-white/10 hover:border-white/20`;
const btnPrimaryClass =
  "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-3 px-6 rounded-2xl transition-all duration-300 shadow-lg shadow-indigo-500/20 active:scale-[0.98]";

const StatCard = React.memo(({ stat, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
    whileHover={{ scale: 1.02, y: -5 }}
    className={`${glassCardClass} p-6 flex flex-col justify-between relative overflow-hidden cursor-pointer group`}
  >
    <div className="absolute -right-8 -top-8 opacity-30 group-hover:opacity-50 transition-opacity">
      <React.Suspense
        fallback={<div className="h-10 w-10 bg-white/5 rounded-full" />}
      >
        <StatOrb value={stat.value} color={stat.color} />
      </React.Suspense>
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 mb-4">
        <div className={`p-2 rounded-xl bg-white/5 ${stat.iconColor}`}>
          <stat.icon className="h-4 w-4" />
        </div>
        <h3 className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">
          {stat.label}
        </h3>
      </div>
      <p
        className={`text-5xl font-black font-display tracking-tight ${stat.iconColor}`}
      >
        {stat.value}
      </p>
    </div>
    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  </motion.div>
));

const RECENT_ACTIVITY_PAGE_SIZE = 25;

const statusBadgeClass = (status) => {
  switch (status) {
    case "Applied":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]";
    case "Failed":
      return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    case "Rejected":
      return "bg-orange-500/10 text-orange-300 border-orange-500/20";
    case "Interviewing":
      return "bg-sky-500/10 text-sky-300 border-sky-500/20";
    case "Accepted":
      return "bg-teal-500/10 text-teal-300 border-teal-500/20";
    default:
      return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
  }
};

const ApplicationsTable = React.memo(({ applications, emptyMessage }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em] border-b border-white/5">
          <th className="px-8 py-6">Job Role</th>
          <th className="px-8 py-6">Company</th>
          <th className="px-8 py-6">Status</th>
          <th className="px-8 py-6 text-right">Reference</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.03]">
        {applications.length === 0 ? (
          <tr>
            <td
              colSpan="4"
              className="px-8 py-20 text-center text-slate-500 italic font-medium"
            >
              {emptyMessage ||
                "No applications match this filter on this page."}
            </td>
          </tr>
        ) : (
          applications.map((app) => (
            <tr
              key={app._id}
              className="hover:bg-white/[0.03] transition-all duration-300 group"
            >
              <td className="px-8 py-6">
                <div className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">
                  {app.jobId?.title || "Unknown Role"}
                </div>
              </td>
              <td className="px-8 py-6">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-xs font-bold border border-white/10 group-hover:border-white/20 transition-all">
                    {app.jobId?.company?.[0] || "?"}
                  </div>
                  <span className="text-slate-400 font-medium">
                    {app.jobId?.company || "Unknown"}
                  </span>
                </div>
              </td>
              <td className="px-8 py-6">
                <span
                  className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${statusBadgeClass(app.status)}`}
                >
                  {app.status === "Pending" && (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  )}
                  {app.status}
                </span>
              </td>
              <td className="px-8 py-6 text-right">
                <a
                  href={app.jobId?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex p-2.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                >
                  <ExternalLink className="h-5 w-5" />
                </a>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
));

const Dashboard = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { applications, stats, fetchApplications, fetchStats, massApply } =
    useApplicationStore();
  const { jobs, fetchJobs } = useJobStore();
  const navigate = useNavigate();
  const [massApplying, setMassApplying] = useState(false);
  const [savingAutomation, setSavingAutomation] = useState(false);
  const [failedRows, setFailedRows] = useState([]);
  const [sortBy, setSortBy] = useState("latest");
  const [countryFilter, setCountryFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [automationForm, setAutomationForm] = useState({
    enabled: true,
    roleKeywords: "software engineer, full stack, java developer",
    experienceLevels: "Entry",
    countries: "",
  });
  const [activityStatusFilter, setActivityStatusFilter] = useState("all");
  const [activityPage, setActivityPage] = useState(1);

  const token = localStorage.getItem("token");

  const fetchAutomationSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/users/automation-settings`, {
        headers: { "x-auth-token": token },
      });
      setAutomationForm({
        enabled: res.data?.enabled !== false,
        roleKeywords: (res.data?.roleKeywords || []).join(", "),
        experienceLevels: (res.data?.experienceLevels || []).join(", "),
        countries: (res.data?.countries || []).join(", "),
      });
    } catch (_err) {}
  };

  const fetchFailedDiagnostics = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/applications/failed-diagnostics`, {
        headers: { "x-auth-token": token },
        params: {
          sortBy,
          country: countryFilter,
          role: roleFilter,
          experience: experienceFilter,
        },
      });
      setFailedRows(res.data || []);
    } catch (_err) {
      setFailedRows([]);
    }
  };

  const saveAutomationSettings = async () => {
    setSavingAutomation(true);
    try {
      await axios.put(
        `${API_BASE_URL}/api/users/automation-settings`,
        {
          enabled: automationForm.enabled,
          roleKeywords: automationForm.roleKeywords
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          experienceLevels: automationForm.experienceLevels
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          countries: automationForm.countries
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
        { headers: { "x-auth-token": token } },
      );
    } catch (_err) {
      // no-op
    } finally {
      setSavingAutomation(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchStats();
    fetchJobs({ experienceLevel: "Entry" });
    fetchAutomationSettings();
    fetchFailedDiagnostics();
    const interval = setInterval(
      () => {
        fetchApplications({ background: true });
        fetchStats();
        fetchFailedDiagnostics();
      },
      10000,
    );
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchFailedDiagnostics();
  }, [sortBy, countryFilter, roleFilter, experienceFilter]);

  const fresherJobs = React.useMemo(
    () => jobs.filter((j) => j.experienceLevel === "Entry"),
    [jobs],
  );
  const unappliedFresherJobs = React.useMemo(
    () =>
      fresherJobs.filter(
        (j) => !applications.some((a) => a.jobId?._id === j._id),
      ),
    [fresherJobs, applications],
  );

  const localStats = React.useMemo(
    () => ({
      total: applications.length,
      applied: applications.filter((a) => a.status === "Applied").length,
      pending: applications.filter((a) => a.status === "Pending").length,
      failed: applications.filter((a) => a.status === "Failed").length,
      rejected: applications.filter((a) => a.status === "Rejected").length,
    }),
    [applications],
  );

  const mergedStats = {
    total: stats?.total ?? localStats.total,
    applied: stats?.applied ?? localStats.applied,
    pending: stats?.pending ?? localStats.pending,
    failed: stats?.failed ?? localStats.failed,
    rejected: stats?.rejected ?? localStats.rejected,
  };

  const activityStatusTabs = React.useMemo(() => {
    const counts = {
      all: applications.length,
      Applied: applications.filter((a) => a.status === "Applied").length,
      Pending: applications.filter((a) => a.status === "Pending").length,
      Failed: applications.filter((a) => a.status === "Failed").length,
      Rejected: applications.filter((a) => a.status === "Rejected").length,
      Interviewing: applications.filter((a) => a.status === "Interviewing").length,
      Accepted: applications.filter((a) => a.status === "Accepted").length,
    };
    return [
      { key: "all", label: "All" },
      { key: "Applied", label: "Applied" },
      { key: "Pending", label: "Pending" },
      { key: "Failed", label: "Failed" },
      { key: "Rejected", label: "Rejected" },
      { key: "Interviewing", label: "Interview" },
      { key: "Accepted", label: "Accepted" },
    ].map((t) => ({ ...t, count: counts[t.key] ?? 0 }));
  }, [applications]);

  const filteredActivityApplications = React.useMemo(() => {
    if (activityStatusFilter === "all") return applications;
    return applications.filter((a) => a.status === activityStatusFilter);
  }, [applications, activityStatusFilter]);

  const activityTotalPages = Math.max(
    1,
    Math.ceil(filteredActivityApplications.length / RECENT_ACTIVITY_PAGE_SIZE),
  );

  React.useEffect(() => {
    setActivityPage(1);
  }, [activityStatusFilter]);

  React.useEffect(() => {
    setActivityPage((p) => Math.min(p, activityTotalPages));
  }, [activityTotalPages]);

  const paginatedActivityApplications = React.useMemo(() => {
    const start = (activityPage - 1) * RECENT_ACTIVITY_PAGE_SIZE;
    return filteredActivityApplications.slice(
      start,
      start + RECENT_ACTIVITY_PAGE_SIZE,
    );
  }, [filteredActivityApplications, activityPage]);

  const activityRangeStart =
    filteredActivityApplications.length === 0
      ? 0
      : (activityPage - 1) * RECENT_ACTIVITY_PAGE_SIZE + 1;
  const activityRangeEnd = Math.min(
    activityPage * RECENT_ACTIVITY_PAGE_SIZE,
    filteredActivityApplications.length,
  );

  const recentActivityEmptyMessage =
    applications.length === 0
      ? "The discovery engine is currently scanning for your first role..."
      : "No applications match this filter.";

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-8 font-sans relative overflow-hidden">
      <React.Suspense
        fallback={<div className="absolute inset-0 bg-black/50" />}
      >
        <FloatingShapes />
      </React.Suspense>
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex justify-between items-center mb-16">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-5xl font-extrabold font-display text-gradient tracking-tight">
              Hello, {user?.name?.split(" ")[0] || "User"}
            </h1>
            <p className="text-slate-400 mt-2 font-medium">
              Your global automation desk is active.
            </p>
          </motion.div>
          <button
            onClick={() => {
              logout();
              navigate("/login");
            }}
            className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-semibold"
          >
            Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
          {/* 3D Visual Section */}
          <div
            className={`lg:col-span-1 ${glassCardClass} p-8 flex flex-col items-center justify-between relative overflow-hidden group`}
          >
            <div className="absolute top-6 left-8 z-10">
              <h3 className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />{" "}
                Growth Engine
              </h3>
            </div>
            <React.Suspense
              fallback={
                <div className="h-72 w-full flex items-center justify-center text-white/5">
                  <Loader2 className="animate-spin" />
                </div>
              }
            >
              <CareerOrb count={mergedStats.applied} />
            </React.Suspense>
            <div className="text-center z-10 w-full">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${Math.min((mergedStats.applied / 10) * 100, 100)}%`,
                  }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                />
              </div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                Efficiency: {Math.min(mergedStats.applied * 10, 100)}%
              </p>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                label: "Total Tracked",
                value: mergedStats.total,
                color: "#ffffff",
                icon: TrendingUp,
                iconColor: "text-white",
              },
              {
                label: "Successfully Applied",
                value: mergedStats.applied,
                color: "#34d399",
                icon: CheckCircle2,
                iconColor: "text-emerald-400",
              },
              {
                label: "Active Queue",
                value: mergedStats.pending,
                color: "#818cf8",
                icon: Zap,
                iconColor: "text-indigo-400",
              },
              {
                label: "Rejected/Failed",
                value: mergedStats.rejected + mergedStats.failed,
                color: "#f43f5e",
                icon: XCircle,
                iconColor: "text-rose-400",
              },
            ].map((stat, i) => (
              <StatCard key={i} stat={stat} index={i} />
            ))}
          </div>
        </div>

        {/* Applications List */}
        <div className={`${glassCardClass} overflow-hidden border-none mb-16`}>
          <div className="p-8 border-b border-white/5 bg-white/[0.02] flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
            <h2 className="text-2xl font-bold font-display">Recent Activity</h2>
            <div className="flex gap-2 items-center">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Live Updates Enabled
              </span>
            </div>
          </div>

          <div className="px-4 sm:px-8 pt-6 pb-4 border-b border-white/5 bg-white/[0.02]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">
              Filter by status
            </p>
            <div className="flex flex-wrap gap-2">
              {activityStatusTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActivityStatusFilter(tab.key)}
                  className={`rounded-xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider border transition-all ${
                    activityStatusFilter === tab.key
                      ? "bg-indigo-500/30 border-indigo-500/50 text-white shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                      : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 tabular-nums ${
                      activityStatusFilter === tab.key
                        ? "text-indigo-200/90"
                        : "text-slate-500"
                    }`}
                  >
                    ({tab.count})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-8 py-4 border-b border-white/5">
            <p className="text-xs text-slate-500 font-medium">
              {filteredActivityApplications.length === 0 ? (
                <>No rows for this filter.</>
              ) : (
                <>
                  Showing{" "}
                  <span className="text-slate-300">
                    {activityRangeStart}–{activityRangeEnd}
                  </span>{" "}
                  of{" "}
                  <span className="text-slate-300">
                    {filteredActivityApplications.length}
                  </span>{" "}
                  (25 per page)
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={activityPage <= 1}
                onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
                Prev
              </button>
              <span className="text-xs text-slate-400 font-mono px-2">
                {activityPage} / {activityTotalPages}
              </span>
              <button
                type="button"
                disabled={activityPage >= activityTotalPages}
                onClick={() =>
                  setActivityPage((p) => Math.min(activityTotalPages, p + 1))
                }
                className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 hover:bg-white/10 disabled:opacity-40 disabled:pointer-events-none transition-all"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <ApplicationsTable
            applications={paginatedActivityApplications}
            emptyMessage={recentActivityEmptyMessage}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          <motion.div
            whileHover={{ y: -5 }}
            className={`${glassCardClass} p-10 border-indigo-500/30 bg-indigo-500/[0.03] flex flex-col justify-between`}
          >
            <div>
              <h2 className="text-3xl font-black mb-4 flex items-center gap-3 font-display tracking-tight">
                <Rocket className="h-8 w-8 text-indigo-400" /> Opportunities
              </h2>
              <p className="text-slate-400 mb-8 font-medium leading-relaxed">
                We've curated{" "}
                <span className="text-white font-bold">
                  {fresherJobs.length}
                </span>{" "}
                high-growth roles matching your global profile.
                <span className="text-indigo-400 block mt-1">
                  Discovery engine status: Highly Active.
                </span>
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  setMassApplying(true);
                  const ids = unappliedFresherJobs
                    .slice(0, 50)
                    .map((j) => j._id);
                  if (ids.length > 0) await massApply(ids);
                  setMassApplying(false);
                }}
                disabled={massApplying || unappliedFresherJobs.length === 0}
                className={`flex-1 ${btnPrimaryClass} flex items-center justify-center gap-3 group`}
              >
                {massApplying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5 group-hover:rotate-12 transition-transform" />
                )}
                Autoscale Apply ({Math.min(unappliedFresherJobs.length, 50)})
              </button>
              <button
                onClick={() => navigate("/discovery")}
                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all active:scale-95"
              >
                Explore Hub
              </button>
            </div>
          </motion.div>

          <div className={`${glassCardClass} p-10 flex flex-col h-full`}>
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3 font-display">
              <div className="h-2 w-2 rounded-full bg-purple-500" /> Real-time
              Feed
            </h3>
            <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {jobs.slice(0, 4).map((job, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center p-5 bg-white/[0.02] rounded-2xl border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center text-indigo-400 font-bold border border-indigo-500/10">
                      {job.company?.[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-200">
                        {job.title.length > 30
                          ? job.title.substring(0, 30) + "..."
                          : job.title}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                        {job.company}
                      </p>
                    </div>
                  </div>
                  <div className="p-2 bg-white/5 rounded-lg opacity-0 group-hover:opacity-100 transition-all text-slate-400">
                    <ExternalLink className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20">
          <div className={`${glassCardClass} p-8`}>
            <h3 className="text-xl font-bold mb-4">Cron Target Settings</h3>
            <p className="text-sm text-slate-400 mb-6">
              Hourly cron will keep applying only for these filters until you change them.
            </p>
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={automationForm.enabled}
                  onChange={(e) =>
                    setAutomationForm((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                />
                Enable automation
              </label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                value={automationForm.roleKeywords}
                onChange={(e) =>
                  setAutomationForm((prev) => ({ ...prev, roleKeywords: e.target.value }))
                }
                placeholder="Role keywords (comma separated)"
              />
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                value={automationForm.experienceLevels}
                onChange={(e) =>
                  setAutomationForm((prev) => ({ ...prev, experienceLevels: e.target.value }))
                }
                placeholder="Experience levels (Entry, Mid...)"
              />
              <input
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm"
                value={automationForm.countries}
                onChange={(e) =>
                  setAutomationForm((prev) => ({ ...prev, countries: e.target.value }))
                }
                placeholder="Countries (comma separated)"
              />
              <button
                onClick={saveAutomationSettings}
                disabled={savingAutomation}
                className={`${btnPrimaryClass} w-full`}
              >
                {savingAutomation ? "Saving..." : "Save Automation Filters"}
              </button>
            </div>
          </div>

          <div className={`${glassCardClass} p-8`}>
            <h3 className="text-xl font-bold mb-4">Failed Jobs (Manual Apply Links)</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <select
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="latest">Sort: Latest</option>
                <option value="country">Sort: Country</option>
                <option value="role">Sort: Role</option>
                <option value="retry">Sort: Retry Count</option>
              </select>
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                placeholder="Country filter"
                value={countryFilter}
                onChange={(e) => setCountryFilter(e.target.value)}
              />
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                placeholder="Role filter"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              />
              <input
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm"
                placeholder="Experience filter"
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
              />
            </div>
            <div className="max-h-80 overflow-y-auto space-y-2">
              {failedRows.length === 0 && (
                <p className="text-sm text-slate-400">No failed jobs for current filters.</p>
              )}
              {failedRows.slice(0, 100).map((row) => (
                <div
                  key={row.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{row.title}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {row.company} • {row.country} • {row.experienceLevel}
                    </p>
                  </div>
                  <a
                    href={row.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 text-xs"
                  >
                    Apply
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
