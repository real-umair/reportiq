import React, { useState } from "react";
import { supabase } from "../lib/supabase";
import { Client, Report, Profile } from "../types";
import { FileText, Lock, Mail, Eye, ShieldAlert, ArrowRight, LogOut, Calendar, Building2 } from "lucide-react";

export default function ClientPortal() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientObj, setClientObj] = useState<Client | null>(null);
  const [agencyProfile, setAgencyProfile] = useState<Profile | null>(null);
  const [clientReports, setClientReports] = useState<Report[]>([]);

  const handlePortalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const emailInput = email.trim().toLowerCase();
      if (!emailInput) {
        throw new Error("Please enter your email address.");
      }

      // 1. Fetch client matching email
      const { data: dbClient, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .ilike("email", emailInput)
        .maybeSingle();

      if (clientError) throw clientError;

      if (!dbClient) {
        throw new Error("No client portal registered for this email address. Please contact your agency.");
      }

      // 2. Fetch agency owner profile
      const { data: dbProfile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", dbClient.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!dbProfile) {
        throw new Error("Unable to locate parent agency profile.");
      }

      // Check plan limits - MUST be Pro plan
      if (dbProfile.plan !== "pro") {
        throw new Error("The client portal is only available on Pro plans. Please contact your agency provider.");
      }

      // 3. Fetch reports linked to this client (status must be ready or sent)
      const { data: dbReports, error: reportsError } = await supabase
        .from("reports")
        .select("*")
        .eq("client_id", dbClient.id)
        .in("status", ["ready", "sent"])
        .order("created_at", { ascending: false });

      if (reportsError) throw reportsError;

      // Map values
      const mappedClient: Client = {
        id: dbClient.id,
        userId: dbClient.user_id,
        name: dbClient.name,
        email: dbClient.email,
        company: dbClient.company,
        logoUrl: dbClient.logo_url || null,
        notes: dbClient.notes,
        createdAt: dbClient.created_at,
      };

      const mappedProfile: Profile = {
        uid: dbProfile.id,
        email: dbProfile.email,
        fullName: dbProfile.full_name,
        agencyName: dbProfile.agency_name,
        logoUrl: dbProfile.logo_url || null,
        brandColor: dbProfile.brand_color || "#6366f1",
        plan: dbProfile.plan,
        reportsGeneratedThisMonth: dbProfile.reports_generated_this_month || 0,
        avatarUrl: dbProfile.avatar_url || null,
        brandLogoUrl: dbProfile.brand_logo_url || null,
      };

      const mappedReports: Report[] = (dbReports || []).map((r: any) => ({
        id: r.id,
        userId: r.user_id,
        clientId: r.client_id,
        title: r.title,
        periodStart: r.period_start,
        periodEnd: r.period_end,
        status: r.status,
        slug: r.slug,
        aiSummary: r.ai_summary,
        rawData: r.raw_data || {},
        sections: r.sections || [],
        customMessage: r.custom_message,
        attachments: r.attachments || [],
        tone: r.tone || "Formal & Corporate",
        viewCount: r.view_count || 0,
        createdAt: r.created_at,
      }));

      setClientObj(mappedClient);
      setAgencyProfile(mappedProfile);
      setClientReports(mappedReports);
    } catch (err: any) {
      console.error("Portal login failed:", err);
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setClientObj(null);
    setAgencyProfile(null);
    setClientReports([]);
    setEmail("");
  };

  if (clientObj && agencyProfile) {
    const brandColor = agencyProfile.brandColor || "#6366f1";
    return (
      <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
        <div style={{ backgroundColor: brandColor }} className="h-2.5 w-full shrink-0" />
        
        <header className="bg-white border-b border-slate-200 py-5 px-6 sm:px-12 sticky top-0 z-10 shadow-xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {agencyProfile.brandLogoUrl ? (
                <img 
                  src={agencyProfile.brandLogoUrl} 
                  alt={agencyProfile.agencyName || "Agency Logo"} 
                  className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1" 
                />
              ) : (
                <div 
                  style={{ backgroundColor: brandColor }} 
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white font-bold"
                >
                  {agencyProfile.agencyName?.charAt(0).toUpperCase() || "A"}
                </div>
              )}
              <div>
                <p className="font-semibold text-slate-955 tracking-tight text-base leading-none">
                  {agencyProfile.agencyName}
                </p>
                <p className="text-[10px] text-slate-400 font-mono tracking-wider uppercase mt-1">Client Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="hidden md:inline-flex text-xs text-slate-500 font-mono bg-slate-100 py-1.5 px-3 rounded-full">
                Welcome, {clientObj.name}
              </span>
              <button
                onClick={handleLogout}
                className="py-1.5 px-3 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 transition-all text-slate-600 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-12">
          <div className="mb-10 text-left">
            <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 tracking-tight leading-none">
              Your Performance Briefings
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">
              Access all historical progress and analytics reports published by {agencyProfile.agencyName}
            </p>
          </div>

          <style dangerouslySetInnerHTML={{__html: `
            .portal-report-card:hover {
              border-color: ${brandColor} !important;
            }
            .portal-report-card:hover h3 {
              color: ${brandColor} !important;
            }
          `}} />

          {clientReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientReports.map(report => (
                <a
                  key={report.id}
                  href={`/r/${report.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="portal-report-card bg-white border border-slate-200 hover:shadow-md rounded-2xl p-6 flex flex-col justify-between h-56 transition-all shadow-2xs group cursor-pointer text-left"
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {report.periodStart}
                      </span>
                    </div>

                    <h3 className="font-bold font-display text-slate-955 text-base mt-4 transition-colors line-clamp-2 leading-snug">
                      {report.title}
                    </h3>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-mono">
                    <span style={{ color: brandColor }} className="flex items-center gap-1.5 font-semibold">
                      View Report
                      <ArrowRight className="w-3.5 h-3.5 shrink-0 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center shadow-xs">
              <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold font-display text-slate-950">No Reports Published Yet</h3>
              <p className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto">
                Your agency partner hasn't finalized or sent any reports to this portal profile yet.
              </p>
            </div>
          )}
        </main>
        
        <footer className="bg-white border-t border-slate-200 py-8 px-6 text-center text-slate-400 text-xs mt-12 shrink-0">
          <p>© 2026 {agencyProfile.agencyName}</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl relative text-left">
        <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-650 mb-6 shadow-3xs">
          <Lock className="w-5 h-5 text-indigo-600 animate-pulse" />
        </div>
        
        <h2 className="text-xl font-bold font-display text-slate-955 tracking-tight">
          Client Portal Access
        </h2>
        <p className="text-slate-500 text-xs mt-1 leading-normal mb-6">
          Enter your registered email address to access your agency briefings.
        </p>

        {error && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex gap-2 font-medium">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        <form onSubmit={handlePortalLogin} className="space-y-4 text-xs font-medium">
          <div>
            <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
              Portal Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                placeholder="client@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 pl-10 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-sans"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Verifying Portal...
                </>
              ) : (
                <>
                  Enter Portal Room
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
