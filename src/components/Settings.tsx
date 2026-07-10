import React, { useState } from "react";
import { supabaseDb, supabase, getAuthHeaders } from "../lib/supabase";
import { Profile, PLAN_LIMITS, Plan } from "../types";
import { Settings as SettingsIcon, CreditCard, Check, ShieldAlert, CheckCircle2, Award, Sparkles, Lock } from "lucide-react";

interface SettingsProps {
  userId: string;
  profile: Profile | null;
  onRefresh: () => void;
  showLock: (feature: string, plan: "Starter" | "Pro", price: string) => void;
}

export default function Settings({ userId, profile, onRefresh, showLock }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<"profile" | "billing">("profile");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "lifetime">("monthly");

  // Profile states
  const [fullName, setFullName] = useState(profile?.fullName || "");
  const [agencyName, setAgencyName] = useState(profile?.agencyName || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatarUrl || "");
  const [brandLogoUrl, setBrandLogoUrl] = useState(profile?.brandLogoUrl || "");
  const [whiteLabel, setWhiteLabel] = useState(profile?.whiteLabel || false);
  const [brandColor, setBrandColor] = useState(profile?.brandColor || "#6366f1");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const [clientsCount, setClientsCount] = useState(0);

  React.useEffect(() => {
    supabaseDb.getClients(userId).then(clients => {
      setClientsCount(clients.length);
    }).catch(err => console.error("Error loading clients for settings calculations:", err));

    if (profile) {
      setFullName(profile.fullName || "");
      setAgencyName(profile.agencyName || "");
      setAvatarUrl(profile.avatarUrl || "");
      setBrandLogoUrl(profile.brandLogoUrl || "");
      setWhiteLabel(profile.whiteLabel || false);
      setBrandColor(profile.brandColor || "#6366f1");
    }
  }, [userId, profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = type === 'avatar' ? setUploadingAvatar : setUploadingLogo;
    const setUrl = type === 'avatar' ? setAvatarUrl : setBrandLogoUrl;
    const bucket = type === 'avatar' ? 'avatars' : 'logos';

    try {
      setUploading(true);
      setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUrl(publicUrl);
    } catch (err: any) {
      console.error(`Failed to upload ${type}:`, err);
      setError(`Failed to upload image: ${err.message || 'Error occurred.'}`);
    } finally {
      setUploading(false);
    }
  };

  // Polar credentials loaded from environment variables on the backend

  const plan = profile?.plan || "free";
  const reportsThisMonth = profile?.reportsGeneratedThisMonth || 0;
  const limitObj = PLAN_LIMITS[plan];

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaveSuccess(false);

    if (!agencyName.trim()) {
      setError("Agency / Freelancer name is required.");
      return;
    }

    try {
      setSaving(true);
      await supabaseDb.updateProfile(userId, {
        fullName: fullName.trim() || null,
        agencyName: agencyName.trim(),
        avatarUrl: avatarUrl || null,
        brandLogoUrl: brandLogoUrl || null,
        whiteLabel: whiteLabel,
        brandColor: brandColor,
      });

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
    } catch (err: any) {
      console.error("Failed to update profile document:", err);
      setError(err?.message || "Internal database transaction failed.");
    } finally {
      setSaving(false);
    }
  };

  // Upgrade plan helper using real Polar checkouts + local instant unlock
  const handleUpgradePlan = async (targetPlan: Plan) => {
    // Admin bypass for farooquiumair18@gmail.com
    if (profile?.email === "farooquiumair18@gmail.com") {
      try {
        setSaving(true);
        setError(null);
        await supabaseDb.updateProfile(userId, {
          plan: targetPlan,
        });
        alert(`Admin plan successfully updated to ${targetPlan}!`);
        onRefresh();
      } catch (err: any) {
        console.error("Admin plan change failed:", err);
        setError(err.message || "Failed to directly update admin plan.");
      } finally {
        setSaving(false);
      }
      return;
    }

    if (targetPlan === "free") {
      try {
        setSaving(true);
        await supabaseDb.updateProfile(userId, {
          plan: "free" as const,
        });
        onRefresh();
      } catch (err: any) {
        console.error("Failed to downgrade to free tier:", err);
      } finally {
        setSaving(false);
      }
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      const productId = targetPlan === "pro" ? "pro" : "starter";
      console.log(`[Polar Billing Link] Requesting checkout for ${targetPlan} / ${productId}...`);
      
      const authHeaders = await getAuthHeaders();
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...authHeaders
        },
        body: JSON.stringify({ 
          productId, 
          email: profile?.email || "",
          paymentType: billingCycle
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to contact checkout billing endpoint.");
      }

      const data = await response.json();
      if (data.checkoutUrl) {
        // Redirect current window to Polar checkout to verify payment/activation criteria
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("No valid checkout parameters returned from Polar.");
      }
    } catch (err: any) {
      console.error("Upgrade checkout invocation failed:", err);
      setError(err?.message || "Failed to initiate Polar checkout redirect.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans max-w-4xl">
      <div>
        <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-950">
          Account Settings
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Configure agency brand style, select colors, and manage service tier billing
        </p>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab("profile")}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "profile"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Agency Profile
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`py-3 px-6 text-sm font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === "billing"
              ? "border-indigo-600 text-indigo-600 font-semibold"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Billing & Usage
        </button>
      </div>

      {activeTab === "profile" ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-3 pb-5 border-b border-slate-100 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500 border border-slate-100">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold font-display text-slate-950">Branded Experience Setup</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customise the look and title of secure output pages</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-medium flex gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {saveSuccess && (
            <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile layout successfully updated. New brand elements are active!</span>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-6 font-sans text-sm max-w-xl">
            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                placeholder="e.g. Jane Smith"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                Agency / Freelancer Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Smith Consulting"
                value={agencyName}
                onChange={e => setAgencyName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-2">
                Brand Color (White-Label Accent)
              </label>
              <div className="flex flex-wrap items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
                {[
                  { name: "Indigo", hex: "#6366f1" },
                  { name: "Emerald", hex: "#10b981" },
                  { name: "Sky", hex: "#0ea5e9" },
                  { name: "Rose", hex: "#f43f5e" },
                  { name: "Amber", hex: "#f59e0b" },
                  { name: "Slate", hex: "#475569" },
                ].map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setBrandColor(color.hex)}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                    className={`w-7 h-7 rounded-full cursor-pointer transition-transform relative ${
                      brandColor === color.hex ? "scale-110 ring-2 ring-slate-400 ring-offset-2" : "hover:scale-105"
                    }`}
                  >
                    {brandColor === color.hex && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">✓</span>
                    )}
                  </button>
                ))}
                
                <div className="flex items-center gap-2 border-l border-slate-200 pl-3.5 ml-2.5">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => setBrandColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-slate-200 bg-white"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val.startsWith('#') && val.length <= 7) {
                        setBrandColor(val);
                      }
                    }}
                    placeholder="#6366f1"
                    className="w-20 rounded-lg border border-slate-200 outline-none p-1.5 px-2 bg-white text-xs font-mono uppercase focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100"
                    maxLength={7}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Profile Picture Upload Container */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Profile Picture (Avatar)
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-full border border-slate-200 bg-white overflow-hidden flex items-center justify-center relative shrink-0 shadow-2xs">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">👤</span>
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="file"
                      id="avatar-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'avatar')}
                    />
                    <label
                      htmlFor="avatar-input"
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs transition-all"
                    >
                      {uploadingAvatar ? "Uploading..." : "Choose Avatar"}
                    </label>
                    <p className="text-[10px] text-slate-400">Shown in sidebar next to agency name</p>
                  </div>
                </div>
              </div>

              {/* Brand Logo Upload Container */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1">
                  Brand Logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-16 rounded-xl border border-slate-200 bg-white overflow-hidden flex items-center justify-center relative shrink-0 p-1 bg-pattern shadow-2xs">
                    {brandLogoUrl ? (
                      <img src={brandLogoUrl} alt="Brand Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xl font-mono text-slate-400">🏢</span>
                    )}
                    {uploadingLogo && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="file"
                      id="brand-logo-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                    <label
                      htmlFor={plan === "free" ? undefined : "brand-logo-input"}
                      onClick={(e) => {
                        if (plan === "free") {
                          e.preventDefault();
                          showLock("Brand Logo", "Starter", "$29/mo");
                        }
                      }}
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs transition-all"
                    >
                      {uploadingLogo ? "Uploading..." : "Choose Logo"}
                    </label>
                    <p className="text-[10px] text-slate-400">Wider layout used on public report pages</p>
                  </div>
                </div>
              </div>
              
              {/* White Label toggle (shows for Pro and Arbitrage plan master owner) */}
              {(profile?.plan === 'pro' || profile?.plan === 'arbitrage') && profile?.email === "farooquiumair18@gmail.com" && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5 w-full">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">White Label Branding</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">Remove all ReportIQ branding and watermarks from client views.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={whiteLabel} 
                        onChange={(e) => setWhiteLabel(e.target.checked)} 
                        className="sr-only peer" 
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-650"></div>
                    </label>
                  </div>
                </div>
              )}
            </div>



            <div className="pt-2 border-t border-slate-50">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving changes...
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-medium flex gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Current plan stats billing element with progress bars */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] font-mono uppercase tracking-wider">Active plan tier</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <h3 className="text-base font-bold font-display uppercase tracking-wider text-indigo-600">
                      {plan === "starter" ? "Starter Plan" : plan === "pro" ? "Pro Plan" : plan === "arbitrage" ? "Arbitrage Plan" : "Free Plan"}
                    </h3>
                    <span className="inline-flex px-2 py-0.5 text-[9px] font-mono leading-none bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                      ACTIVE
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right font-mono text-xs">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Plan Type: </span>
                <span className="font-extrabold text-slate-700 uppercase">{plan}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
              {/* Reports Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 font-sans">Monthly Reports Generated</span>
                  <span className="font-mono font-bold text-slate-800">
                    {reportsThisMonth} of {limitObj.reports === 999 ? "Unlimited" : `${limitObj.reports} reports`} used
                  </span>
                </div>
                {limitObj.reports < 999 ? (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${reportsThisMonth >= limitObj.reports ? 'bg-amber-500' : 'bg-indigo-600'}`}
                      style={{ width: `${Math.min(100, (reportsThisMonth / limitObj.reports) * 100)}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-600" style={{ width: "100%" }} />
                  </div>
                )}
                <p className="text-[10px] text-slate-400">Resets on your monthly billing cycle anniversary.</p>
              </div>

              {/* Clients Usage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-500 font-sans">Active Clients Registered</span>
                  <span className="font-mono font-bold text-slate-800">
                    {clientsCount} of {limitObj.clients === 999 ? "Unlimited" : `${limitObj.clients} clients`} used
                  </span>
                </div>
                {limitObj.clients < 999 ? (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${clientsCount >= limitObj.clients ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (clientsCount / limitObj.clients) * 100)}%` }}
                    />
                  </div>
                ) : (
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-emerald-550 bg-emerald-500" style={{ width: "100%" }} />
                  </div>
                )}
                <p className="text-[10px] text-slate-400">Total active client accounts permitted on this plan.</p>
              </div>
            </div>
          </div>

          {/* Subscription management and Cancellation panel */}
          {plan !== "free" && (
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="p-1 px-2.5 bg-indigo-600 rounded-lg text-[9px] font-bold font-mono uppercase tracking-widest text-white leading-none">
                    Premium Active
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    Enterprise Workspace Tier
                  </span>
                </div>
                <h4 className="text-base font-bold font-display tracking-tight leading-normal pt-1 text-white">
                  Congratulations! Your premium consulting plan is fully operational.
                </h4>
                <p className="text-xs text-slate-400 leading-normal max-w-xl">
                  Configure white-labels, embed tracker plugins, and manage unlimited workspaces securely. Cancel anytime.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={saving}
                className="px-5 py-2.5 bg-red-650 hover:bg-red-700 hover:shadow-md text-white font-bold text-xs rounded-xl shrink-0 transition-all border border-red-500/20 cursor-pointer text-center self-stretch md:self-auto"
              >
                {saving ? "Processing Request..." : "Cancel Active Plan"}
              </button>
            </div>
          )}

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4 mb-6">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                billingCycle === "monthly"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200/50"
              }`}
            >
              Monthly Billing
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("lifetime")}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer relative ${
                billingCycle === "lifetime"
                  ? "bg-indigo-655 text-white shadow-sm"
                  : "bg-slate-100 text-indigo-600 border border-slate-200 hover:bg-slate-200/50"
              }`}
            >
              Lifetime Access (Save 90%)
              <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold animate-bounce">
                Hot
              </span>
            </button>
          </div>

          {/* Pricing Grid options */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2 items-stretch">
            {[
              {
                id: "free" as const,
                title: "Free Plan",
                price: "$0",
                period: "forever",
                limitLabel: "Basic consulting features",
                features: [
                  "3 reports per month",
                  "2 active clients",
                  "Manual notes input",
                  "Upload document to generate report",
                  "Shareable public report link",
                  "Basic agency name on reports",
                  "AI Support Chat",
                  "Report filtering and sorting"
                ],
              },
              {
                id: "starter" as const,
                title: billingCycle === "lifetime" ? "Starter Lifetime" : "Starter Plan",
                price: billingCycle === "lifetime" ? "$49" : "$29",
                period: billingCycle === "lifetime" ? "one-time payment" : "per month",
                limitLabel: billingCycle === "lifetime" ? "Lifetime access for freelancers" : "Perfect for freelancers",
                features: [
                  "20 reports per month",
                  "10 active clients",
                  "Everything in Free plus:",
                  "Custom brand logo on all reports",
                  "Image, document & link attachments",
                  "Different report tones & lengths",
                  "AI powered section writer"
                ],
              },
              {
                id: "pro" as const,
                title: billingCycle === "lifetime" ? "Pro Lifetime" : "Pro Plan",
                price: billingCycle === "lifetime" ? "$99" : "$79",
                period: billingCycle === "lifetime" ? "one-time payment" : "per month",
                limitLabel: billingCycle === "lifetime" ? "Lifetime access for agencies" : "For scaling agencies",
                features: [
                  "Unlimited reports",
                  "Unlimited clients",
                  "Everything in Starter plus:",
                  "White label — zero ReportIQ branding",
                  "Report analytics & view logs",
                  "Client feedback log viewer",
                  "Priority 24h support"
                ],
                featured: true, // Pro plan card stands out
                badgeText: billingCycle === "lifetime" ? "Highly Recommended" : "Best Value"
              },
              {
                id: "arbitrage" as const,
                title: "Arbitrage Plan",
                price: "$149",
                period: "per month",
                limitLabel: "For B2B multi-agency resellers (monthly only)",
                features: [
                  "Unlimited reports & clients",
                  "Everything in Pro plus:",
                  "Full B2B Arbitrage Mode",
                  "AI Tools Brand Switcher",
                  "Unlimited Sub-Agencies",
                  "Manage End-Clients roster",
                  "Dedicated arbitrage account"
                ],
                featured: false,
                badgeText: "Arbitrage Mode"
              },
            ].map(planCard => {
              const active = plan === planCard.id;
              return (
                <div
                  key={planCard.id}
                  className={`border rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative ${
                    planCard.featured
                      ? "bg-slate-900 text-white border-indigo-500 shadow-xl scale-105 min-h-[460px] z-10"
                      : "bg-white text-slate-700 border-slate-200 shadow-2xs hover:shadow-md min-h-[420px]"
                  }`}
                >
                  {planCard.badgeText && (
                    <div className="absolute -top-3.5 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-mono leading-none tracking-widest uppercase font-bold px-3 py-1.5 rounded-full shadow-sm">
                      {planCard.badgeText}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className={`font-bold font-display text-base ${planCard.featured ? "text-white" : "text-slate-950"}`}>{planCard.title}</h4>
                      {active && (
                        <span className="flex items-center gap-0.5 text-indigo-600 text-[10px] font-mono font-bold leading-none bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <p className={`text-[10px] font-mono mt-1 ${planCard.featured ? "text-indigo-300" : "text-slate-400"}`}>{planCard.limitLabel}</p>

                    <div className="my-5 flex items-baseline gap-1">
                      <span className={`text-3xl font-extrabold font-display ${planCard.featured ? "text-white" : "text-slate-950"}`}>{planCard.price}</span>
                      <span className={`text-xs font-mono ${planCard.featured ? "text-slate-400" : "text-slate-500"}`}>/ {planCard.period}</span>
                    </div>

                    <ul className={`space-y-2 text-xs font-sans border-t pt-4 ${planCard.featured ? "border-slate-800" : "border-slate-100"}`}>
                      {planCard.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className={`w-4 h-4 shrink-0 mt-0.5 ${planCard.featured ? "text-indigo-400" : "text-emerald-500"}`} />
                          <span className={planCard.featured ? "text-slate-350" : "text-slate-605"}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-6 font-sans">
                    {active ? (
                      <div className={`w-full text-center py-2 border text-xs font-semibold rounded-xl cursor-default flex items-center justify-center gap-1.5 leading-none ${planCard.featured ? "bg-slate-800 border-slate-700 text-slate-350" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
                        <Award className="w-4 h-4 text-indigo-500" />
                        Current Active Plan
                      </div>
                    ) : (
                      <button
                        onClick={() => handleUpgradePlan(planCard.id)}
                        className={`w-full py-2 font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer ${planCard.featured ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-indigo-50 hover:bg-indigo-100 text-indigo-750 font-bold"}`}
                      >
                        {planCard.id === "free" ? "Downgrade to Free" : `Upgrade to ${planCard.title}`}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>


        </div>
      )}

      {/* State-controlled Custom Cancellation Confirmation Modal (avoids iframe confirm blockers) */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-100 max-w-sm w-full p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4 text-red-605">
              <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-base font-bold text-slate-950 font-display">
                Confirm Plan Cancellation
              </h3>
            </div>
                        <p className="text-xs text-slate-600 leading-relaxed mb-6 font-sans">
              Are you sure you want to cancel your active Premium workspace subscription? This will immediately downgrade your monthly quota of report generation and active client registrations back to the standard limits of the Free Plan.
            </p>

            <div className="flex items-center justify-end gap-3 font-sans">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold font-mono uppercase bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer border border-slate-200/50"
              >
                Keep Premium
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    setSaving(true);
                    setError(null);
                    
                    // Write to database
                    await supabaseDb.updateProfile(userId, {
                      plan: "free" as const,
                    });
                    
                    setShowCancelModal(false);
                    onRefresh();
                  } catch (err: any) {
                    console.error("Cancellation operation failed:", err);
                    setError(err?.message || "Failed to downgrade account tier. Please try again.");
                    setShowCancelModal(false); // Make sure modal closes so they can read the error banner on Settings page
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold font-mono uppercase rounded-xl transition-all cursor-pointer shadow-sm hover:shadow-md flex items-center justify-center min-w-[130px]"
              >
                {saving ? "Processing..." : "Confirm Downgrade"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
