import React, { useState } from "react";
import { supabaseDb, supabase } from "../lib/supabase";
import { Client, Profile, PLAN_LIMITS } from "../types";
import { Users, Plus, ShieldAlert, CheckCircle2, X, Building2, Mail, FileText, Pencil, Trash2, Globe } from "lucide-react";

interface ClientsProps {
  userId: string;
  clients: Client[];
  profile: Profile | null;
  reportsCountByClient: Record<string, number>;
  onRefresh: () => void;
  onUpgrade: (targetPlan: "starter" | "pro") => void;
}

export default function Clients({ userId, clients, profile, reportsCountByClient, onRefresh, onUpgrade }: ClientsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit states
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editName, setEditName] = useState("");
  const [editCompany, setEditCompany] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editLogoUrl, setEditLogoUrl] = useState("");
  const [editBrandColor, setEditBrandColor] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Edit states for sub-clients
  const [editSubClients, setEditSubClients] = useState<{ id: string; name: string; company: string; email: string }[]>([]);
  const [newSubName, setNewSubName] = useState("");
  const [newSubCompany, setNewSubCompany] = useState("");
  const [newSubEmail, setNewSubEmail] = useState("");

  // Deletion confirmation custom state
  const [deleteConfirmClientId, setDeleteConfirmClientId] = useState<string | null>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [editUploadingLogo, setEditUploadingLogo] = useState(false);

  const handleClientLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const setUploading = isEdit ? setEditUploadingLogo : setUploadingLogo;
    const setUrl = isEdit ? setEditLogoUrl : setLogoUrl;
    const bucket = 'logos';

    try {
      setUploading(true);
      if (isEdit) setEditError(null); else setError(null);

      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_client_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, { cacheControl: '3600', upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      setUrl(publicUrl);
    } catch (err: any) {
      console.error("Failed to upload client logo:", err);
      const errMsg = `Failed to upload image: ${err.message || 'Error occurred.'}`;
      if (isEdit) setEditError(errMsg); else setError(errMsg);
    } finally {
      setUploading(false);
    }
  };

  const plan = profile?.plan || "free";
  const limitObj = PLAN_LIMITS[plan];
  const clientLimit = limitObj.clients;
  const currentCount = clients.length;
  const isLimitReached = currentCount >= clientLimit;

  const handleStartEdit = (clientObj: Client) => {
    setEditingClient(clientObj);
    setEditName(clientObj.name);
    setEditCompany(clientObj.company || "");
    setEditEmail(clientObj.email || "");
    setEditLogoUrl(clientObj.logoUrl || "");
    
    // Parse notes to extract text notes, brandColor, and subClients
    let parsedNotesText = "";
    let parsedBrandColor = "";
    let parsedSubClients: any[] = [];
    try {
      const parsed = JSON.parse(clientObj.notes || "{}");
      if (parsed && typeof parsed === "object") {
        parsedNotesText = parsed.text || "";
        parsedBrandColor = parsed.brandColor || "";
        parsedSubClients = parsed.subClients || [];
      } else {
        parsedNotesText = clientObj.notes || "";
      }
    } catch (e) {
      parsedNotesText = clientObj.notes || "";
    }
    setEditNotes(parsedNotesText);
    setEditBrandColor(parsedBrandColor);
    setEditSubClients(parsedSubClients);
    setNewSubName("");
    setNewSubCompany("");
    setNewSubEmail("");
    setEditError(null);
  };

  const handleEditClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editingClient) return;
    if (!editName.trim()) {
      setEditError("Client name is required.");
      return;
    }

    try {
      setEditSubmitting(true);
      
      const serializedNotes = JSON.stringify({
        text: editNotes.trim(),
        brandColor: editBrandColor.trim(),
        subClients: editSubClients
      });

      await supabaseDb.updateClient(editingClient.id, userId, {
        name: editName.trim(),
        company: editCompany.trim() || null,
        email: editEmail.trim().toLowerCase() || null,
        logoUrl: editLogoUrl.trim() || null,
        notes: serializedNotes,
      });
      setEditingClient(null);
      onRefresh();
    } catch (err: any) {
      console.error("Failed to update client info:", err);
      setEditError(err?.message || "Internal database update failure.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteClient = (clientId: string) => {
    setDeleteConfirmClientId(clientId);
    setDeleteError(null);
  };

  const handleConfirmDeleteClient = async () => {
    if (!deleteConfirmClientId) return;
    try {
      setDeleteSubmitting(true);
      setDeleteError(null);
      await supabaseDb.deleteClient(deleteConfirmClientId, userId);
      onRefresh();
      setDeleteConfirmClientId(null);
    } catch (err: any) {
      console.error("Failed to delete client:", err);
      setDeleteError(err?.message || "Failed to delete client. There might be a database relation or foreign key conflict.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    if (plan === "free" && clients.length >= 2) {
      setError("You have reached your 2 client limit on the Free plan. Upgrade to Starter for up to 10 clients.");
      return;
    } else if (plan === "starter" && clients.length >= 10) {
      setError("You have reached your 10 client limit on the Starter plan. Upgrade to Pro for unlimited clients.");
      return;
    }

    try {
      setSubmitting(true);

      const serializedNotes = JSON.stringify({
        text: notes.trim(),
        brandColor: brandColor.trim(),
        subClients: []
      });
      
      await supabaseDb.addClient(userId, {
        name: name.trim(),
        company: company.trim() || null,
        email: email.trim().toLowerCase() || null,
        logoUrl: logoUrl.trim() || null,
        notes: serializedNotes,
      });

      // Reset state and refresh
      setName("");
      setCompany("");
      setEmail("");
      setLogoUrl("");
      setBrandColor("");
      setNotes("");
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      console.error("Failed to add client document:", err);
      setError(err?.message || "Internal database insertion transaction failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header and trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-950">
            Clients directory
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your customer accounts ({currentCount} registered / {clientLimit === 999 ? "∞" : clientLimit} allowance)
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setError(null);
              setShowAddModal(true);
            }}
            className="flex items-center gap-2 px-4.5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 hover:shadow-md rounded-xl transition-all font-sans cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add New Client
          </button>
        </div>
      </div>

      {/* Plan limit alert banner if limit reached */}
      {isLimitReached && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Current Plan Client Allowance Exceeded</h4>
            <p className="text-xs text-amber-700 mt-1">
              You've registered {currentCount} of {clientLimit} clients. To add more client partnerships or scale operations, navigate to Settings and choose an upgraded tier context.
            </p>
          </div>
        </div>
      )}

      {/* Grid of client cards */}
      {clients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map(clientObj => {
            const reportsCount = reportsCountByClient[clientObj.id] || 0;
            return (
              <div
                key={clientObj.id}
                className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-md rounded-2xl p-6 transition-all group flex flex-col justify-between min-h-[225px] h-auto shadow-2xs"
              >
                <div>
                  <div className="flex items-start justify-between">
                    {clientObj.logoUrl ? (
                      <img 
                        src={clientObj.logoUrl} 
                        alt={clientObj.name} 
                        className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1 shrink-0 animate-fade-in" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold font-display text-sm shrink-0">
                        {clientObj.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    
                    {(() => {
                      let parsedColor = "";
                      try {
                        const parsed = JSON.parse(clientObj.notes || "{}");
                        if (parsed && typeof parsed === "object" && parsed.brandColor) {
                          parsedColor = parsed.brandColor;
                        }
                      } catch(e) {}
                      
                      return parsedColor ? (
                        <div className="flex items-center gap-1.5">
                          <span style={{ backgroundColor: parsedColor }} className="w-2.5 h-2.5 rounded-full inline-block border border-slate-200 shrink-0" title={`Brand color: ${parsedColor}`} />
                          <span className="inline-flex px-2 py-0.5 text-[10px] font-mono leading-none bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 font-semibold">
                            {reportsCount} reports
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 text-[10px] font-mono leading-none bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                          {reportsCount} reports
                        </span>
                      );
                    })()}
                  </div>

                  <h3 className="text-base font-bold font-display text-slate-950 mt-4 group-hover:text-indigo-600 transition-colors">
                    {clientObj.name}
                  </h3>

                  <div className="space-y-1.5 mt-3 text-slate-500 text-xs">
                    {clientObj.company && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{clientObj.company}</span>
                      </div>
                    )}
                    {clientObj.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{clientObj.email}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono text-[10px] text-slate-400">Registered: {new Date(clientObj.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const portalUrl = `${window.location.protocol}//${window.location.host}/portal/${clientObj.id}`;
                        navigator.clipboard.writeText(portalUrl);
                        alert("Client Portal Link copied to clipboard:\n" + portalUrl);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-800 transition-all cursor-pointer border border-slate-200"
                      title="Copy branded client portal link"
                    >
                      <Globe className="w-3.5 h-3.5 text-indigo-650 shrink-0" />
                      <span>Portal Link</span>
                    </button>
                    <button
                      onClick={() => handleStartEdit(clientObj)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 transition-all cursor-pointer border border-indigo-200"
                      title="Edit client info"
                    >
                      <Pencil className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDeleteClient(clientObj.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-red-50 hover:bg-red-105 text-red-700 hover:text-red-800 transition-all cursor-pointer border border-red-200"
                      title="Delete client"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl py-16 px-6 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 shadow-2xs">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-950">No Clients Found</h3>
          <p className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto">
            Get started by adding your first client. It only takes a second and lets you create beautiful AI-written reports.
          </p>
          <button
            onClick={() => {
              setError(null);
              setShowAddModal(true);
            }}
            className="mt-5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Create first client &rarr;
          </button>
        </div>
      )}

      {/* modal block overlay form popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 animate-fade-in backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display text-slate-950 mb-1">Add Customer Account</h3>
            <p className="text-xs text-slate-500 mb-5">Create a record in client directory database</p>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium flex flex-col gap-2">
                <div className="flex gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {(error.includes("limit on the Free plan") || error.includes("limit on the Starter plan")) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (plan === "free") {
                        onUpgrade("starter");
                      } else {
                        onUpgrade("pro");
                      }
                    }}
                    className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all text-center self-start shrink-0 cursor-pointer"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            )}

            <form onSubmit={handleAddClient} className="space-y-4 font-sans text-sm">
              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Smith"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Company / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smith Consulting"
                  value={company}
                  onChange={e => setCompany(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. contact@smithconsulting.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Client Logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center relative shrink-0 overflow-hidden shadow-3xs p-1">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Client Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xl">🏢</span>
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
                      id="client-logo-add-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleClientLogoUpload(e, false)}
                    />
                    <label
                      htmlFor="client-logo-add-input"
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs transition-all"
                    >
                      {uploadingLogo ? "Uploading..." : "Choose Logo File"}
                    </label>
                    <p className="text-[9px] text-slate-405">Or paste direct logo URL below:</p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="e.g. https://domain.com/logo.png"
                  value={logoUrl}
                  onChange={e => setLogoUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 bg-slate-50/50 mt-2 text-xs font-sans"
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Client Brand Color Accent
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandColor || "#6366f1"}
                    onChange={e => setBrandColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 shrink-0"
                  />
                  <input
                    type="text"
                    placeholder="e.g. #6366f1"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes / Context
                </label>
                <textarea
                  placeholder="e.g. High touch client, expects monthly metrics reviews"
                  rows={3}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    "Save Client"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit client modal overlay popup */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 animate-fade-in backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto shadow-xl relative animate-scale-up">
            <button
              onClick={() => setEditingClient(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold font-display text-slate-950 mb-1">Edit Client Details</h3>
            <p className="text-xs text-slate-500 mb-5">Update specific fields for this client record</p>

            {editError && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium flex gap-2 border-l-4">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditClientSubmit} className="space-y-4 font-sans text-sm">
              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Client Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Smith"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Company / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Smith Consulting"
                  value={editCompany}
                  onChange={e => setEditCompany(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Contact Email
                </label>
                <input
                  type="email"
                  placeholder="e.g. contact@smithconsulting.com"
                  value={editEmail}
                  onChange={e => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Client Logo
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-20 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center relative shrink-0 overflow-hidden shadow-3xs p-1">
                    {editLogoUrl ? (
                      <img src={editLogoUrl} alt="Client Logo Preview" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-xl">🏢</span>
                    )}
                    {editUploadingLogo && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-white rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <input
                      type="file"
                      id="client-logo-edit-input"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleClientLogoUpload(e, true)}
                    />
                    <label
                      htmlFor="client-logo-edit-input"
                      className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-[10px] font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-3xs transition-all"
                    >
                      {editUploadingLogo ? "Uploading..." : "Choose Logo File"}
                    </label>
                    <p className="text-[9px] text-slate-405">Or paste direct logo URL below:</p>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="e.g. https://domain.com/logo.png"
                  value={editLogoUrl}
                  onChange={e => setEditLogoUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-100 bg-slate-50/50 mt-2 text-xs font-sans"
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Client Brand Color Accent
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editBrandColor || "#6366f1"}
                    onChange={e => setEditBrandColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200 shrink-0"
                  />
                  <input
                    type="text"
                    placeholder="e.g. #6366f1"
                    value={editBrandColor}
                    onChange={e => setEditBrandColor(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  Notes / Context
                </label>
                <textarea
                  placeholder="e.g. High touch client, expects monthly metrics reviews"
                  rows={3}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 resize-none"
                  maxLength={1000}
                />
              </div>

              {/* Sub-Clients (End-Clients) Manager Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                  <span className="font-bold text-slate-800 text-xs">Sub-Clients (End-Clients)</span>
                  <span className="text-[9px] font-mono bg-indigo-50 text-indigo-650 px-1.5 py-0.5 rounded border border-indigo-100 uppercase font-bold">
                    Arbitrage Mode
                  </span>
                </div>

                {/* Sub-Clients List */}
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {editSubClients.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic text-left">No sub-clients added yet. Add one below.</p>
                  ) : (
                    editSubClients.map((sub, idx) => (
                      <div key={sub.id || idx} className="flex items-center justify-between bg-white border border-slate-200 p-2 rounded-xl text-xs gap-3 text-left">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-800 truncate">{sub.name}</p>
                          <p className="text-[10px] text-slate-450 truncate">
                            {sub.company && `${sub.company} · `}{sub.email || "No email"}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditSubClients(editSubClients.filter(item => item.id !== sub.id))}
                          className="text-slate-400 hover:text-red-650 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-450 hover:text-red-600" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Sub-Client fields */}
                <div className="border-t border-slate-200 pt-3 space-y-2 text-left">
                  <span className="text-[10px] font-bold font-mono text-slate-500 uppercase block">Add New End-Client</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Name *"
                      value={newSubName}
                      onChange={e => setNewSubName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white outline-none p-1.5 text-xs focus:border-indigo-650"
                    />
                    <input
                      type="text"
                      placeholder="Company"
                      value={newSubCompany}
                      onChange={e => setNewSubCompany(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-white outline-none p-1.5 text-xs focus:border-indigo-650"
                    />
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      placeholder="Contact Email"
                      value={newSubEmail}
                      onChange={e => setNewSubEmail(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 bg-white outline-none p-1.5 text-xs focus:border-indigo-650"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newSubName.trim()) return;
                        setEditSubClients([
                          ...editSubClients,
                          {
                            id: Date.now().toString(),
                            name: newSubName.trim(),
                            company: newSubCompany.trim() || null,
                            email: newSubEmail.trim().toLowerCase() || null
                          } as any
                        ]);
                        setNewSubName("");
                        setNewSubCompany("");
                        setNewSubEmail("");
                      }}
                      className="px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer select-none"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans cursor-pointer text-center text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-all flex items-center justify-center gap-1 cursor-pointer text-xs font-medium"
                >
                  {editSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {deleteConfirmClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 animate-fade-in backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up text-sm font-sans">
            <button
              onClick={() => setDeleteConfirmClientId(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-start gap-3.5 mb-2 text-left">
              <div className="p-3 bg-red-50 border border-red-100 rounded-2xl text-red-600 shrink-0">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold font-display text-slate-950">
                  Delete Client Record?
                </h3>
                <p className="text-slate-500 text-xs mt-1 leading-normal">
                  Are you absolutely sure you want to permanently delete this client? 
                  Any reports linked to this client ID will remain saved in your database history, 
                  but the primary client reference record itself will be unlinked and removed. This action is irreversible.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="my-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 text-left">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5 animate-bounce" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="pt-5 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmClientId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-605 font-semibold cursor-pointer text-center text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteClient}
                disabled={deleteSubmitting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
              >
                {deleteSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Deleting...
                  </>
                ) : (
                  "Delete Client"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
