import React, { useEffect, useState } from "react";
import { supabaseDb } from "../lib/supabase";
import { Report, Profile, Client } from "../types";
import { FileText, Calendar, Building2, Eye, ShieldAlert, CheckCircle2, Award, Printer, Download, Paperclip, Image, Link, Globe, ExternalLink } from "lucide-react";

function getDomainName(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch (e) {
    return url;
  }
}


interface PublicReportProps {
  slug: string;
}

export default function PublicReport({ slug }: PublicReportProps) {
  const [report, setReport] = useState<Report | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reaction, setReaction] = useState<'great' | 'ok' | 'needs_work' | null>(null);
  const [comment, setComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!report || !reaction) return;
    try {
      setSubmittingFeedback(true);
      setFeedbackError(null);
      const res = await fetch(`/api/reports/${report.id}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reaction, comment }),
      });
      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Failed to submit feedback");
      }
      setFeedbackSubmitted(true);
    } catch (err: any) {
      console.error("Failed to submit feedback:", err);
      setFeedbackError(err.message || "An error occurred while submitting feedback. Please try again.");
    } finally {
      setSubmittingFeedback(false);
    }
  };

  useEffect(() => {
    async function loadReport() {
      try {
        setLoading(true);

        const { report: reportData, profile: profileData, client: clientData } = await supabaseDb.getReportBySlug(slug);

        if (!reportData) {
          setError("Report not found or has been revoked.");
          setLoading(false);
          return;
        }

        // Check if report is in a valid public status
        if (reportData.status !== "ready" && reportData.status !== "sent" && reportData.status !== "draft") {
          setError("This report is currently restricted or revoked.");
          setLoading(false);
          return;
        }

        setReport(reportData);
        setProfile(profileData);
        setClient(clientData);

        // Increment view count directly on database
        try {
          const updatedViews = (reportData.viewCount || 0) + 1;
          const updatedRawData = { ...reportData.rawData };

          if (profileData?.plan === 'pro') {
            const currentLogs = Array.isArray(updatedRawData.viewsLog) ? [...updatedRawData.viewsLog] : [];
            currentLogs.push(new Date().toISOString());
            updatedRawData.viewsLog = currentLogs;
          }

          const updatedReport = await supabaseDb.updateReport(reportData.id, reportData.userId, {
            viewCount: updatedViews,
            rawData: updatedRawData,
          });
          setReport(updatedReport);
        } catch (viewErr) {
          console.warn("View counter could not be incremented on database (this is expected for guests):", viewErr);
        }

      } catch (err: any) {
        console.error("Error loading public report:", err);
        setError("Unable to load report. Please try again later.");
      } finally {
        setLoading(false);
        // Direct auto-print trigger for seamless print/save PDF iframe escaping
        try {
          const params = new URLSearchParams(window.location.search);
          if (params.get("print") === "true") {
            setTimeout(() => {
              window.focus();
              window.print();
            }, 1000);
          }
        } catch (err) {
          console.warn("Auto-print check failed gracefully:", err);
        }
      }
    }

    if (slug) {
      loadReport();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
          <p className="text-slate-500 font-sans tracking-wide text-sm animate-pulse">
            Configuring secure connection & loading ReportIQ content...
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold font-display text-slate-900 mb-2">Access Restricted</h1>
          <p className="text-slate-600 text-sm mb-6">{error || "The requested document is unavailable."}</p>
          <p className="text-xs text-slate-400 font-mono">Status: SECURE_GATE_DENIED</p>
        </div>
      </div>
    );
  }

  // Extract client-specific brand configuration if present (Option 2)
  const getClientBranding = () => {
    let clientBrandColor = "";
    try {
      const parsed = JSON.parse(client?.notes || "{}");
      if (parsed && typeof parsed === "object" && parsed.brandColor) {
        clientBrandColor = parsed.brandColor;
      }
    } catch (e) {}

    return {
      brandColor: clientBrandColor || profile?.brandColor || "#6366f1",
      agencyName: client?.company || profile?.agencyName || "Smith Digital",
      logoUrl: client?.logoUrl || profile?.brandLogoUrl || null
    };
  };

  const { brandColor, agencyName, logoUrl } = getClientBranding();

  const downloadAsHtml = () => {
    if (!report) return;
    const clientName = client?.name || "Client Partner";

    const sectionsHtml = (report.sections || []).map((section) => `
      <div class="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs" style="margin-bottom: 1.5rem;">
        <div class="flex items-center gap-3 mb-4" style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style="background-color: ${brandColor}15; width: 2rem; height: 2rem; border-radius: 0.5rem; display: flex; align-items: center; justify-center; flex-shrink: 0;">
            <span style="color: ${brandColor}; font-weight: bold; font-family: monospace;">✓</span>
          </div>
          <h2 class="text-lg font-bold font-display text-slate-950" style="font-size: 1.125rem; font-weight: 700; font-family: 'Space Grotesk', sans-serif; color: #020617; margin: 0;">${section.title}</h2>
        </div>
        <p class="text-slate-700 leading-relaxed text-base whitespace-pre-wrap" style="color: #334155; line-height: 1.625; font-size: 1rem; white-space: pre-wrap; padding-left: 2.75rem; margin: 0;">${section.content}</p>
      </div>
    `).join('\n'); const attachments = report.attachments || [];
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
                  <a href="${att.url}" target="_blank" rel="noopener noreferrer" class="inline-flex flex-col items-start gap-1 py-2.5 px-4 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition shadow-3xs hover:shadow-2xs">
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
  <title>${report.title}</title>
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
<body class="bg-slate-50 text-slate-800 min-h-screen flex flex-col justify-between antialiased">
  <div style="background-color: ${brandColor}" class="h-2.5 w-full shrink-0"></div>

  <header class="bg-white border-b border-slate-200 py-6 px-6 sm:px-12 sticky top-0 z-10 shadow-xs no-print">
    <div class="max-w-4xl mx-auto flex items-center justify-between">
      <div class="flex items-center space-x-3">
        ${logoUrl ? `
          <img src="${logoUrl}" alt="${agencyName}" class="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1" />
        ` : `
          <div style="background-color: ${brandColor}" class="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white text-base font-bold">
            ${agencyName.charAt(0).toUpperCase()}
          </div>
        `}
        <div>
          <p class="font-bold text-slate-955 font-display tracking-tight text-base leading-tight">${agencyName}</p>
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
          ${logoUrl ? `
            <img src="${logoUrl}" alt="${agencyName}" class="max-h-12 w-auto object-contain rounded-lg border border-slate-200 p-1" />
            <span class="text-lg font-bold text-slate-955 font-display" style="font-family: 'Space Grotesk', sans-serif;">${agencyName}</span>
          ` : `
            <span class="text-lg font-bold text-slate-955 font-display" style="font-family: 'Space Grotesk', sans-serif;">${agencyName}</span>
          `}
        </div>

        <!-- Report Title -->
        <h1 class="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 tracking-tight leading-normal mt-2" style="font-family: 'Space Grotesk', sans-serif; font-weight: 800; margin: 0;">${report.title}</h1>
        
        <!-- Client Name and Period -->
        <div class="flex flex-wrap items-center gap-4 mt-2 text-sm text-slate-500 font-sans" style="display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; font-size: 0.875rem; color: #64748b;">
          <span>Client partner: ${clientName}</span>
          <span>Period: ${report.periodStart} – ${report.periodEnd}</span>
        </div>
      </div>

      ${report.aiSummary ? `
      <div class="relative p-6 bg-slate-50 rounded-xl border-l-[4px]" style="border-left-color: ${brandColor}; position: relative; padding: 1.5rem; background-color: #f8fafc; border-radius: 0.75rem; border-left-width: 4px;">
        <h3 class="font-display font-bold text-slate-900 mb-2" style="font-family: 'Space Grotesk', sans-serif; font-weight: 700; color: #020617; margin-bottom: 0.5rem;">Executive Summary</h3>
        <p class="text-slate-700 leading-relaxed text-base italic" style="color: #334155; font-style: italic; font-size: 1rem; line-height: 1.625;">"${report.aiSummary}"</p>
      </div>
      ` : ''}
    </div>

    ${report.customMessage ? `
    <div class="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-xs print-card" style="margin-bottom: 2rem;">
      <h3 class="text-xs font-mono font-semibold uppercase tracking-wider text-slate-500 mb-3" style="font-size: 0.75rem; font-family: monospace; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 0.75rem;">
        Message from ${agencyName}
      </h3>
      <p class="text-slate-750 leading-relaxed text-base whitespace-pre-wrap" style="color: #334155; line-height: 1.625; font-size: 1rem; white-space: pre-wrap; margin: 0;">${report.customMessage}</p>
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
    link.download = `${report ? report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-") : "public"}-report.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(fileUrl);
  };

  const isWhiteLabel = profile?.plan === 'pro' && profile?.whiteLabel === true;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {isWhiteLabel && (
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
      {/* Dynamic top bar branded with customized profile color */}
      <div style={{ backgroundColor: brandColor }} className="h-2.5 w-full shrink-0" />

      <header className="bg-white border-b border-slate-200 py-6 px-6 sm:px-12 sticky top-0 z-10 shadow-xs no-print">
        <div className="max-w-4xl mx-auto flex items-center justify-between font-sans">
          <div className="flex items-center space-x-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={agencyName}
                className="w-10 h-10 rounded-xl object-contain bg-slate-50 border border-slate-200 p-1"
              />
            ) : (
              <div
                style={{ backgroundColor: brandColor }}
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs text-white"
              >
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-950 font-display tracking-tight text-base leading-tight">
                {agencyName}
              </p>
              <p className="text-xs text-slate-500 font-mono">CLIENT PORTAL</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                window.focus();
                window.print();
              }}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all no-print"
              title="Print report or save to PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button
              onClick={downloadAsHtml}
              className="py-1.5 px-3 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-semibold cursor-pointer flex items-center gap-1.5 transition-all no-print"
              title="Download offline HTML document"
            >
              <Download className="w-3.5 h-3.5" />
              Download HTML
            </button>
            <div className="hidden sm:flex items-center space-x-3 sm:space-x-5 text-xs text-slate-500 bg-slate-100 rounded-full py-1.5 px-3">
              <span className="flex items-center gap-1 font-mono">
                <Eye className="w-3.5 h-3.5 text-slate-400" />
                {report.viewCount} views
              </span>
            </div>
          </div>
        </div>
      </header>

      <main id="printable-report-area" className="flex-1 max-w-4xl w-full mx-auto px-6 py-12">
        {/* Cover Section with agency name, client name and subtle gradient using brand color */}
        <div
          className="relative rounded-3xl overflow-hidden p-8 sm:p-12 mb-8 shadow-md text-white border border-slate-200/20 transition-all duration-500 ease-out"
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
                {report.title}
              </h1>
            </div>

            {/* Client name and report period below */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm font-medium text-white/90">
              <span className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-white/70" />
                {client?.name || "Client Partner"}
              </span>
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-white/70" />
                {report.periodStart} – {report.periodEnd}
              </span>
            </div>
          </div>
        </div>

        {/* AI Executive Summary section */}
        {report.aiSummary && (
          <div
            className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-xs relative overflow-hidden font-sans transition-all duration-500 ease-out"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: brandColor }} />
            <div
              className="absolute top-4 right-4 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
              style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
            >
              AI Executive Summary
            </div>
            <h3 className="font-display font-bold text-slate-900 mb-2.5 text-base">Executive Summary</h3>
            <p className="text-slate-700 leading-relaxed text-sm italic">
              "{report.aiSummary}"
            </p>
          </div>
        )}

        {/* Custom Message if exists */}
        {report.customMessage && (
          <div
            className="bg-white rounded-2xl border border-slate-200 p-8 mb-8 shadow-xs relative overflow-hidden font-sans transition-all duration-500 ease-out"
          >
            <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-300" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3">
              Personal Message from {agencyName}
            </h3>
            <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap">
              {report.customMessage}
            </p>
          </div>
        )}

        {/* Report Work Sections with brand color left borders and motion animations */}
        <div className="space-y-6">
          {report.sections && report.sections.length > 0 ? (
            report.sections.map((section, idx) => {
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border-y border-r border-l-[6px] border-slate-250 p-8 shadow-xs hover:border-slate-300 transition-all duration-300"
                  style={{ borderLeftColor: brandColor }}
                >
                  <div className="flex items-center gap-3 mb-4 font-sans">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${brandColor}15` }}
                    >
                      <CheckCircle2 className="w-4 h-4" style={{ color: brandColor }} />
                    </div>
                    <h2 className="text-lg font-bold font-display text-slate-950">
                      {section.title}
                    </h2>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-wrap pl-11 font-sans">
                    {section.content}
                  </p>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs font-sans">
              <p className="text-slate-500">No report sections available.</p>
            </div>
          )}
        </div>

        {/* Attachments & Resources section */}
        {report.attachments && report.attachments.length > 0 && (
          <div
            className="mt-12 pt-8 border-t border-slate-200 font-sans transition-all duration-500 ease-out"
          >
            <h3 className="text-lg font-bold font-display text-slate-950 mb-6 flex items-center gap-2">
              <Paperclip className="w-5 h-5 text-indigo-600" />
              Attachments & Resources
            </h3>

            <div className="space-y-6">
              {/* Images Grid */}
              {report.attachments.some(att => att.type === 'image') && (
                <div className="space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Images</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {report.attachments.filter(att => att.type === 'image').map(att => (
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
              {report.attachments.some(att => att.type === 'doc') && (
                <div className="space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Documents</h4>

                  {/* Screen view: Download cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                    {report.attachments.filter(att => att.type === 'doc').map(att => (
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
                    {report.attachments.filter(att => att.type === 'doc').map(att => (
                      <div key={att.id} className="text-slate-800 text-sm font-sans">
                        <span className="font-semibold">{att.name}</span> – Download URL: <a href={att.url} className="text-indigo-600 underline font-mono text-xs">{att.url}</a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              {report.attachments.some(att => att.type === 'link') && (
                <div className="space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Links</h4>

                  {/* Screen view: Styled clickable buttons with the label */}
                  <div className="flex flex-wrap gap-3 print:hidden">
                    {report.attachments.filter(att => att.type === 'link').map(att => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex flex-col items-start gap-1 py-2.5 px-4 rounded-xl border border-slate-250 bg-white hover:bg-slate-50 text-slate-700 hover:text-indigo-600 transition shadow-3xs hover:shadow-2xs"
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
                    {report.attachments.filter(att => att.type === 'link').map(att => (
                      <div key={att.id} className="text-slate-800 text-sm font-sans">
                        <a href={att.url} className="text-indigo-650 underline font-semibold">{att.name}</a> – <span className="font-mono text-xs text-slate-500">{att.url}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Website Previews */}
              {report.attachments.some(att => att.type === 'preview') && (
                <div className="space-y-3 print:break-inside-avoid">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Website Previews</h4>

                  {/* Screen view: Cards with URL and Visit button */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:hidden">
                    {report.attachments.filter(att => att.type === 'preview').map(att => (
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
                    {report.attachments.filter(att => att.type === 'preview').map(att => (
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

        {/* Client Feedback Widget */}
        <div className="mt-12 pt-8 border-t border-slate-200 font-sans no-print">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs max-w-xl mx-auto transition-all duration-300">
            {feedbackSubmitted ? (
              <div className="text-center py-6 flex flex-col items-center justify-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <CheckCircle2 className="w-6 h-6" style={{ color: brandColor }} />
                </div>
                <h3 className="text-lg font-bold font-display text-slate-900 mb-1">Thank You!</h3>
                <p className="text-slate-600 text-sm">Your feedback has been submitted to the agency.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="space-y-6">
                <div>
                  <h3 className="text-base font-bold font-display text-slate-900 text-center mb-4">
                    How was this report?
                  </h3>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setReaction('great')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${reaction === 'great'
                          ? 'bg-slate-50 border-indigo-600 shadow-sm scale-102'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      style={reaction === 'great' ? { borderColor: brandColor, color: brandColor } : {}}
                    >
                      <span className="text-2xl mb-1.5" role="img" aria-label="Great">👍</span>
                      <span className="text-xs">Great</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReaction('ok')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${reaction === 'ok'
                          ? 'bg-slate-50 border-indigo-600 shadow-sm scale-102'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      style={reaction === 'ok' ? { borderColor: brandColor, color: brandColor } : {}}
                    >
                      <span className="text-2xl mb-1.5" role="img" aria-label="OK">😐</span>
                      <span className="text-xs">OK</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setReaction('needs_work')}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-semibold transition-all duration-200 cursor-pointer ${reaction === 'needs_work'
                          ? 'bg-slate-50 border-indigo-600 shadow-sm scale-102'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                        }`}
                      style={reaction === 'needs_work' ? { borderColor: brandColor, color: brandColor } : {}}
                    >
                      <span className="text-2xl mb-1.5" role="img" aria-label="Needs Work">👎</span>
                      <span className="text-xs text-nowrap">Needs Work</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="feedback-comment" className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Add a comment (optional)
                  </label>
                  <textarea
                    id="feedback-comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share any thoughts or questions about this report..."
                    className="w-full rounded-xl border border-slate-250 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-shadow placeholder:text-slate-400 bg-white"
                    style={{ '--tw-ring-color': brandColor } as React.CSSProperties}
                  />
                </div>

                {feedbackError && (
                  <p className="text-xs text-red-600 text-center font-medium bg-red-50 py-2 px-3 rounded-lg border border-red-100">
                    {feedbackError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!reaction || submittingFeedback}
                  className={`w-full py-2.5 px-4 rounded-xl text-white font-semibold text-sm shadow-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${!reaction
                      ? 'bg-slate-300 cursor-not-allowed opacity-75'
                      : 'hover:brightness-95 active:scale-98'
                    }`}
                  style={reaction ? { backgroundColor: brandColor } : {}}
                >
                  {submittingFeedback ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Feedback"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      {/* Styled Business prepared-by footer with calendar created-at dates details */}
      <footer className="bg-white border-t border-slate-200 py-8 px-6 mt-12 text-center text-slate-500 text-sm no-print font-sans">
        <p className="font-sans">
          This secure client report is prepared with care by{" "}
          <span className="font-semibold text-slate-900" style={{ color: brandColor }}>{agencyName}</span>.
        </p>
        <p className="text-xs text-slate-400 font-mono mt-1">
          Prepared on {new Date(report.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
        {profile?.plan !== 'pro' && (
          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
            Powered by ReportIQ · Automated Professional Deliverables
          </p>
        )}
      </footer>
    </div>
  );
}
