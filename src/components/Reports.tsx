import React, { useState, useEffect } from "react";
import { supabaseDb, supabase, getAuthHeaders } from "../lib/supabase";
import { Report, Client, Profile, ReportSection, PLAN_LIMITS, ReportAttachment } from "../types";
import { FileText, Lock, ClipboardList, Plus, Sparkles, Trash2, Check, Copy, ExternalLink, Calendar, Users, List, Send, ShieldAlert, ArrowLeft, PlusCircle, Pencil, Save, Mail, Share2, X, Download, Printer, Paperclip, Image, Link, Globe, Building2, Award } from "lucide-react";

function getDomainName(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch (e) {
    return url;
  }
}

function getShareUrl(profile: Profile | null, slug: string) {
  const host = `${window.location.protocol}//${window.location.host}`;
  if (profile?.plan === "pro" || profile?.plan === "arbitrage") {
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
    return `${host}/a/${agencySlug}/r/${slug}`;
  }
  return `${host}/r/${slug}`;
}

interface ReportsProps {
  userId: string;
  reports: Report[];
  clients: Client[];
  profile: Profile | null;
  activeReportId: string | null;
  onSelectReportId: (id: string | null) => void;
  onRefresh: () => void;
  onNavigate: (tab: string) => void;
  showLock: (feature: string, plan: "Starter" | "Pro", price: string) => void;
  onUpgrade: (targetPlan: "starter" | "pro" | "arbitrage") => void;
}

