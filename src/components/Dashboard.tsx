import React, { useState } from "react";
import { Profile, Client, Report, PLAN_LIMITS } from "../types";
import { Users, FileText, ClipboardList, TrendingUp, Calendar, Plus, ExternalLink, Sparkles, Copy, Check, Eye } from "lucide-react";

interface DashboardProps {
  profile: Profile | null;
  clients: Client[];
  reports: Report[];
  onNavigate: (tab: string) => void;
  onSelectReportId: (id: string) => void;
}

export default function Dashboard({ profile, clients, reports, onNavigate, onSelectReportId }: DashboardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalClients = clients.length;
  const totalReports = reports.length;
  const plan = profile?.plan || "free";
  const limit = PLAN_LIMITS[plan];
  const reportsThisMonth = profile?.reportsGeneratedThisMonth || 0;

  // Render status badge helper
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "generating":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 mr-1.5 bg-amber-500 rounded-full animate-ping"></span>
            Generating
          </span>
        );
      case "ready":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
            Ready
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200">
            Sent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  const copyShareLink = async (e: React.MouseEvent, slug: string, reportId: string) => {
    e.stopPropagation();
    try {
      const host = `${window.location.protocol}//${window.location.host}`;
      let url = `${host}/r/${slug}`;
      if (profile?.plan === "pro") {
        const slugify = (text: string) =>
          text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "-")
            .replace(/[^\w\-]+/g, "")
            .replace(/\-\-+/g, "-")
            .replace(/^-+/, "")
            .replace(/-+$/, "");
        const agencySlug = slugify(profile.agencyName || "agency");
        url = `${host}/a/${agencySlug}/r/${slug}`;
      }
      await navigator.clipboard.writeText(url);
      setCopiedId(reportId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const recentReports = reports.slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Dynamic welcome header with style and grace */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-950">
            Welcome to ReportIQ
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Running dashboard for <span className="font-semibold text-slate-800">{profile?.agencyName || "Smith Digital"}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onNavigate("clients")}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            Add Client
          </button>
          <button
            onClick={() => onNavigate("reports")}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            New Report
          </button>
        </div>
      </div>

      {/* Stats row grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Clients card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Total Clients</span>
            <p className="text-3xl font-bold font-display text-slate-950 mt-1">{totalClients}</p>
            <p className="text-xs text-slate-400 mt-1">active registry</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shadow-2xs">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Total Reports Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Total Reports</span>
            <p className="text-3xl font-bold font-display text-slate-950 mt-1">{totalReports}</p>
            <p className="text-xs text-slate-400 mt-1">all-time records</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* This Month's Allowance Usage with progress bars */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">This Month</span>
              <p className="text-3xl font-bold font-display text-slate-950 mt-1">
                {reportsThisMonth} <span className="text-slate-400 text-sm font-normal">/ {limit.reports === 999 ? "∞" : limit.reports}</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shadow-2xs">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (reportsThisMonth / (limit.reports || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1.5">Usage Allowance Progress</p>
          </div>
        </div>

        {/* Support Plan Badge Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-slate-500 text-xs font-mono uppercase tracking-wider">Service Tier</span>
              <p className="text-3xl font-bold font-display text-indigo-600 uppercase mt-1">
                {plan}
              </p>
            </div>
            <div className="px-2.5 py-1 bg-indigo-600 text-white text-[10px] font-mono leading-none font-bold rounded-lg uppercase shadow-xs">
              ACTIVE
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Client Limit: {limit.clients === 999 ? "∞" : limit.clients}</span>
            <button 
              onClick={() => onNavigate("settings")} 
              className="text-indigo-600 hover:underline cursor-pointer"
            >
              Manage &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Main body bento layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left wider block: Recent reports */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-display text-slate-950">Recent Generated Reports</h3>
                <p className="text-xs text-slate-500 mt-1">Track views and share dynamic links instantly</p>
              </div>
              <button
                onClick={() => onNavigate("reports")}
                className="text-xs font-mono text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
              >
                View Library &rarr;
              </button>
            </div>

            {recentReports.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6 pb-2.5 pl-6">Report Title</th>
                      <th className="py-3 px-4 pb-2.5">Status</th>
                      <th className="py-3 px-4 pb-2.5 text-center">Views</th>
                      <th className="py-3 px-6 pb-2.5 text-right pr-6">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentReports.map(report => {
                      const clientObj = clients.find(c => c.id === report.clientId);
                      return (
                        <tr
                          key={report.id}
                          onClick={() => {
                            onSelectReportId(report.id);
                            onNavigate("reports");
                          }}
                          className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 px-6 pl-6">
                            <p className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                              {report.title}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {clientObj?.name || "Client partner"} · {report.periodStart}
                            </p>
                          </td>
                          <td className="py-4 px-4">{renderStatusBadge(report.status)}</td>
                          <td className="py-4 px-4 text-center text-xs font-mono text-slate-500">
                            {report.viewCount}
                          </td>
                          <td className="py-4 px-6 text-right pr-6" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-2">
                              {/* Direct copy link button */}
                              {report.status !== "draft" && report.status !== "generating" && (
                                <button
                                  onClick={e => copyShareLink(e, report.slug, report.id)}
                                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-slate-600 hover:bg-slate-50 shadow-2xs transition-all relative group/copy cursor-pointer"
                                  title="Copy share link"
                                >
                                  {copiedId === report.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  onSelectReportId(report.id);
                                  onNavigate("reports");
                                }}
                                className="p-1 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-slate-50 shadow-2xs transition-all cursor-pointer"
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900">No Reports Generated Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Connect a client registry and draft an automated, AI-written summary document instantly.
                </p>
                <button
                  onClick={() => onNavigate("reports")}
                  className="mt-4 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  Create report &rarr;
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right narrower block: Connected clients overview list */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold font-display text-slate-950">Active Clients</h3>
              <p className="text-xs text-slate-500 mt-1">Directory overview status</p>
            </div>
            <button
              onClick={() => onNavigate("clients")}
              className="text-xs font-mono text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
            >
              All Clients &rarr;
            </button>
          </div>

          <div className="p-6">
            {clients.length > 0 ? (
              <div className="space-y-4">
                {clients.slice(0, 5).map(clientObj => {
                  const clientReportsCount = reports.filter(r => r.clientId === clientObj.id).length;
                  return (
                    <div
                      key={clientObj.id}
                      onClick={() => onNavigate("clients")}
                      className="flex items-center justify-between p-3.5 border border-slate-100 rounded-xl hover:bg-slate-50/50 hover:border-slate-200 transition-all cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold font-display text-sm shrink-0">
                          {clientObj.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-950 group-hover:text-indigo-600 transition-colors">
                            {clientObj.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {clientObj.company || "No company register"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex px-2 py-0.5 text-[9px] font-mono leading-none bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                          {clientReportsCount} reports
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-10">
                <div className="w-10 h-10 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400 shadow-2xs">
                  <Users className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-semibold text-slate-950">Clients database is empty</h4>
                <p className="text-[10px] text-slate-400 mt-1">Add your client first to track deliverables.</p>
                <button
                  onClick={() => onNavigate("clients")}
                  className="mt-3 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Register Client
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