export default function Reports({
  userId,
  reports,
  clients,
  profile,
  activeReportId,
  onSelectReportId,
  onRefresh,
  onNavigate,
  showLock,
  onUpgrade,
}: ReportsProps) {
  const [showGenModal, setShowGenModal] = useState(false);
  const [clientId, setClientId] = useState("");
  const [isArbitrageMode, setIsArbitrageMode] = useState(false);
  const [subClientId, setSubClientId] = useState("");
  const [availableSubClients, setAvailableSubClients] = useState<{ id: string; name: string; company: string; email: string }[]>([]);
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [reportLength, setReportLength] = useState<"short" | "medium" | "detailed">("medium");

  // Document Mode states
  const [reportMode, setReportMode] = useState<"manual" | "document">("manual");
  const [extractedText, setExtractedText] = useState("");
  const [extractedFileName, setExtractedFileName] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtractedCollapsed, setIsExtractedCollapsed] = useState(false);

  // Quick custom metrics state
  const [metricLabel, setMetricLabel] = useState("");
  const [metricValue, setMetricValue] = useState("");
  const [customMetrics, setCustomMetrics] = useState<{ label: string; value: string }[]>([]);

  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tone config
  const [reportTone, setReportTone] = useState<"Formal & Corporate" | "Friendly & Conversational" | "Bold & Confident" | "Minimal & Direct">("Formal & Corporate");
  const [editReportTone, setEditReportTone] = useState<string>("Formal & Corporate");

  // Single Section Generator Form states
  const [showAddSectionForm, setShowAddSectionForm] = useState(false);
  const [newSectionTopic, setNewSectionTopic] = useState("");
  const [newSectionTone, setNewSectionTone] = useState<"Professional" | "Casual" | "Technical" | "Formal">("Professional");
  const [generatingSection, setGeneratingSection] = useState(false);
  const [generatingSectionError, setGeneratingSectionError] = useState<string | null>(null);

  // Attachments Config
  const [editReportAttachments, setEditReportAttachments] = useState<ReportAttachment[]>([]);
  const [attachmentType, setAttachmentType] = useState<'image' | 'link' | 'doc' | 'preview' | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [docUploading, setDocUploading] = useState(false);
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  // Edit states
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const [editReportTitle, setEditReportTitle] = useState("");
  const [editReportAiSummary, setEditReportAiSummary] = useState("");
  const [editReportCustomMessage, setEditReportCustomMessage] = useState("");
  const [editReportSections, setEditReportSections] = useState<ReportSection[]>([]);
  const [saveReportSubmitting, setSaveReportSubmitting] = useState(false);
  const [saveReportError, setSaveReportError] = useState<string | null>(null);

  // Sharing Modal
  const [sharingReport, setSharingReport] = useState<Report | null>(null);
  const [emailCopied, setEmailCopied] = useState(false);

  // Deletion confirmation custom state
  const [deleteConfirmReportId, setDeleteConfirmReportId] = useState<string | null>(null);
  const [deleteReportSubmitting, setDeleteReportSubmitting] = useState(false);
  const [deleteReportError, setDeleteReportError] = useState<string | null>(null);

  // Outbound Direct Email sending states and selectors

  // Filtering & Sorting states
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClient, setFilterClient] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "title_asc" | "title_desc" | "views_desc">("date_desc");

  // Client Feedback states
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  useEffect(() => {
    if (!clientId) {
      setAvailableSubClients([]);
      setSubClientId("");
      return;
    }
    const selectedParent = clients.find(c => c.id === clientId);
    if (selectedParent) {
      try {
        const parsed = JSON.parse(selectedParent.notes || "{}");
        if (parsed && typeof parsed === "object" && Array.isArray(parsed.subClients)) {
          setAvailableSubClients(parsed.subClients);
        } else {
          setAvailableSubClients([]);
        }
      } catch (e) {
        setAvailableSubClients([]);
      }
    } else {
      setAvailableSubClients([]);
    }
    setSubClientId("");
  }, [clientId, clients]);

  useEffect(() => {
    async function fetchFeedback() {
      if (!activeReportId) {
        setFeedbacks([]);
        return;
      }
      try {
        setLoadingFeedbacks(true);
        const { data, error } = await supabase
          .from("report_feedback")
          .select("*")
          .eq("report_id", activeReportId)
          .order("submitted_at", { ascending: false });
        if (error) {
          console.error("Error fetching report feedbacks:", error);
        } else {
          setFeedbacks(data || []);
        }
      } catch (err) {
        console.error("Failed to load feedbacks:", err);
      } finally {
        setLoadingFeedbacks(false);
      }
    }
    fetchFeedback();
  }, [activeReportId]);

  const selectedReport = reports.find(r => r.id === activeReportId);



  // Check usage limits
  const plan = profile?.plan || "free";
  const limitObj = PLAN_LIMITS[plan];
  const reportsGeneratedThisMonth = profile?.reportsGeneratedThisMonth || 0;
  const isLimitReached = reportsGeneratedThisMonth >= limitObj.reports;

  const handleStartEditReport = (reportObj: Report) => {
    setEditingReport(reportObj);
    setEditReportTitle(reportObj.title);
    setEditReportAiSummary(reportObj.aiSummary || "");
    setEditReportCustomMessage(reportObj.customMessage || "");
    setEditReportSections([...(reportObj.sections || [])]);
    setEditReportTone(reportObj.tone || "Formal & Corporate");
    setEditReportAttachments(reportObj.attachments || []);
    setSaveReportError(null);
    setShowAddSectionForm(false);
    setNewSectionTopic("");
    setAttachmentType(null);
  };

  const handleSaveReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReport) return;
    setSaveReportError(null);
    try {
      setSaveReportSubmitting(true);
      const updatedReport = await supabaseDb.updateReport(editingReport.id, userId, {
        title: editReportTitle.trim(),
        aiSummary: editReportAiSummary.trim() || null,
        customMessage: editReportCustomMessage.trim() || null,
        sections: editReportSections,
        tone: editReportTone,
        attachments: editReportAttachments,
      });
      setEditingReport(null);
      // Synchronize selection and trigger reload
      onRefresh();
    } catch (err: any) {
      console.error("Failed to update report:", err);
      setSaveReportError(err?.message || "Internal database update error during saving.");
    } finally {
      setSaveReportSubmitting(false);
    }
  };

  const updateSectionTitle = (idx: number, title: string) => {
    const list = [...editReportSections];
    list[idx].title = title;
    setEditReportSections(list);
  };

  const updateSectionContent = (idx: number, content: string) => {
    const list = [...editReportSections];
    list[idx].content = content;
    setEditReportSections(list);
  };

  const removeSection = (idx: number) => {
    setEditReportSections(editReportSections.filter((_, i) => i !== idx));
  };

  const addBlankSection = () => {
    setEditReportSections([...editReportSections, { title: "New Section Key Milestone", content: "", type: "completed" }]);
  };

  const currentCount = clients.length;

  const filteredReports = reports.filter(r => {
    const statusMatch = filterStatus === "all" || r.status === filterStatus;
    const clientMatch = filterClient === "all" || r.clientId === filterClient;
    return statusMatch && clientMatch;
  }).sort((a, b) => {
    if (sortBy === "date_desc") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === "date_asc") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === "title_asc") {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === "title_desc") {
      return b.title.localeCompare(a.title);
    }
    if (sortBy === "views_desc") {
      return (b.viewCount || 0) - (a.viewCount || 0);
    }
    return 0;
  });

  const addMetricTag = () => {
    if (metricLabel.trim() && metricValue.trim()) {
      setCustomMetrics([...customMetrics, { label: metricLabel.trim(), value: metricValue.trim() }]);
      setMetricLabel("");
      setMetricValue("");
    }
  };

  const removeMetricTag = (idx: number) => {
    setCustomMetrics(customMetrics.filter((_, i) => i !== idx));
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      setError("Please select a target client.");
      return;
    }
    if (!periodStart || !periodEnd) {
      setError("Please pick both start and end timeframe dates.");
      return;
    }

    if (plan === "free" && reportsGeneratedThisMonth >= 3) {
      try {
        localStorage.setItem("reportiq_device_limit_reached", "true");
      } catch (e) {
        console.warn("LocalStorage access failed:", e);
      }
      setError("You have reached your 3 report limit this month on the Free plan. Upgrade to Starter for 20 reports per month.");
      return;
    } else if (plan === "starter" && reportsGeneratedThisMonth >= 20) {
      setError("You have reached your 20 report limit this month. Upgrade to Pro for unlimited reports.");
      return;
    }

    const matchedClient = clients.find(c => c.id === clientId);
    if (!matchedClient) {
      setError("Selected client does not exist.");
      return;
    }

    const matchedSubClient = availableSubClients.find(s => s.id === subClientId);
    const targetClientName = (isArbitrageMode && matchedSubClient) ? matchedSubClient.name : matchedClient.name;

    if (reportMode === "document" && !extractedText.trim()) {
      setError("Please select and upload a valid document first, or write notes manually.");
      return;
    }

    try {
      setGenerating(true);

      const authHeaders = await getAuthHeaders();
      // Call Express server-side Groq API proxy route (keeps key hidden!)
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify({
          clientName: targetClientName,
          agencyName: profile?.agencyName || "Smith Digital",
          periodStart,
          periodEnd,
          manualNotes: reportMode === "document" ? extractedText : manualNotes,
          customMetrics,
          length: reportLength,
          tone: reportTone,
          isDocumentMode: reportMode === "document",
        }),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || "Server report proxy generation failed.");
      }

      const generatedData = await response.json();

      // Create secure client-side document write in Supabase
      const simpleSlug = Math.random().toString(36).substring(2, 9) + "-" + Date.now().toString(36).substring(4);
      const titleToSave = reportTitle.trim() || `${targetClientName} — Progress Update (${periodStart})`;

      const savedReport = await supabaseDb.addReport(userId, {
        clientId,
        title: titleToSave,
        periodStart,
        periodEnd,
        status: "ready" as const,
        slug: simpleSlug,
        aiSummary: generatedData.summary || "Summary generation completed.",
        rawData: { 
          manualNotes: reportMode === "document" ? extractedText : manualNotes, 
          customMetrics,
          isDocumentMode: reportMode === "document",
          documentName: reportMode === "document" ? extractedFileName : null,
          isArbitrage: isArbitrageMode,
          subClientName: targetClientName,
        },
        sections: (generatedData.sections || []).map((sec: any) => ({
          title: sec.title,
          content: sec.content,
          type: sec.type || "completed",
        })) as ReportSection[],
        customMessage: customMessage.trim() || null,
        tone: reportTone,
        attachments: [],
      });

      // Successfully increment usage in profile
      await supabaseDb.updateProfile(userId, {
        reportsGeneratedThisMonth: reportsGeneratedThisMonth + 1,
      });

      // Clear generation state inputs
      setClientId("");
      setIsArbitrageMode(false);
      setSubClientId("");
      setPeriodStart("");
      setPeriodEnd("");
      setReportTitle("");
      setManualNotes("");
      setCustomMessage("");
      setCustomMetrics([]);
      setReportLength("medium");
      setReportMode("manual");
      setExtractedText("");
      setExtractedFileName("");
      setIsExtracting(false);
      setIsExtractedCollapsed(false);
      setShowGenModal(false);

      // Sync and show the preview on library selection
      onRefresh();
      onSelectReportId(savedReport.id);
    } catch (err: any) {
      console.error("Failed to generate and save report document:", err);
      setError(err?.message || "AI summary layout could not compile.");
    } finally {
      setGenerating(false);
    }
  };

  const updateReportStatus = async (reportId: string, nextStatus: "sent") => {
    try {
      const updatedReport = await supabaseDb.updateReport(reportId, userId, { status: nextStatus });
      onRefresh();
    } catch (err: any) {
      console.error("Status update database transaction failed:", err);
    }
  };

  const deleteReportDocument = (reportId: string) => {
    setDeleteConfirmReportId(reportId);
    setDeleteReportError(null);
  };

  const handleConfirmDeleteReport = async () => {
    if (!deleteConfirmReportId) return;
    try {
      setDeleteReportSubmitting(true);
      setDeleteReportError(null);
      await supabaseDb.deleteReport(deleteConfirmReportId, userId);
      onSelectReportId(null);
      onRefresh();
      setDeleteConfirmReportId(null);
    } catch (err: any) {
      console.error("Database deletion operation failed:", err);
      setDeleteReportError(err?.message || "Failed to delete report. There might be a database lock or permission issue.");
    } finally {
      setDeleteReportSubmitting(false);
    }
  };

  const copyShareLink = async (slug: string, reportId: string) => {
    try {
      const url = getShareUrl(profile, slug);
      await navigator.clipboard.writeText(url);
      setCopiedId(reportId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Clip capture failed:", err);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "ready":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase tracking-wider font-mono">
            Ready
          </span>
        );
      case "sent":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 border border-indigo-200 uppercase tracking-wider font-mono">
            Sent
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wider font-mono">
            Draft
          </span>
        );
    }
  };

  const downloadReportAsHtml = (reportObj: Report) => {
    const agencyName = profile?.agencyName || "Smith Digital";
    const brandColor = profile?.brandColor || "#6366f1";
    const parentClient = clients.find(c => c.id === reportObj.clientId);
    const clientName = parentClient?.name || "Client Partner";

    const sectionsHtml = (reportObj.sections || []).map((section, idx) => `
      <div class="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs" style="margin-bottom: 1.5rem;">
        <div class="flex items-center gap-3 mb-4" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background-color: ${brandColor}15; width: 2rem; height: 2rem; border-radius: 0.5rem; display: flex; align-items: center; justify-center; flex-shrink: 0;">
            <span style="color: ${brandColor}; font-weight: bold; font-family: monospace;">✓</span>
          </div>
          <h2 class="text-lg font-bold font-display text-slate-950" style="font-size: 1.125rem; font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: #020617; margin: 0;">${section.title}</h2>
        </div>
        <p class="text-slate-700 leading-relaxed text-base whitespace-pre-wrap" style="color: #334155; line-height: 1.625; font-size: 1rem; white-space: pre-wrap; padding-left: 2.75rem; margin: 0;">${section.content}</p>
    `).join('\n');
    const attachments = reportObj.attachments || [];
    let attachmentsHtml = "";
    if (attachments.length > 0) {
      const imagesList = attachments.filter(a => a.type === 'image');
      const docsList = attachments.filter(a => a.type === 'doc');
      const linksList = attachments.filter(a => a.type === 'link');
      const previewsList = attachments.filter(a => a.type === 'preview');

      attachmentsHtml = `
      <div class="mt-12 pt-8 border-t border-slate-200 font-sans">
        <h3 class="text-lg font-bold font-display text-slate-950 mb-6 flex items-center gap-2">
          <span style="color: ${brandColor}; font-weight: bold; font-family: monospace; font-size: 1.25rem;">📎</span>
          Attachments & Resources
        </h3>
        
        <div class="space-y-6">
          ${imagesList.length > 0 ? `
            <div class="space-y-3 print:break-inside-avoid" style="margin-top: 1.5rem;">
              <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Images</h4>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
                ${imagesList.map(att => `
                  <div class="bg-white border border-slate-200 rounded-2xl p-3 shadow-3xs flex flex-col justify-between">
                    <img src="${att.url}" alt="${att.name}" referrerpolicy="no-referrer" class="rounded-lg max-h-40 w-full object-cover border border-slate-250 bg-slate-50 shadow-3xs" />
                    <div class="mt-2 text-xs font-medium text-slate-600 truncate">${att.name}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${docsList.length > 0 ? `
            <div class="space-y-3 print:break-inside-avoid" style="margin-top: 1.5rem;">
              <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Documents</h4>
              
              <!-- Screen view: Download cards -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                ${docsList.map(att => `
                  <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center justify-between">
                    <div class="flex items-center gap-3 min-w-0">
                      <div class="p-2 bg-rose-50 rounded-xl shrink-0">
                        <span style="color: #e11d48; font-weight: bold;">📄</span>
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm font-semibold text-slate-900 truncate" title="${att.name}">${att.name}</p>
                        ${att.size ? `<p class="text-[10px] text-slate-400 font-mono mt-0.5">${(att.size / 1024).toFixed(0)} KB</p>` : ''}
                      </div>
                    </div>
                    <a href="${att.url}" target="_blank" rel="noopener noreferrer" download="${att.name}" class="inline-flex items-center gap-1.5 text-xs text-white font-semibold py-1.5 px-3 rounded-lg shadow-3xs hover:shadow-xs transition shrink-0 ml-2" style="background-color: ${brandColor};">
                      Download
                    </a>
                  </div>
                `).join('')}
              </div>

              <!-- Print view: Listed as text with file name and download URL -->
              <div class="hidden print:block space-y-2">
                ${docsList.map(att => `
                  <div class="text-slate-800 text-sm font-sans">
                    <span class="font-semibold">${att.name}</span> – Download URL: <a href="${att.url}" class="text-indigo-650 underline font-mono text-xs">${att.url}</a>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${linksList.length > 0 ? `
            <div class="space-y-3 print:break-inside-avoid" style="margin-top: 1.5rem;">
              <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Links</h4>
              
              <!-- Screen view: Styled clickable buttons -->
              <div class="flex flex-wrap gap-3 print:hidden">
                ${linksList.map(att => `
                  <a href="${att.url}" target="_blank" rel="noopener noreferrer" class="inline-flex flex-col items-start gap-1 py-2.5 px-4 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-650 transition shadow-3xs hover:shadow-2xs">
                    <div class="flex items-center gap-2 text-xs font-semibold">
                      <span style="color: #64748b; font-size: 0.875rem;">🔗</span>
                      <span>${att.name}</span>
                      <span style="color: #94a3b8; font-size: 0.75rem;">↗</span>
                    </div>
                    <span class="text-[9px] text-slate-400 font-mono truncate max-w-xs pl-5.5">${att.url}</span>
                  </a>
                `).join('')}
              </div>

              <!-- Print view: Listed as clickable hyperlinks -->
              <div class="hidden print:block space-y-2">
                ${linksList.map(att => `
                  <div class="text-slate-800 text-sm font-sans">
                    <a href="${att.url}" class="text-indigo-650 underline font-semibold">${att.name}</a> – <span class="font-mono text-xs text-slate-500">${att.url}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${previewsList.length > 0 ? `
            <div class="space-y-3 print:break-inside-avoid" style="margin-top: 1.5rem;">
              <h4 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Website Previews</h4>
              
              <!-- Screen view: Cards with URL and Visit button -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                ${previewsList.map(att => `
                  <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col justify-between">
                    <div class="flex items-start gap-3">
                      <div class="p-2 bg-violet-50 rounded-xl shrink-0">
                        <span style="color: #7c3aed; font-weight: bold;">🌐</span>
                      </div>
                      <div class="min-w-0 flex-1">
                        <p class="text-sm font-semibold text-slate-900 truncate" title="${att.name}">${att.name}</p>
                        <p class="text-[10px] text-slate-400 truncate font-mono mt-0.5">${getDomainName(att.url)}</p>
                      </div>
                    </div>
                    <div class="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                      <a href="${att.url}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 text-xs text-white font-semibold py-1.5 px-3 rounded-lg shadow-3xs hover:shadow-xs transition" style="background-color: ${brandColor};">
                        Visit Website
                      </a>
                    </div>
                  </div>
                `).join('')}
              </div>

              <!-- Print view: Listed with URL as a clickable link -->
              <div class="hidden print:block space-y-2">
                ${previewsList.map(att => `
                  <div class="text-slate-800 text-sm font-sans">
                    <span class="font-semibold">${att.name}</span> – Web URL: <a href="${att.url}" class="text-indigo-650 underline font-mono text-xs">${att.url}</a>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
      `;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${reportObj.title}</title>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: {
            sans: ['Inter', 'sans-serif'],
            display: ['Space Grotesk', 'sans-serif'],
            mono: ['JetBrains Mono', 'monospace'],
          }
        }
      }
    }
  </script>
  <style>
    @media print {
      .no-print { display: none !important; }
      body { background: white !important; color: #1e293b !important; }
      .print-card { border: none !important; box-shadow: none !important; padding: 0 !important; }
      * {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-805 min-h-screen flex flex-col justify-between antialiased">
  <div style="background-color: ${brandColor}" class="h-2.5 w-full shrink-0"></div>

  <header class="bg-white border-b border-slate-200 py-6 px-6 sm:px-12 sticky top-0 z-10 shadow-xs no-print">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-3">
        ${profile?.brandLogoUrl ? `
          <img src="${profile.brandLogoUrl}" alt="${agencyName}" class="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1" />
        ` : `
          <div style="background-color: ${brandColor}" class="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white text-base font-bold">
            ${agencyName.charAt(0).toUpperCase()}
          </div>
        `}
        <div>
          <p class="font-bold text-slate-950 font-display tracking-tight text-base leading-tight">${agencyName}</p>
          <p class="text-[10px] text-slate-500 font-mono">PORTABLE PERFORMANCE REPORT</p>
        </div>
      </div>
      <div>
        <button onclick="window.print()" class="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition shadow-xs cursor-pointer">
          Print or Save PDF
        </button>
      </div>
    </div>
  </header>

  <main class="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
    <div class="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-xs print-card">
      <div class="flex flex-col gap-4 mb-6 pb-6 border-b border-slate-100">
        <!-- Logo / Agency Name -->
        <div class="flex items-center gap-3">
          ${profile?.brandLogoUrl ? `
            <img src="${profile.brandLogoUrl}" alt="${agencyName}" class="max-h-12 w-auto object-contain rounded-lg border border-slate-200 p-1" />
            <span class="text-lg font-bold text-slate-955 font-display" style="font-family: 'Space Grotesk', sans-serif;">${agencyName}</span>
          ` : `
            <span class="text-lg font-bold text-slate-955 font-display" style="font-family: 'Space Grotesk', sans-serif;">${agencyName}</span>
          `}
        </div>

        <!-- Report Title -->
        <h1 class="text-2xl sm:text-3xl font-extrabold font-display text-slate-955 tracking-tight leading-normal mt-2" style="font-family: 'Space Grotesk', sans-serif; font-weight: 850; margin: 0;">${reportObj.title}</h1>
        
        <!-- Client Name and Period -->
        <div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 font-sans" style="display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; font-size: 0.875rem; color: #64748b;">
          <span>Client partner: ${clientName}</span>
          <span>Period: ${reportObj.periodStart} – ${reportObj.periodEnd}</span>
        </div>
      </div>
      </div>

      ${reportObj.aiSummary ? `
      <div class="relative p-6 bg-slate-50 rounded-xl border-l-[4px]" style="border-left-color: ${brandColor}; position: relative; padding: 1.5rem; background-color: #f8fafc; border-radius: 0.75rem; border-left-width: 4px;">
        <h3 class="font-display font-bold text-slate-900 mb-2" style="font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #020617; margin-bottom: 0.5rem;">Executive Summary</h3>
        <p class="text-slate-705 leading-relaxed text-base italic" style="color: #334155; font-style: italic; font-size: 1rem; line-height: 1.625;">"${reportObj.aiSummary}"</p>
      </div>
      ` : ''}
    </div>

    ${reportObj.customMessage ? `
    <div class="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-xs print-card" style="margin-bottom: 2rem;">
      <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 mb-3" style="font-size: 0.75rem; font-family: monospace; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.75rem;">
        Message from ${agencyName}
      </h3>
      <p class="text-slate-700 leading-relaxed text-base whitespace-pre-wrap" style="color: #334155; line-height: 1.625; font-size: 1rem; white-space: pre-wrap; margin: 0;">${reportObj.customMessage}</p>
    </div>
    ` : ''}

    <div class="space-y-6" style="display: flex; flex-direction: column; gap: 1.5rem;">
      ${sectionsHtml}
    </div>
    ${attachmentsHtml}
  </main>

  <footer class="bg-white border-t border-slate-200 py-8 px-6 mt-12 text-center text-slate-500 text-sm no-print" style="text-align: center; font-size: 0.875rem; color: #64748b; padding-top: 2rem; padding-bottom: 2rem; border-top-width: 1px; border-color: #e2e8f0; margin-top: 3rem; background-color: white;">
    <p class="font-sans">This report was generated by ${agencyName}.</p>
    ${profile?.plan === 'pro' ? '' : '<p class="text-xs text-slate-400 font-mono mt-1" style="font-size: 0.75rem; font-family: monospace; color: #94a3b8; margin-top: 0.25rem;">Powered by ReportIQ</p>'}
  </footer>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${reportObj.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };

  const downloadDocumentTemplate = () => {
    const templateContent = `ReportIQ Document Format Template & Guidelines
===============================================

To get the absolute best results from the ReportIQ AI-Powered Report Generator, format your uploaded document using the structure below. While our advanced LLM models can parse unstructured texts perfectly, structured reports will contain higher grade metrics.

FORMAT GUIDELINES:
1. TARGET AUDIENCE:
   Specify the client or department this report targets.
   
2. TIME PERIOD:
   Clearly state the weeks, months, or year of the data points.

3. CORE SECTIONS:
   Use headers like "## Key Accomplishments", "## Performance Metrics", or "## Challenges & Blockers" to mark logical dividers.

4. CALLOUT DATA:
   Format critical numbers clearly (e.g., "Conversion Rate: +14%", "New Leads: 1,450", "Budget Burndown: 42%").

TEMPLATE EXAMPLE:
-----------------------------------------------
Client: Smith Digital Consulting
Period: 2026-06-01 to 2026-06-30

## Executive Summary
This month we achieved extreme operational improvements, focusing on scaling client acquisition channels and onboarding the design workflows.

## Core Milestones Achieved
- Formulated CRM pipeline strategies with 95% team alignment.
- Converted 14 high-tier active accounts, surpassing monthly target by +20%.
- Refined Brand guidelines in Supabase bucket environments.

## Client Deliverables & Stats
- Total Generated Reports: 42
- Average Turnaround Time: 1.4 Days
- Satisfaction Score: 4.9/5 stars
-----------------------------------------------

Prepare your file as .txt, .docx, .pdf, .xlsx, .csv, or .json and upload it to generate a highly detailed executive analytics suite immediately.`;

    const blob = new Blob([templateContent], { type: "text/plain;charset=utf-8" });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = "ReportIQ_Document_Template.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };

  const downloadReportAsMarkdown = (reportObj: Report) => {
    const agencyName = profile?.agencyName || "Smith Digital";
    const parentClient = clients.find(c => c.id === reportObj.clientId);
    const clientName = parentClient?.name || "Client Partner";

    let md = `# ${reportObj.title}\n\n`;
    md += `**Client Partner:** ${clientName}\n`;
    md += `**Agency Name:** ${agencyName}\n`;
    md += `**Billing Period:** ${reportObj.periodStart} to ${reportObj.periodEnd}\n\n`;
    md += `--- \n\n`;

    if (reportObj.aiSummary) {
      md += `## Executive Summary\n\n`;
      md += `> ${reportObj.aiSummary}\n\n`;
    }

    if (reportObj.customMessage) {
      md += `## Message from ${agencyName}\n\n`;
      md += `${reportObj.customMessage}\n\n`;
    }

    if (reportObj.sections && reportObj.sections.length > 0) {
      md += `## Deliverables & Highlights\n\n`;
      reportObj.sections.forEach(s => {
        md += `### ✓ ${s.title}\n\n`;
        md += `${s.content}\n\n`;
      });
    }

    if (profile?.plan !== "pro") {
      md += `---\n*Generated by ReportIQ. Secure Portable Analytical Report.*`;
    }

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
    const fileUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = `${reportObj.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-report.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };



  // Helper to render all modals in either views to prevent duplicate copies
  const renderModals = () => {
    // Calculate share helpers beforehand so they are always in scope
    const currentShareReport = sharingReport || selectedReport;
    const parentClient = currentShareReport ? clients.find(c => c.id === currentShareReport.clientId) : (editingReport ? clients.find(c => c.id === editingReport.clientId) : null);
    const shareUrl = currentShareReport ? getShareUrl(profile, currentShareReport.slug) : "";
    const emailSubject = currentShareReport ? encodeURIComponent(`Executive Branded Analytics Report: ${currentShareReport.title}`) : "";
    const emailBodyRaw = currentShareReport ? `Hi ${parentClient?.name || "Team"},\n\nWe have generated your latest branded performance and deliverables report.\n\nYou can access your live interactive data portal here:\n${shareUrl}\n\nPlease let us know if you have any questions or feedback.\n\nBest regards,\n${profile?.agencyName || "Agility Studios"}` : "";
    const emailBodyEncoded = encodeURIComponent(emailBodyRaw);
    const whatsappMsg = currentShareReport ? encodeURIComponent(`Hi ${parentClient?.name || "there"}, here is our latest progress report for you: ${shareUrl}`) : "";

    const copyEmailMessage = async () => {
      try {
        await navigator.clipboard.writeText(emailBodyRaw);
        setEmailCopied(true);
        setTimeout(() => setEmailCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy body", err);
      }
    };

    return (
      <>
        {/* Edit General Report Modal Popup */}
        {editingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 animate-fade-in backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl p-6 max-h-[92vh] overflow-y-auto shadow-2xl relative animate-scale-up text-sm font-sans">
              <button
                onClick={() => setEditingReport(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1.5">
                <Pencil className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold font-display text-slate-950">Refine Report Content</h3>
              </div>
              <p className="text-xs text-slate-500 mb-6">Modify system-generated data elements and add manual touches</p>

              {saveReportError && (
                <div className="mb-4 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-medium flex gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{saveReportError}</span>
                </div>
              )}

              <form onSubmit={handleSaveReportSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Report Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editReportTitle}
                    onChange={e => setEditReportTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-150 bg-slate-50/50 text-sm"
                    maxLength={250}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Executive Summary Paragraph
                  </label>
                  <textarea
                    value={editReportAiSummary}
                    onChange={e => setEditReportAiSummary(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-150 bg-slate-50/50 text-sm resize-none"
                    rows={3}
                    maxLength={1500}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Personal Client Greeting / Custom Commentary
                  </label>
                  <textarea
                    value={editReportCustomMessage}
                    onChange={e => setEditReportCustomMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-150 bg-slate-50/50 text-sm resize-none"
                    rows={2.5}
                    maxLength={1000}
                  />
                </div>

                <div className="relative p-1 border border-slate-100 rounded-2xl bg-slate-50/20">
                  {plan === "free" && (
                    <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl z-10 p-3 border border-dashed border-slate-200 cursor-pointer text-center"
                         onClick={() => showLock("Custom Tones", "Starter", "$29/mo")}>
                      <Lock className="w-4 h-4 text-indigo-650 mb-1" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Starter Feature</span>
                      <span className="text-xs text-slate-700 font-bold mt-0.5">Unlock Custom Report Tones</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Upgrade to save and apply Conversational, Bold, or Minimal tones to reports.</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Agency Report Tone
                    </label>
                    <select
                      disabled={plan === "free"}
                      value={editReportTone}
                      onChange={e => setEditReportTone(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 focus:border-indigo-600 focus:ring-1 focus:ring-indigo-200 text-sm font-medium cursor-pointer"
                    >
                      <option value="Formal & Corporate">Formal & Corporate</option>
                      <option value="Friendly & Conversational">Friendly & Conversational</option>
                      <option value="Bold & Confident">Bold & Confident</option>
                      <option value="Minimal & Direct">Minimal & Direct</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-3.5">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                      Report Sections & Accomplishments ({editReportSections.length})
                    </h4>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditReportSections([...editReportSections, { title: "New Section", content: "", type: "custom" }]);
                        }}
                        className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Blank
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (plan === "free") {
                            showLock("AI Section Writer", "Starter", "$29/mo");
                          } else {
                            setShowAddSectionForm(true);
                            setNewSectionTopic("");
                            setNewSectionTone("Professional");
                            setGeneratingSectionError(null);
                          }
                        }}
                        className="flex items-center gap-1 text-xs text-indigo-650 hover:text-indigo-700 transition-colors cursor-pointer font-medium"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Generate {plan === "free" && <Lock className="w-3 h-3 text-slate-400" />}
                      </button>
                    </div>
                  </div>

                  {/* AI POWERED ADD SECTION FORM */}
                  {showAddSectionForm && (
                    <div className="mb-4 p-4 bg-indigo-50/40 border border-indigo-150 rounded-2xl space-y-4 text-xs font-sans">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          Generate Custom Section
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddSectionForm(false)}
                          className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                      {generatingSectionError && (
                        <p className="text-red-600 font-semibold">{generatingSectionError}</p>
                      )}

                      <div className="space-y-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-505 mb-1.5">
                            What should this section be about? *
                          </label>
                          <input
                            type="text"
                            required={showAddSectionForm}
                            placeholder="e.g. Social media results, bug fixes this week, key migrations completed"
                            value={newSectionTopic}
                            onChange={e => setNewSectionTopic(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-150 text-xs"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-505 mb-1.5">
                            Section Tone *
                          </label>
                          <select
                            value={newSectionTone}
                            onChange={e => setNewSectionTone(e.target.value as any)}
                            className="w-full rounded-xl border border-slate-200 bg-white p-2.5 outline-none focus:border-indigo-600 text-xs font-medium cursor-pointer"
                          >
                            <option value="Professional">Professional</option>
                            <option value="Casual">Casual</option>
                            <option value="Technical">Technical</option>
                            <option value="Formal">Formal</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2.5 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditReportSections([...editReportSections, { title: "New Milestone", content: "", type: "custom" }]);
                            setShowAddSectionForm(false);
                          }}
                          className="px-3 py-1.5 border border-slate-250 bg-white hover:bg-slate-50 text-slate-600 font-semibold rounded-lg"
                        >
                          Add Blank
                        </button>
                        <button
                          type="button"
                          disabled={generatingSection}
                          onClick={async () => {
                            if (!newSectionTopic.trim()) {
                              setGeneratingSectionError("Please outline what the section should cover.");
                              return;
                            }
                            setGeneratingSection(true);
                            setGeneratingSectionError(null);
                            try {
                              const activeClient = clients.find(c => c.id === editingReport?.clientId);
                              const authHeaders = await getAuthHeaders();
                              const res = await fetch("/api/reports/generate-section", {
                                method: "POST",
                                headers: { 
                                  "Content-Type": "application/json",
                                  ...authHeaders
                                },
                                body: JSON.stringify({
                                  topic: newSectionTopic.trim(),
                                  tone: newSectionTone,
                                  clientName: activeClient?.name || "our client partner",
                                })
                              });
                              if (!res.ok) {
                                const errorData = await res.json().catch(() => ({}));
                                throw new Error(errorData.error || "Failed to generate customized section.");
                              }
                              const data = await res.json();
                              setEditReportSections([...editReportSections, {
                                title: data.title || newSectionTopic.trim(),
                                content: data.content || "",
                                type: 'custom'
                              }]);
                              setShowAddSectionForm(false);
                              setNewSectionTopic("");
                            } catch (err: any) {
                              console.error(err);
                              setGeneratingSectionError(err.message || "Failed to generate AI section content.");
                            } finally {
                              setGeneratingSection(false);
                            }
                          }}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 font-bold rounded-lg text-white shadow-3xs flex items-center gap-1 cursor-pointer"
                        >
                          {generatingSection ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              Structuring...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              Generate with AI
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {editReportSections.length === 0 ? (
                    <div className="p-6 bg-slate-50 border border-slate-150 rounded-2xl text-center text-xs text-slate-500 mb-4">
                      No active milestone text blocks. Click "Add Section" to create one.
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-1 font-sans mb-4">
                      {editReportSections.map((sec, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl relative shadow-3xs hover:border-slate-350 transition-colors">
                          <button
                            type="button"
                            onClick={() => setEditReportSections(editReportSections.filter((_, i) => i !== idx))}
                            className="absolute top-2.5 right-2.5 text-[10px] text-slate-400 hover:text-red-600 cursor-pointer font-bold font-mono"
                          >
                            &times; Delete Section
                          </button>

                          <div className="space-y-3 pt-2">
                            <div>
                              <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1">
                                Section Name
                              </label>
                              <input
                                type="text"
                                required
                                value={sec.title}
                                onChange={e => {
                                  const list = [...editReportSections];
                                  list[idx].title = e.target.value;
                                  setEditReportSections(list);
                                }}
                                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-indigo-600"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 mb-1">
                                Deliverable Details
                              </label>
                              <textarea
                                required
                                rows={2.5}
                                value={sec.content}
                                onChange={e => {
                                  const list = [...editReportSections];
                                  list[idx].content = e.target.value;
                                  setEditReportSections(list);
                                }}
                                className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-indigo-600 resize-none animate-fade-in"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                                 {/* RICH MEDIA ATTACHMENTS EDITING PANEL */}
                {plan === "free" ? (
                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                      Shared Attachments & Links
                    </h4>
                    <button
                      type="button"
                      onClick={() => showLock("Attachments", "Starter", "$29/mo")}
                      className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between text-left text-xs font-semibold text-slate-600 transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4 text-slate-400" />
                        <span>Upload images, documents, or website previews</span>
                      </div>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md">Starter Plan</span>
                    </button>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                      Shared Attachments & Links ({editReportAttachments.length})
                    </h4>

                    {editReportAttachments.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {editReportAttachments.map((att) => (
                          <div key={att.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2.5 text-xs relative hover:border-slate-350 transition">
                            <div className="flex items-center gap-2 overflow-hidden">
                              {att.type === 'image' && <Image className="w-4 h-4 text-emerald-600 shrink-0" />}
                              {att.type === 'link' && <Link className="w-4 h-4 text-blue-600 shrink-0" />}
                              {att.type === 'doc' && <FileText className="w-4 h-4 text-rose-600 shrink-0" />}
                              {att.type === 'preview' && <Globe className="w-4 h-4 text-violet-600 shrink-0" />}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-850 truncate" title={att.name}>{att.name}</p>
                                {att.type === 'preview' && <p className="text-[9px] text-slate-400 capitalize">{att.domainName}</p>}
                                {att.size && <p className="text-[9px] text-slate-450">{(att.size / 1024).toFixed(0)} KB</p>}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setEditReportAttachments(editReportAttachments.filter(a => a.id !== att.id))}
                              className="text-slate-400 hover:text-red-655 font-bold text-sm shrink-0 p-1.5 cursor-pointer"
                              title="Remove attachment"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Addition Trigger Buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setAttachmentType(attachmentType === 'image' ? null : 'image')}
                        className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${attachmentType === 'image' ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Image className="w-3.5 h-3.5" />
                        Add Image
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachmentType(attachmentType === 'link' ? null : 'link')}
                        className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${attachmentType === 'link' ? 'bg-blue-50 border-blue-300 text-blue-700 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Link className="w-3.5 h-3.5" />
                        Add Link
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachmentType(attachmentType === 'doc' ? null : 'doc')}
                        className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${attachmentType === 'doc' ? 'bg-rose-50 border-rose-300 text-rose-700 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Add Document
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachmentType(attachmentType === 'preview' ? null : 'preview')}
                        className={`py-1.5 px-3 rounded-lg border text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${attachmentType === 'preview' ? 'bg-violet-50 border-violet-300 text-violet-700 shadow-2xs' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                      >
                        <Globe className="w-3.5 h-3.5" />
                        Add Website Preview
                      </button>
                    </div>
                  </div>
                )}

                  {/* Interactive Input cards */}
                  {attachmentType === 'image' && (
                    <div className="p-4 bg-emerald-50/50 border border-emerald-150 rounded-2xl space-y-3 text-xs font-sans">
                      <p className="font-semibold text-emerald-800">Upload Image Asset</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setImageUploading(true);
                              try {
                                const filePath = `${userId}/${Date.now()}_${file.name}`;
                                const { error: uploadError } = await supabase.storage.from("report-images").upload(filePath, file);
                                if (uploadError) throw uploadError;
                                const { data: { publicUrl } } = supabase.storage.from("report-images").getPublicUrl(filePath);

                                setEditReportAttachments([...editReportAttachments, {
                                  id: Math.random().toString(36).substring(2, 9),
                                  type: 'image',
                                  name: file.name,
                                  url: publicUrl
                                }]);
                                setAttachmentType(null);
                              } catch (uploadErr: any) {
                                console.error(uploadErr);
                                alert("Failed to upload assets: " + uploadErr.message);
                              } finally {
                                setImageUploading(false);
                              }
                            }
                          }}
                          className="w-full text-xs text-slate-550 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-emerald-600 file:text-white hover:file:bg-emerald-700 file:cursor-pointer"
                        />
                        {imageUploading && <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                      </div>
                      <p className="text-[10px] text-slate-400">Allowed: PNG, JPG, GIF</p>
                    </div>
                  )}

                  {attachmentType === 'link' && (
                    <div className="p-4 bg-blue-50/50 border border-blue-150 rounded-2xl space-y-3.5 text-xs font-sans">
                      <p className="font-semibold text-blue-800">Add External Hyperlink</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-450 mb-1">Display Label *</label>
                          <input
                            type="text"
                            required={attachmentType === 'link'}
                            placeholder="e.g. View Live Website"
                            value={linkLabel}
                            onChange={e => setLinkLabel(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-450 mb-1">Destination URL *</label>
                          <input
                            type="url"
                            required={attachmentType === 'link'}
                            placeholder="https://example.com"
                            value={linkUrl}
                            onChange={e => setLinkUrl(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 text-[11px]">
                        <button
                          type="button"
                          onClick={() => setAttachmentType(null)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-705"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (linkLabel.trim() && linkUrl.trim()) {
                              setEditReportAttachments([...editReportAttachments, {
                                id: Math.random().toString(36).substring(2, 9),
                                type: 'link',
                                name: linkLabel.trim(),
                                url: linkUrl.trim()
                              }]);
                              setLinkLabel("");
                              setLinkUrl("");
                              setAttachmentType(null);
                            }
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
                        >
                          Add Link
                        </button>
                      </div>
                    </div>
                  )}

                  {attachmentType === 'doc' && (
                    <div className="p-4 bg-rose-50/50 border border-rose-150 rounded-2xl space-y-3 text-xs font-sans">
                      <p className="font-semibold text-rose-800">Upload Project Document</p>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept=".pdf, .docx, .xlsx"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setDocUploading(true);
                              try {
                                const filePath = `${userId}/${Date.now()}_${file.name}`;
                                const { error: uploadError } = await supabase.storage.from("report-docs").upload(filePath, file);
                                if (uploadError) throw uploadError;
                                const { data: { publicUrl } } = supabase.storage.from("report-docs").getPublicUrl(filePath);

                                setEditReportAttachments([...editReportAttachments, {
                                  id: Math.random().toString(36).substring(2, 9),
                                  type: 'doc',
                                  name: file.name,
                                  url: publicUrl,
                                  size: file.size
                                }]);
                                setAttachmentType(null);
                              } catch (uploadErr: any) {
                                console.error(uploadErr);
                                alert("Failed to upload document: " + uploadErr.message);
                              } finally {
                                setDocUploading(false);
                              }
                            }
                          }}
                          className="w-full text-xs text-slate-550 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-bold file:bg-rose-600 file:text-white hover:file:bg-rose-700 file:cursor-pointer"
                        />
                        {docUploading && <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin shrink-0"></div>}
                      </div>
                      <p className="text-[10px] text-slate-400">Supported types: PDF, DOCX, XLSX</p>
                    </div>
                  )}

                  {attachmentType === 'preview' && (
                    <div className="p-4 bg-violet-50/50 border border-violet-150 rounded-2xl space-y-3 text-xs font-sans">
                      <p className="font-semibold text-violet-800">Embed Website Preview Link Card</p>
                      <div>
                        <label className="block text-[10px] uppercase font-bold tracking-wider text-slate-450 mb-1">Preview URL *</label>
                        <input
                          type="url"
                          required={attachmentType === 'preview'}
                          placeholder="https://github.com/agency/reports"
                          value={previewUrl}
                          onChange={e => setPreviewUrl(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-xs outline-none focus:border-violet-500"
                        />
                      </div>
                      <div className="flex justify-end gap-2 text-[11px] pt-1">
                        <button
                          type="button"
                          onClick={() => setAttachmentType(null)}
                          className="px-2 py-1 text-slate-500 hover:text-slate-705"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (previewUrl.trim()) {
                              try {
                                const domain = new URL(previewUrl.trim()).hostname;
                                setEditReportAttachments([...editReportAttachments, {
                                  id: Math.random().toString(36).substring(2, 9),
                                  type: 'preview',
                                  name: previewUrl.trim(),
                                  url: previewUrl.trim(),
                                  domainName: domain
                                }]);
                                setPreviewUrl("");
                                setAttachmentType(null);
                              } catch (e) {
                                alert("Please enter a valid URL beginning with https://");
                              }
                            }
                          }}
                          className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold"
                        >
                          Add Website Preview
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingReport(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saveReportSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
                  >
                    {saveReportSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Report Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Report Confirmation Modal */}
        {deleteConfirmReportId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 animate-fade-in backdrop-blur-xs">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative animate-scale-up text-sm font-sans">
              <button
                onClick={() => setDeleteConfirmReportId(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-3.5 mb-2 text-left">
                <div className="p-3 bg-red-50 border border-red-105 rounded-2xl text-red-600 shrink-0">
                  <Trash2 className="w-6 h-6 animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold font-display text-slate-950 font-sans">
                    Delete Intelligence Report?
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 leading-normal font-sans">
                    Are you absolutely sure you want to permanently delete this intelligence report?
                    This will unpublish the active web portal link immediately, and erase all related metrics, executive summaries, 
                    and custom items. This action is irreversible.
                  </p>
                </div>
              </div>

              {deleteReportError && (
                <div className="my-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 text-left">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5 animate-bounce" />
                  <span>{deleteReportError}</span>
                </div>
              )}

              <div className="pt-5 flex items-center gap-3 font-sans">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmReportId(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-605 font-semibold cursor-pointer text-center text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteReport}
                  disabled={deleteReportSubmitting}
                  className="flex-1 py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                >
                  {deleteReportSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    "Delete Report"
                  )}
                </button>
              </div>
            </div>
 
          </div>
        )}

        {/* Share Report Modal with Email and Messaging helpers */}
        {sharingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 animate-fade-in backdrop-blur-xs font-sans font-sans">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-scale-up text-sm">
              <button
                onClick={() => setSharingReport(null)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-650 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-6 text-left">
                <Share2 className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-bold font-display text-slate-955">Share Report with Client</h3>
              </div>

              {sharingReport.status !== "sent" && (
                <div className="mb-5 p-3.5 bg-yellow-50 border border-yellow-250 rounded-xl flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-yellow-900 text-left">Status set to Preview / Draft</p>
                    <button
                      onClick={async () => {
                        await updateReportStatus(sharingReport.id, "sent");
                        setSharingReport(null);
                      }}
                      className="text-[11px] underline text-indigo-700 hover:text-indigo-800 font-bold mt-1 block cursor-pointer transition-colors"
                    >
                      Click to activate publicly and mark as "Sent" &rarr;
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">

                <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400">
                      Email Deliverable Template
                    </h4>
                    <button
                      onClick={copyEmailMessage}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      {emailCopied ? "Copied Message!" : "Copy message"}
                    </button>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-slate-150 text-[11px] text-slate-650 text-left space-y-1 select-all font-mono">
                    <p className="font-semibold text-slate-805">Subject: Executive Branded Analytics Report...</p>
                    <p className="whitespace-pre-wrap leading-relaxed">{emailBodyRaw}</p>
                  </div>
                </div>

                <div className="p-4 border border-slate-200 rounded-2xl bg-indigo-50/20">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[10px] font-bold font-mono uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-indigo-650 shrink-0" />
                      Central Client Portal Access
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        const portalUrl = (profile?.plan === "pro" || profile?.plan === "arbitrage")
                          ? `${window.location.protocol}//${window.location.host}/portal/${profile.uid}`
                          : `${window.location.protocol}//${window.location.host}/portal`;
                        navigator.clipboard.writeText(portalUrl);
                        alert("Client Portal link copied to clipboard:\n" + portalUrl);
                      }}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                    >
                      Copy Link
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-505 text-left leading-normal">
                    Your clients can log in securely at <strong className="text-slate-700">/portal</strong> using their email address to view all reports you've compiled for them.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSharingReport(null);
                        if (shareUrl) {
                          const iframe = document.createElement("iframe");
                          iframe.style.position = "fixed";
                          iframe.style.left = "-9999px";
                          iframe.style.top = "-9999px";
                          iframe.style.width = "1024px";
                          iframe.style.height = "768px";
                          iframe.style.border = "none";
                          iframe.src = `${shareUrl}?print=true`;
                          document.body.appendChild(iframe);
                          setTimeout(() => {
                            document.body.removeChild(iframe);
                          }, 10000);
                        }
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Print / Save PDF
                    </button>
                    <a
                      href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(parentClient?.email || "")}&su=${emailSubject}&body=${emailBodyEncoded}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-xl border border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      Open in Gmail
                    </a>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => downloadReportAsHtml(sharingReport)}
                      className="flex-1 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Download styled HTML document"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-400" />
                      Download HTML
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadReportAsMarkdown(sharingReport)}
                      className="flex-1 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold text-center flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      title="Download Markdown summary document"
                    >
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      Download MD (.md)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
           )}
      </>
    );
  };

  // If a report is selected, display PREVIEW instead of list
  if (selectedReport) {
    const parentClientObj = clients.find(c => c.id === selectedReport.clientId);
    const publicUrl = getShareUrl(profile, selectedReport.slug);

    // Resolve client-specific branding overrides
    const getPreviewBranding = () => {
      let clientBrandColor = "";
      try {
        const parsed = JSON.parse(parentClientObj?.notes || "{}");
        if (parsed && typeof parsed === "object" && parsed.brandColor) {
          clientBrandColor = parsed.brandColor;
        }
      } catch (e) {}

      return {
        brandColor: clientBrandColor || profile?.brandColor || "#6366f1",
        agencyName: parentClientObj?.company || profile?.agencyName || "Smith Digital",
        logoUrl: parentClientObj?.logoUrl || profile?.brandLogoUrl || null
      };
    };

    const { brandColor, agencyName, logoUrl } = getPreviewBranding();

    return (
      <div className="space-y-6 animate-fade-in font-sans">
        {/* Navigation link line to return to overview */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => onSelectReportId(null)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer font-mono"
          >
            <ArrowLeft className="w-4 h-4" />
            &larr; BACK TO LIBRARY
          </button>

          <div className="flex items-center gap-2">
            <button
               onClick={() => deleteReportDocument(selectedReport.id)}
               className="px-3 py-1.5 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center gap-1"
               title="Delete report permanently"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
            <button
              onClick={() => handleStartEditReport(selectedReport)}
              className="px-3 py-1.5 border border-slate-250 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5 text-slate-400" />
              Edit Content
            </button>
            <button
              onClick={() => {
                window.focus();
                window.print();
              }}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Print report or save as PDF"
            >
              <Printer className="w-3.5 h-3.5 text-slate-400" />
              Print / Save PDF
            </button>
            <button
              onClick={() => downloadReportAsHtml(selectedReport)}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Download fully self-contained HTML offline document"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Download HTML
            </button>
            <button
              onClick={() => downloadReportAsMarkdown(selectedReport)}
              className="px-3.5 py-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              title="Download Markdown summary text file"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Download MD (.md)
            </button>
            <button
              onClick={() => setSharingReport(selectedReport)}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Report
            </button>
          </div>
        </div>

        {/* Info header layout */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold font-display text-slate-950">
                {selectedReport.title}
              </h2>
              {renderStatusBadge(selectedReport.status)}
            </div>
            <p className="text-slate-500 text-xs mt-1.5 font-mono">
              Client: <span className="text-slate-700 font-semibold">{parentClientObj?.name || "Client partner"}</span> · timeframe: {selectedReport.periodStart} to {selectedReport.periodEnd}
            </p>
          </div>

        </div>

        <div id="printable-report-area" className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative overflow-hidden">
          {profile?.plan === 'pro' && profile?.whiteLabel === true && (
            <style dangerouslySetInnerHTML={{ __html: `
              @media print {
                @page {
                  margin: 0 !important;
                }
                body {
                  padding: 1.6cm !important;
                }
              }
            `}} />
          )}
          <div className="absolute top-0 left-0 w-full h-1 bg-indigo-600 print:hidden" />
          
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100 print:hidden">
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400">
              PREVIEW CLIENT EXPERIENCE
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Created: {selectedReport.createdAt}
            </span>
          </div>

          {/* Cover Section (rendered in preview and print) */}
          <div 
            className="relative rounded-3xl overflow-hidden p-8 sm:p-12 mb-8 text-white border border-slate-200/20"
            style={{ 
              background: `linear-gradient(135deg, ${brandColor}, ${brandColor}dd)` 
            }}
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-2xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-xl -ml-20 -mb-20 pointer-events-none" />

            <div className="relative flex flex-col gap-6 font-sans">
              {/* Top left Brand logo and Agency name */}
              <div className="flex flex-col gap-3">
                {logoUrl ? (
                  <div className="flex items-center gap-3">
                    <img 
                      src={logoUrl} 
                      alt={agencyName} 
                      className="max-h-12 w-auto object-contain rounded-lg bg-white/15 p-1.5 shadow-2xs" 
                    />
                    <span className="text-lg font-bold tracking-tight text-white/95">{agencyName}</span>
                  </div>
                ) : (
                  <span className="text-xl font-bold tracking-tight text-white/95">{agencyName}</span>
                )}
              </div>

              {/* Report Title */}
              <div className="space-y-2 mt-2">
                <div className="inline-flex items-center gap-1.5 bg-white/15 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase">
                  <Award className="w-3.5 h-3.5" />
                  Official Deliverable
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight">
                  {selectedReport.title}
                </h1>
              </div>

              {/* Client name and report period below */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm font-medium text-white/90">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-white/70" />
                  {selectedReport.rawData?.subClientName || parentClientObj?.name || "Client Partner"}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-white/70" />
                  {selectedReport.periodStart} – {selectedReport.periodEnd}
                </span>
              </div>
            </div>
          </div>

          {/* Report Analytics & Client View Logs (Pro only, shown but locked for other plans) */}
          <div className="p-6 bg-indigo-50/30 border border-indigo-150 rounded-2xl mb-8 font-sans text-left relative overflow-hidden">
            {plan !== "pro" && plan !== "arbitrage" && (
              <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl z-10 p-4 border border-dashed border-slate-200 pointer-events-auto cursor-pointer text-center animate-fade-in"
                   onClick={() => showLock("Report Analytics & View Logs", "Pro", "$79/mo")}>
                <Lock className="w-5 h-5 text-indigo-650 mb-1" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Pro Feature</span>
                <span className="text-xs text-slate-700 font-bold mt-0.5">Unlock Client View Timestamps & Real-Time Open Tracking</span>
                <p className="text-[10px] text-slate-400 mt-0.5">Upgrade to track exactly when, how often, and on what device clients view your reports.</p>
              </div>
            )}
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-700 mb-3 flex items-center gap-1.5">
              <Globe className="w-4 h-4" />
              Report Analytics & View logs
            </h4>
            <p className="text-slate-500 text-[11px] mb-4">
              Track when your client opens this report. Registered view timestamps are logged directly from their browser session.
            </p>
            {selectedReport.rawData?.viewsLog && Array.isArray(selectedReport.rawData.viewsLog) && selectedReport.rawData.viewsLog.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {selectedReport.rawData.viewsLog.map((timeStr: string, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-white border border-slate-100 p-2 rounded-xl text-xs">
                    <span className="text-slate-600 font-medium">Report Opened</span>
                    <span className="font-mono text-slate-400 text-[10px]">
                      {new Date(timeStr).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">No client views recorded yet for this report.</p>
            )}
          </div>

          {/* AI summaries section block */}
          {selectedReport.aiSummary && (
            <div className="p-6 bg-slate-50 border-l-4 border-indigo-600 rounded-xl mb-8 text-left">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-indigo-600 mb-2">
                Executive Summation
              </h4>
              <p className="text-slate-700 font-serif leading-relaxed italic text-base">
                "{selectedReport.aiSummary}"
              </p>
            </div>
          )}

          {/* Custom Message if exists */}
          {selectedReport.customMessage && (
            <div className="p-6 bg-white border border-slate-100 rounded-xl mb-8 shadow-2xs">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
                Personal Note
              </h4>
              <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
                {selectedReport.customMessage}
              </p>
            </div>
          )}

          {/* Render Sections */}
          <div className="space-y-6">
            {selectedReport.sections && selectedReport.sections.map((sec, i) => (
              <div key={i} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-2xs">
                <h4 className="font-bold text-slate-900 text-base mb-3 leading-tight flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0" />
                  {sec.title}
                </h4>
                <p className="text-slate-605 text-sm leading-relaxed whitespace-pre-wrap pl-3.5">
                  {sec.content}
                </p>
              </div>
            ))}
          </div>

          {/* Attachments & Resources section */}
          {selectedReport.attachments && selectedReport.attachments.length > 0 && (
            <div className="mt-12 pt-8 border-t border-slate-200 font-sans">
              <h3 className="text-lg font-bold font-display text-slate-950 mb-6 flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-indigo-600" />
                Attachments & Resources
              </h3>
              
              <div className="space-y-6">
                {/* Images Grid */}
                {selectedReport.attachments.some(att => att.type === 'image') && (
                  <div className="space-y-3 print:break-inside-avoid">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Images</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {selectedReport.attachments.filter(att => att.type === 'image').map(att => (
                        <div key={att.id} className="bg-white border border-slate-200 rounded-2xl p-3 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                          <img 
                            src={att.url} 
                            alt={att.name} 
                            referrerPolicy="no-referrer"
                            className="rounded-lg max-h-40 w-full object-cover border border-slate-250 bg-slate-50 shadow-3xs" 
                          />
                          <div className="mt-2 text-xs font-medium text-slate-600 truncate">{att.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Documents */}
                {selectedReport.attachments.some(att => att.type === 'doc') && (
                  <div className="space-y-3 print:break-inside-avoid">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Documents</h4>
                    
                    {/* Screen view: Download cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                      {selectedReport.attachments.filter(att => att.type === 'doc').map(att => (
                        <div key={att.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex items-center justify-between hover:border-slate-300 transition-colors">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2 bg-rose-50 rounded-xl shrink-0">
                              <FileText className="w-5 h-5 text-rose-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 truncate" title={att.name}>{att.name}</p>
                              {att.size && (
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{(att.size / 1024).toFixed(0)} KB</p>
                              )}
                            </div>
                          </div>
                          <a 
                            href={att.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download={att.name}
                            className="inline-flex items-center gap-1.5 text-xs bg-indigo-600 hover:bg-indigo-750 text-white font-semibold py-1.5 px-3 rounded-lg shadow-3xs hover:shadow-xs transition shrink-0 ml-2"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* Print view: Listed as text with file name and download URL */}
                    <div className="hidden print:block space-y-2">
                      {selectedReport.attachments.filter(att => att.type === 'doc').map(att => (
                        <div key={att.id} className="text-slate-800 text-sm font-sans">
                          <span className="font-semibold">{att.name}</span> – Download URL: <a href={att.url} className="text-indigo-600 underline font-mono text-xs">{att.url}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links */}
                {selectedReport.attachments.some(att => att.type === 'link') && (
                  <div className="space-y-3 print:break-inside-avoid">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Links</h4>
                    
                    {/* Screen view: Styled clickable buttons with the label */}
                    <div className="flex flex-wrap gap-3 print:hidden">
                      {selectedReport.attachments.filter(att => att.type === 'link').map(att => (
                        <a 
                          key={att.id}
                          href={att.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex flex-col items-start gap-1 py-2.5 px-4 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-650 transition shadow-3xs hover:shadow-2xs"
                        >
                          <div className="flex items-center gap-2 text-xs font-semibold">
                            <Link className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                            <span>{att.name}</span>
                            <ExternalLink className="w-3 h-3 text-slate-400 shrink-0" />
                          </div>
                          <span className="text-[9px] text-slate-400 font-mono truncate max-w-xs pl-5.5">{att.url}</span>
                        </a>
                      ))}
                    </div>

                    {/* Print view: Listed as clickable hyperlinks */}
                    <div className="hidden print:block space-y-2">
                      {selectedReport.attachments.filter(att => att.type === 'link').map(att => (
                        <div key={att.id} className="text-slate-800 text-sm font-sans">
                          <a href={att.url} className="text-indigo-650 underline font-semibold">{att.name}</a> – <span className="font-mono text-xs text-slate-500">{att.url}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Website Previews */}
                {selectedReport.attachments.some(att => att.type === 'preview') && (
                  <div className="space-y-3 print:break-inside-avoid">
                    <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Website Previews</h4>
                    
                    {/* Screen view: Cards with URL and Visit button */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                      {selectedReport.attachments.filter(att => att.type === 'preview').map(att => (
                        <div key={att.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-3xs flex flex-col justify-between hover:border-slate-300 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-violet-50 rounded-xl shrink-0">
                              <Globe className="w-5 h-5 text-violet-650" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-slate-900 truncate" title={att.name}>{att.name}</p>
                              <p className="text-[10px] text-slate-400 truncate font-mono mt-0.5">{getDomainName(att.url)}</p>
                            </div>
                          </div>
                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                            <a 
                              href={att.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs bg-indigo-650 hover:bg-indigo-700 text-white font-semibold py-1.5 px-3 rounded-lg shadow-3xs hover:shadow-xs transition"
                            >
                              Visit Website
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Print view: Listed with URL as a clickable link */}
                    <div className="hidden print:block space-y-2">
                      {selectedReport.attachments.filter(att => att.type === 'preview').map(att => (
                        <div key={att.id} className="text-slate-800 text-sm font-sans">
                          <span className="font-semibold">{att.name}</span> – Web URL: <a href={att.url} className="text-indigo-600 underline font-mono text-xs">{att.url}</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Client Feedback Dashboard Viewer */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs relative overflow-hidden mt-6">
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-slate-400 mb-6 flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4 text-slate-450" />
            Client Feedback Log
          </h3>

          {plan === "pro" || plan === "arbitrage" ? (
            loadingFeedbacks ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-2">
                <div className="w-6 h-6 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
                <p className="text-xs text-slate-505 font-mono">Loading feedback logs...</p>
              </div>
            ) : feedbacks.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                {feedbacks.map((f) => {
                  const reactionLabel = f.reaction === "great" ? "👍 Great" : f.reaction === "ok" ? "😐 OK" : "👎 Needs Work";
                  const reactionColor = f.reaction === "great" ? "bg-emerald-50 text-emerald-800 border-emerald-100" : f.reaction === "ok" ? "bg-amber-50 text-amber-800 border-amber-100" : "bg-rose-50 text-rose-800 border-rose-100";
                  return (
                    <div key={f.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-3xs hover:border-slate-350 transition-colors">
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${reactionColor}`}>
                            {reactionLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(f.submitted_at).toLocaleString()}
                          </span>
                        </div>
                        {f.comment ? (
                          <p className="text-slate-700 text-sm whitespace-pre-wrap leading-relaxed">
                            {f.comment}
                          </p>
                        ) : (
                          <p className="text-slate-400 text-xs italic">
                            No comment provided
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-slate-500 text-xs italic">No client feedback received yet for this report.</p>
              </div>
            )
          ) : (
            <div className="relative p-6 rounded-2xl border border-dashed border-slate-200 text-center bg-slate-50/50">
              <div className="filter blur-xs select-none pointer-events-none space-y-4 opacity-40">
                <div className="p-4 bg-white border border-slate-150 rounded-2xl flex items-start gap-3">
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 font-sans">👍 Great</span>
                  <div className="flex-1 text-left">
                    <p className="text-slate-405 text-[10px] font-mono">June 7, 2026 5:12 PM</p>
                    <p className="text-slate-700 text-sm mt-1">Excellent work, thanks!</p>
                  </div>
                </div>
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-slate-50/80 backdrop-blur-3xs rounded-2xl">
                <Lock className="w-8 h-8 text-indigo-650 mb-2 animate-bounce" />
                <h4 className="text-sm font-bold text-slate-900">Upgrade to Pro to see client feedback</h4>
                <p className="text-xs text-slate-505 max-w-sm mt-1 mb-4 leading-normal">
                  Unlock the Client Feedback widget to see what clients think of your reports, read comments, and adjust deliverables based on client reactions.
                </p>
                <button
                  type="button"
                  onClick={() => onUpgrade("pro")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow transition cursor-pointer"
                >
                  Upgrade to Pro
                </button>
              </div>
            </div>
          )}
        </div>
        {renderModals()}
      </div>
    );
  }

  // Otherwise, render library view
  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Header element bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display tracking-tight text-slate-950">
            Reports Library
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Access secure branded portals and coordinate deliverables ({reports.length} total)
          </p>
        </div>
        <div>
          <button
            onClick={() => {
              setError(null);
              setShowGenModal(true);
            }}
            className="flex items-center gap-2 px-4.5 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Create Branded Report
          </button>
        </div>
      </div>

      {/* Filtering and Sorting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-slate-200 p-4.5 rounded-2xl shadow-2xs font-sans text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Status:</span>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 outline-none p-1.5 font-medium cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="sent">Sent</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Client:</span>
            <select
              value={filterClient}
              onChange={e => setFilterClient(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50/50 outline-none p-1.5 font-medium cursor-pointer max-w-[150px]"
            >
              <option value="all">All Clients</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Sort by:</span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="rounded-lg border border-slate-200 bg-slate-50/50 outline-none p-1.5 font-medium cursor-pointer"
          >
            <option value="date_desc">Newest Date</option>
            <option value="date_asc">Oldest Date</option>
            <option value="title_asc">Title A-Z</option>
            <option value="title_desc">Title Z-A</option>
            <option value="views_desc">Most Viewed</option>
          </select>
        </div>
      </div>

      {/* Reports array grid cards */}
      {filteredReports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map(reportObj => {
            const clientObj = clients.find(c => c.id === reportObj.clientId);
            return (
              <div
                key={reportObj.id}
                onClick={() => onSelectReportId(reportObj.id)}
                className="bg-white border border-slate-200 hover:border-slate-350 hover:shadow-sm rounded-2xl p-6 flex flex-col justify-between h-56 transition-all cursor-pointer shadow-2xs group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-[10px] font-mono font-medium text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      {reportObj.periodStart}
                    </div>
                    {renderStatusBadge(reportObj.status)}
                  </div>

                  <h3 className="font-bold font-display text-slate-950 text-base mt-4 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                    {reportObj.title}
                  </h3>

                  <p className="text-slate-500 text-xs mt-1 font-mono">
                    Client: {clientObj?.name || "Client partner"}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-mono" onClick={e => e.stopPropagation()}>
                  <span>Views: {reportObj.viewCount}</span>
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => handleStartEditReport(reportObj)}
                      className="flex items-center gap-1 hover:text-indigo-600 text-slate-405 transition-colors cursor-pointer py-1 px-1.5 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-100"
                      title="Edit Report Profile"
                    >
                      <Pencil className="w-3 h-3 shrink-0" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        setSharingReport(reportObj);
                      }}
                      className="flex items-center gap-1 hover:text-indigo-600 text-slate-405 transition-colors cursor-pointer py-1 px-1.5 hover:bg-slate-50 rounded-md border border-transparent hover:border-slate-100"
                      title="Share Report link, mail, or whatsapp"
                    >
                      <Share2 className="w-3 h-3 shrink-0" />
                      <span>Share</span>
                    </button>
                    <button
                      onClick={() => deleteReportDocument(reportObj.id)}
                      className="flex items-center gap-1 hover:text-red-600 text-slate-405 hover:bg-red-50 hover:border-red-105 rounded-md border border-transparent transition-colors cursor-pointer py-1 px-1.5"
                      title="Delete Report Record"
                    >
                      <Trash2 className="w-3 h-3 shrink-0" />
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
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold font-display text-slate-950">No Reports Created</h3>
          <p className="text-slate-500 text-sm mt-1.5 max-w-sm mx-auto">
            You haven't generated any customer summaries yet. Switch to clients to verify registries, or launch creator directly!
          </p>
          <button
            onClick={() => {
              setError(null);
              setShowGenModal(true);
            }}
            className="mt-5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all cursor-pointer"
          >
            Create first report &rarr;
          </button>
        </div>
      )}

      {/* modal create overlay popup */}
      {showGenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 animate-fade-in backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-xl relative animate-scale-up">
            <button
              onClick={() => setShowGenModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 cursor-pointer"
            >
              <Plus className="w-5 h-5 rotate-45 transform" />
            </button>

            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h3 className="text-lg font-bold font-display text-slate-950">Generative report composer</h3>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              Connect to client database & formulate customized, AI-driven summaries instantly
            </p>

            {error && (
              <div className="mb-4 p-3.5 bg-red-50 border border-red-100 text-red-700 rounded-xl text-xs font-medium flex flex-col gap-2">
                <div className="flex gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
                {(error.includes("limit this month on the Free plan") || error.includes("limit this month. Upgrade to Pro")) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (plan === "free") {
                        onUpgrade("starter");
                      } else {
                        onUpgrade("pro");
                      }
                    }}
                    className="mt-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold rounded-lg transition-all text-center self-start shrink-0 cursor-pointer animate-fade-in"
                  >
                    Upgrade Plan
                  </button>
                )}
              </div>
            )}

            {currentCount === 0 ? (
              <div className="p-8 border border-slate-100 rounded-xl bg-slate-50 text-center text-sm font-sans">
                <p className="text-slate-500">You must register at least one client before composer is accessible.</p>
                <button
                  type="button"
                  onClick={() => {
                    setShowGenModal(false);
                    onNavigate("clients");
                  }}
                  className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all cursor-pointer"
                >
                  Go to Clients directory &rarr;
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateReport} className="space-y-4 font-sans text-sm">
                {/* Creator Mode Selection Cards */}
                <div className="grid grid-cols-2 gap-3 mb-1 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setReportMode("manual");
                      setError(null);
                    }}
                    className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer font-sans duration-150 flex flex-col items-center justify-center ${
                      reportMode === "manual"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs ring-1 ring-indigo-250"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-base mb-1">✏️</span>
                    <span className="text-[11px] font-bold">Write Notes Manually</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReportMode("document");
                      setError(null);
                    }}
                    className={`py-3 px-2 rounded-xl border text-center transition-all cursor-pointer font-sans duration-150 flex flex-col items-center justify-center ${
                      reportMode === "document"
                        ? "bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs ring-1 ring-indigo-250"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="text-base mb-1">📄</span>
                    <span className="text-[11px] font-bold">Upload Document</span>
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Select Client Partner *
                  </label>
                  <select
                    required
                    value={clientId}
                    onChange={e => setClientId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 cursor-pointer"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Arbitrage Mode Trigger (unlocked for Arbitrage and Pro plan owners - Admin Only) */}
                {((profile?.plan === "arbitrage" || profile?.plan === "pro") && profile?.email === "farooquiumair18@gmail.com") && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-left">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isArbitrageMode}
                        onChange={(e) => {
                          setIsArbitrageMode(e.target.checked);
                          if (!e.target.checked) setSubClientId("");
                        }}
                        className="rounded border-slate-350 text-indigo-600 focus:ring-indigo-500 w-4 h-4 shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-800">Enable B2B Arbitrage Mode</span>
                        <p className="text-[10px] text-slate-400 leading-normal">Generate reports for your client agency's sub-clients under their white label.</p>
                      </div>
                    </label>

                    {isArbitrageMode && (
                      <div className="pt-2 border-t border-slate-200/60 animate-fade-in">
                        <label className="block text-[10px] font-bold font-mono uppercase tracking-wider text-slate-500 mb-1">
                          Select End-Client Partner *
                        </label>
                        {availableSubClients.length === 0 ? (
                          <p className="text-[10px] text-amber-600 italic">No sub-clients found. Add sub-clients under this agency inside the Clients Directory tab first.</p>
                        ) : (
                          <select
                            required={isArbitrageMode}
                            value={subClientId}
                            onChange={(e) => setSubClientId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white p-2 text-xs outline-none focus:border-indigo-650 cursor-pointer"
                          >
                            <option value="">-- Choose Sub-Client --</option>
                            {availableSubClients.map(sub => (
                              <option key={sub.id} value={sub.id}>
                                {sub.name} {sub.company ? `(${sub.company})` : ""}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Period Start *
                    </label>
                    <input
                      type="date"
                      required
                      value={periodStart}
                      onChange={e => setPeriodStart(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Period End *
                    </label>
                    <input
                      type="date"
                      required
                      value={periodEnd}
                      onChange={e => setPeriodEnd(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 cursor-pointer"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Custom Report Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Smith Consulting — Weekly Performance Report"
                    value={reportTitle}
                    onChange={e => setReportTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50"
                    maxLength={200}
                  />
                </div>

                <div className="relative p-1 border border-slate-100 rounded-2xl bg-slate-50/20">
                  {plan === "free" && (
                    <div className="absolute inset-0 bg-slate-50/70 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl z-10 p-3 border border-dashed border-slate-200 cursor-pointer text-center animate-fade-in"
                         onClick={() => showLock("Custom Tones & Lengths", "Starter", "$29/mo")}>
                      <Lock className="w-4 h-4 text-indigo-650 mb-1" />
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Starter Feature</span>
                      <span className="text-xs text-slate-750 font-bold mt-0.5">Custom Tones & Length Targets</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Upgrade to generate shorter/longer summaries or apply advanced tone profiles.</p>
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                        AI Content Length Target
                      </label>
                      <div className="grid grid-cols-3 gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/40 font-sans">
                        <button
                          type="button"
                          disabled={plan === "free"}
                          onClick={() => setReportLength("short")}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer text-center ${
                            reportLength === "short"
                              ? "bg-white text-indigo-600 shadow-xs border border-slate-200/30"
                              : "text-slate-500 hover:bg-white/40 hover:text-slate-700"
                          }`}
                        >
                          Short & Concise
                        </button>
                        <button
                          type="button"
                          disabled={plan === "free"}
                          onClick={() => setReportLength("medium")}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer text-center ${
                            reportLength === "medium"
                              ? "bg-white text-indigo-600 shadow-xs border border-slate-200/30"
                              : "text-slate-500 hover:bg-white/40 hover:text-slate-700"
                          }`}
                        >
                          Balanced (Medium)
                        </button>
                        <button
                          type="button"
                          disabled={plan === "free"}
                          onClick={() => setReportLength("detailed")}
                          className={`py-1.5 px-2 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer text-center ${
                            reportLength === "detailed"
                              ? "bg-white text-indigo-600 shadow-xs border border-slate-200/30"
                              : "text-slate-500 hover:bg-white/40 hover:text-slate-700"
                          }`}
                        >
                          Detailed (Exhaustive)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                        Report Aesthetic Tone *
                      </label>
                      <select
                        disabled={plan === "free"}
                        value={reportTone}
                        onChange={e => setReportTone(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-sm font-medium cursor-pointer"
                      >
                        <option value="Formal & Corporate">Formal & Corporate (Corporate Deliverable)</option>
                        <option value="Friendly & Conversational">Friendly & Conversational (Collaborative & Warm)</option>
                        <option value="Bold & Confident">Bold & Confident (Goal & Achievement Focus)</option>
                        <option value="Minimal & Direct">Minimal & Direct (Fast Bullet Summaries)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {reportMode === "document" ? (
                  <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                        Upload Source Document *
                      </label>
                      <button
                        type="button"
                        onClick={downloadDocumentTemplate}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50/50 hover:bg-indigo-100/50 p-1 px-2.5 rounded-lg border border-indigo-100 transition-all cursor-pointer leading-tight"
                      >
                        <Download className="w-3 h-3" />
                        Download Template
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal mb-1">
                      Extract updates directly from project briefs, milestone dumps, spreadsheets, reports or summaries. Supported formats: .pdf, .docx, .txt, .xlsx, .csv, .json files.
                    </p>
                    
                    <div className="relative border-2 border-dashed border-slate-300 bg-white hover:border-indigo-400 rounded-xl p-5 text-center transition-all">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.xlsx,.xls,.csv,.json"
                        id="document-upload-input"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          
                          setIsExtracting(true);
                          setError(null);
                          setExtractedText("");
                          setExtractedFileName("");
                          
                          try {
                            const formData = new FormData();
                            formData.append("file", file);
                            
                            const authHeaders = await getAuthHeaders();
                            const res = await fetch("/api/extract-document", {
                              method: "POST",
                              headers: {
                                ...authHeaders,
                              },
                              body: formData
                            });
                            
                            if (!res.ok) {
                              const errJson = await res.json().catch(() => ({}));
                              throw new Error(errJson.error || "Failed to extract text from file.");
                            }
                            
                            const data = await res.json();
                            setExtractedText(data.text || "");
                            setExtractedFileName(data.filename || file.name);
                            setIsExtractedCollapsed(false); // expand on success
                          } catch (err: any) {
                            console.error(err);
                            setError(err.message || "Failed to parse document text.");
                          } finally {
                            setIsExtracting(false);
                          }
                        }}
                      />
                      <label 
                        htmlFor="document-upload-input" 
                        className="flex flex-col items-center justify-center cursor-pointer space-y-1.5"
                      >
                        {isExtracting ? (
                          <>
                            <div className="w-5.5 h-5.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-xs font-bold text-slate-600 font-sans">Extracting text content from document...</span>
                          </>
                        ) : extractedText ? (
                          <>
                            <span className="text-xl">✅</span>
                            <span className="text-xs font-bold text-indigo-600 font-sans max-w-[280px] truncate">{extractedFileName}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Click to select a different document</span>
                          </>
                        ) : (
                          <>
                            <span className="text-xl">📤</span>
                            <span className="text-xs font-bold text-slate-600 hover:text-indigo-600 font-sans">Choose Document File</span>
                            <span className="text-[10px] text-slate-400">PDF, DOCX, TXT, or Excel spreadsheet</span>
                          </>
                        )}
                      </label>
                    </div>

                    {/* Extracted text preview Section */}
                    {extractedText && (
                      <div className="border border-slate-200 rounded-xl bg-white overflow-hidden mt-3 font-sans">
                        <button
                          type="button"
                          onClick={() => setIsExtractedCollapsed(!isExtractedCollapsed)}
                          className="w-full flex items-center justify-between p-2.5 bg-slate-50 border-b border-slate-100 hover:bg-slate-100/50 transition cursor-pointer text-left text-slate-700 text-xs font-semibold"
                        >
                          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-mono">
                            🔍 Extracted Content Preview ({extractedText.length} chars)
                          </span>
                          <span className="text-[10px] text-slate-400">{isExtractedCollapsed ? "Show View ▽" : "Hide View △"}</span>
                        </button>
                        
                        {!isExtractedCollapsed && (
                          <div className="p-2.5 max-h-32 overflow-y-auto text-xs text-slate-600 bg-slate-50/20 font-mono whitespace-pre-wrap leading-normal select-text">
                            {extractedText}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                      Agency Notes / Milestones Completed *
                    </label>
                    <textarea
                      required={reportMode === "manual"}
                      placeholder="e.g. Completed migrations, deployed authentication layer, finalized visual palette adjustments"
                      rows={4}
                      value={manualNotes}
                      onChange={e => setManualNotes(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 resize-none"
                      maxLength={1500}
                    />
                  </div>
                )}

                {/* KPI metrics inputs and tags */}
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Key Performance Indicators & Metrics (Optional)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Label, e.g. Conversion Rate"
                      value={metricLabel}
                      onChange={e => setMetricLabel(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 outline-none p-2 px-3 bg-slate-50/50"
                    />
                    <input
                      type="text"
                      placeholder="Value, e.g. +14.2%"
                      value={metricValue}
                      onChange={e => setMetricValue(e.target.value)}
                      className="w-28 rounded-xl border border-slate-200 outline-none p-2 px-3 bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={addMetricTag}
                      className="px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold cursor-pointer shrink-0"
                    >
                      Add KPI
                    </button>
                  </div>
                  {/* tag list */}
                  {customMetrics.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {customMetrics.map((tag, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 bg-white border border-slate-200 text-xs rounded-lg py-1 px-2.5 font-sans animate-scale-up"
                        >
                          <span className="font-semibold text-slate-800">{tag.label}:</span>
                          <span className="text-indigo-600 font-mono font-medium">{tag.value}</span>
                          <button
                            type="button"
                            onClick={() => removeMetricTag(idx)}
                            className="text-slate-400 hover:text-slate-600 cursor-pointer font-mono text-[9px] pl-1"
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Personal client message (Optional)
                  </label>
                  <textarea
                    placeholder="e.g. Thanks for your continued support! Excited about the upcoming sprints."
                    rows={2.5}
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 outline-none p-2.5 px-3.5 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 bg-slate-50/50 resize-none"
                    maxLength={1000}
                  />
                </div>

                <div className="pt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowGenModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-sans cursor-pointer text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={generating}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                  >
                    {generating ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Groq AI writing report...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 shrink-0" />
                        Compile Report with Groq AI
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
       {renderModals()}
    </div>
  );
}
