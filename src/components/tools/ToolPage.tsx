import React, { useState, useEffect } from 'react';
import { Copy, Download, Sparkles, Check, AlertCircle, ArrowRight, ArrowLeft, BookOpen, Lock, X, Upload, FileText } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export interface ToolField {
  name: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'textarea';
  required?: boolean;
  maxLength?: number;
}

interface ToolPageProps {
  title: string;
  description: string;
  fields: ToolField[];
  apiEndpoint: string;
  metaTitle: string;
  metaDescription: string;
  instructions: string[];
  seoContent?: React.ReactNode;
  allowDocumentUpload?: boolean;
}

const RELATED_TOOLS = [
  {
    name: 'Client Report Generator',
    description: 'Generate a professional client report instantly with AI. Summarize work completed, results, and upcoming plans.',
    route: '/tools/client-report-generator',
  },
  {
    name: 'Agency Report Template',
    description: 'Create professional agency reports in seconds. Write executive summaries, work results, and next steps.',
    route: '/tools/agency-report-template',
  },
  {
    name: 'SEO Report Generator',
    description: 'Generate professional SEO performance reports targeting search keywords, traffic metrics, and optimization plans.',
    route: '/tools/seo-report-generator',
  },
  {
    name: 'Client Update Email Writer',
    description: 'Draft professional, encouraging client update emails detailing weekly tasks, accomplishments, and next milestones.',
    route: '/tools/client-update-email',
  },
  {
    name: 'Monthly Report Template',
    description: 'Produce high-quality monthly progress reports for your business, highlighting key achievements and next month plans.',
    route: '/tools/monthly-report-template',
  },
  {
    name: 'KPI Report Generator',
    description: 'Compile detailed KPI summary reports containing metrics, performance analysis, highlights, and growth recommendations.',
    route: '/tools/kpi-report-generator',
  },
  {
    name: 'Social Media Report Generator',
    description: 'Analyze social channel performance. Generate breakdown summaries, engagement highlights, and future strategies.',
    route: '/tools/social-media-report',
  },
  {
    name: 'Invoice Description Writer',
    description: 'Write professional descriptions for invoice line items, covering design, consulting, and development hours.',
    route: '/tools/invoice-description-writer',
  },
  {
    name: 'Project Status Report Writer',
    description: 'Track project health. Generate status summaries, highlight bottlenecks or blockers, and specify next actions.',
    route: '/tools/project-status-report',
  },
  {
    name: 'Client Onboarding Email Writer',
    description: 'Draft warm client onboarding emails welcoming new customers and aligning them on what to expect.',
    route: '/tools/client-onboarding-email',
  },
  {
    name: 'Competitor Analysis Generator',
    description: 'Create professional competitor analysis summaries instantly with AI. Outline brand positioning and market advantages.',
    route: '/tools/competitor-analysis-generator',
  },
  {
    name: 'Weekly Progress Report Generator',
    description: 'Create professional weekly project updates for your clients. Summarize completed tasks and next-week objectives.',
    route: '/tools/weekly-report-generator',
  },
  {
    name: 'PPC Ads Performance Report Writer',
    description: 'Compile paid marketing performance summaries. Showcase conversion growth, click metrics, CPA, and ROAS.',
    route: '/tools/ppc-performance-report',
  },
  {
    name: 'Scope of Work (SOW) Generator',
    description: 'Draft comprehensive project scopes of work in seconds. Clearly specify deliverables, budgets, and timelines.',
    route: '/tools/scope-of-work-generator',
  },
  {
    name: 'Project Post-Mortem Debrief Writer',
    description: 'Run retrospectives and debrief summaries with AI. Highlight key successes, operational challenges, and lessons.',
    route: '/tools/project-post-mortem-generator',
  },
  {
    name: 'Client Onboarding Checklist Writer',
    description: 'Generate customized onboarding questionnaires to kick off client projects. Gather assets and preferences.',
    route: '/tools/onboarding-questionnaire-generator',
  },
];

export default function ToolPage({
  title,
  description,
  fields,
  apiEndpoint,
  metaTitle,
  metaDescription,
  instructions,
  seoContent,
  allowDocumentUpload = false,
}: ToolPageProps) {
  const [user, setUser] = useState<any>(null);
  const [showExitPopup, setShowExitPopup] = useState(false);
  const [exitEmail, setExitEmail] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Track auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Exit intent popup detection
  useEffect(() => {
    if (user) return;
    const dismissed = sessionStorage.getItem('exit-intent-dismissed');
    if (dismissed === 'true') return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 15) {
        setShowExitPopup(true);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [user]);

  const handleExitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('exit-intent-dismissed', 'true');
    setShowExitPopup(false);
    window.dispatchEvent(new CustomEvent('open-auth', {
      detail: { mode: 'signup', email: exitEmail }
    }));
  };

  const handleDismissExit = () => {
    sessionStorage.setItem('exit-intent-dismissed', 'true');
    setShowExitPopup(false);
  };

  // Update document metadata dynamically
  useEffect(() => {
    document.title = metaTitle;
    const metaDescEl = document.querySelector('meta[name="description"]');
    if (metaDescEl) {
      metaDescEl.setAttribute('content', metaDescription);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = metaDescription;
      document.head.appendChild(newMeta);
    }
  }, [metaTitle, metaDescription]);

  // Form state dynamically mapped to field names
  const [formValues, setFormValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    fields.forEach((f) => {
      initial[f.name] = '';
    });
    return initial;
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (fieldName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user) {
      window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signup' }));
      return;
    }

    setUploadingField(fieldName);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { getAuthHeaders } = await import('../../lib/supabase');
      const authHeaders = await getAuthHeaders();

      const response = await fetch('/api/extract-document', {
        method: 'POST',
        headers: {
          ...authHeaders,
        },
        body: formData,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to extract text from file.');
      }

      const data = await response.json();
      const extractedText = data.text || '';
      
      const targetField = fields.find(f => f.name === fieldName);
      const maxL = targetField?.maxLength || 500;

      setFormValues((prev) => ({
        ...prev,
        [fieldName]: extractedText.slice(0, maxL)
      }));
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to parse file.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setRateLimited(false);

    // Validate client-side first
    for (const field of fields) {
      if (field.required !== false && !formValues[field.name]?.trim()) {
        setError('All fields are required');
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formValues),
      });

      const contentType = response.headers.get('content-type') || '';
      let data: any = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text || `Server returned status ${response.status}`);
      }

      if (response.status === 429 || data.limited) {
        setRateLimited(true);
        setError(data.message || "You have reached today's free limit.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      setResult(data.result);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating the report.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownloadTxt = () => {
    if (!result) return;
    const element = document.createElement('a');
    const file = new Blob([result], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 font-sans">
      {/* Back button link to main tools lobby */}
      <button
        onClick={() => {
          window.history.pushState(null, '', '/tools');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        className="group flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-8 cursor-pointer select-none bg-transparent border-none"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
        Back to Free AI Tools
      </button>

      {/* Hero Headline section */}
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-5xl font-black font-display text-slate-950 tracking-tight leading-tight mb-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-slate-550 text-base max-w-xl mx-auto font-sans leading-relaxed">
          {description}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start mb-16">
        {/* Form panel card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleGenerate} className="space-y-5">
            {fields.map((field) => (
              <div key={field.name} className="text-left">
                <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                  {field.label} {field.required === false && <span className="text-slate-400 font-sans normal-case">(Optional)</span>}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    required={field.required !== false}
                    maxLength={field.maxLength || 500}
                    placeholder={field.placeholder}
                    value={formValues[field.name]}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-3 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                  />
                ) : (
                  <input
                    type="text"
                    required={field.required !== false}
                    maxLength={field.maxLength || 500}
                    placeholder={field.placeholder}
                    value={formValues[field.name]}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-3 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                  />
                )}
                <div className="flex justify-between items-center mt-1 text-[10px] text-slate-400 font-mono">
                  <span>
                    {field.required === false ? 'Optional field' : 'Required field'}
                  </span>
                  <span>
                    {formValues[field.name]?.length || 0} / {field.maxLength || 500} characters
                  </span>
                </div>

                {field.type === 'textarea' && allowDocumentUpload && (
                  <div className="mt-2.5 flex items-center justify-between text-[11px] bg-slate-50 border border-slate-200/65 rounded-xl p-2.5">
                    <div className="flex flex-col gap-0.5 text-left">
                      <span className="font-semibold text-slate-700">Auto-fill from spreadsheet/document</span>
                      <span className="text-[10px] text-slate-400 font-sans">Upload PDF, DOCX, XLSX, CSV, JSON</span>
                    </div>
                    <div className="relative">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.xlsx,.xls,.csv,.json"
                        id={`file-upload-${field.name}`}
                        className="hidden"
                        disabled={uploadingField === field.name}
                        onChange={(e) => handleFileUpload(field.name, e)}
                      />
                      <label
                        htmlFor={`file-upload-${field.name}`}
                        className="flex items-center gap-1.5 py-1.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-slate-600 hover:text-indigo-600 text-[10px] font-bold cursor-pointer transition-all shadow-3xs"
                      >
                        {uploadingField === field.name ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Parsing...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload File</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {error && !rateLimited && (
              <div className="p-3.5 bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold rounded-xl flex gap-2 items-start text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {rateLimited && (
              <div className="p-4 bg-purple-50 border border-purple-100 text-indigo-950 text-xs rounded-2xl space-y-3.5 text-left shadow-2xs">
                <div className="flex gap-2 items-start">
                  <AlertCircle className="w-4.5 h-4.5 shrink-0 text-indigo-600 mt-0.5" />
                  <p className="leading-relaxed font-sans">
                    {error}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    window.history.pushState(null, '', '/');
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }}
                  className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-[11px] shadow-xs"
                >
                  Create Free Account
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Generating report...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Free AI Report
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results display panel card */}
        <div className="bg-slate-100/50 border border-slate-200/80 rounded-3xl p-6 sm:p-8 min-h-[350px] flex flex-col justify-between shadow-2xs relative">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-3.5">
              <div className="w-9 h-9 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin"></div>
              <p className="text-slate-450 font-mono text-[9px] uppercase tracking-widest animate-pulse">
                Composing with GPT OSS AI...
              </p>
            </div>
          ) : result ? (
            <div className="flex-1 flex flex-col justify-between h-full space-y-6">
              <div className="text-left">
                <span className="text-[9px] font-bold font-mono tracking-widest text-indigo-600 uppercase block mb-3.5">
                  Generated Output
                </span>
                
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-3xs">
                  {user ? (
                    <div id="printable-report-area" className="print:p-4 print:max-h-none print:overflow-visible">
                      {/* Print only header */}
                      <div className="hidden print:block mb-6 border-b border-slate-200 pb-4 text-left">
                        <h1 className="text-xl font-bold font-display text-slate-900">{title}</h1>
                        <p className="text-[10px] text-slate-450 font-mono tracking-wider uppercase mt-1">Generated via ReportIQ AI Engine</p>
                      </div>
                      <div className="max-h-[300px] print:max-h-none overflow-y-auto print:overflow-visible text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text text-left">
                        {result}
                      </div>
                    </div>
                  ) : (
                    <div className="relative min-h-[200px]">
                      {/* Preview Text */}
                      <div className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text text-left">
                        {result.slice(0, 150)}
                      </div>
                      
                      {/* Blurred Remainder */}
                      {result.length > 150 && (
                        <div 
                          className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-none opacity-60 pointer-events-none mt-2 text-left"
                          style={{ filter: 'blur(4px)' }}
                        >
                          {result.slice(150)}
                        </div>
                      )}
                      
                      {/* Overlay Box */}
                      <div className="absolute inset-x-0 bottom-0 top-[60px] bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end p-2 pt-10 text-center z-10">
                        <div className="bg-white border border-slate-150 rounded-2xl p-4 sm:p-5 shadow-md max-w-sm w-full space-y-3">
                          <div className="w-9 h-9 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center mx-auto text-indigo-650">
                            <Lock className="w-4.5 h-4.5" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">Your full report is ready</h4>
                            <p className="text-[10px] sm:text-[11px] text-slate-500 leading-normal">
                              Sign up free in 30 seconds to unlock the complete report — no credit card needed
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              window.dispatchEvent(new CustomEvent('open-auth', { detail: 'signup' }));
                            }}
                            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-[11px] transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1"
                          >
                            Get Full Report Free &rarr;
                          </button>
                          <p className="text-[9px] text-slate-400">
                            Join 500+ freelancers and agencies already using ReportIQ
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 z-20">
                <button
                  disabled={!user}
                  onClick={user ? handleCopyToClipboard : undefined}
                  title={user ? undefined : "Sign up free to copy, download and print"}
                  className={`flex-1 py-2 px-3 border rounded-xl font-bold text-[10px] tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-3xs ${
                    !user
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      : copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-pointer'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      Copy Content
                    </>
                  )}
                </button>
                <button
                  disabled={!user}
                  onClick={user ? handleDownloadTxt : undefined}
                  title={user ? undefined : "Sign up free to copy, download and print"}
                  className={`flex-1 py-2 px-3 border rounded-xl font-bold text-[10px] tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-3xs ${
                    !user
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 cursor-pointer'
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  Download TXT
                </button>
                <button
                  disabled={!user}
                  onClick={user ? () => window.print() : undefined}
                  title={user ? undefined : "Sign up free to copy, download and print"}
                  className={`flex-1 py-2 px-3 border rounded-xl font-bold text-[10px] tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-3xs ${
                    !user
                      ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
                      : 'bg-indigo-650 hover:bg-indigo-750 text-white border-indigo-655 cursor-pointer hover:text-white shadow-xs'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-200" />
                  Print / PDF
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-center">
              <Sparkles className="w-8 h-8 text-indigo-400/80 mb-3 animate-pulse" />
              <p className="text-xs font-semibold text-slate-500">
                Ready to generate
              </p>
              <p className="text-[10px] text-slate-400 max-w-xs mt-1 leading-normal">
                Fill out the required form fields on the left and click generate to create your report summary.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Instructions & SEO tips section */}
      {instructions && instructions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-3xs mb-8 text-left">
          <h2 className="text-base font-bold font-display text-slate-950 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            How to Use This Tool & SEO Tips
          </h2>
          <ul className="space-y-3.5 text-slate-600 text-xs sm:text-sm list-none pl-0">
            {instructions.map((ins, i) => (
              <li key={i} className="leading-relaxed flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0 mt-2"></span>
                <span dangerouslySetInnerHTML={{ __html: ins }} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Educational SEO Section */}
      {seoContent && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-3xs mb-8 text-left">
          {seoContent}
        </div>
      )}

      {/* Related Free Tools Section */}
      <div className="border-t border-slate-200 pt-12 mb-8 text-left">
        <h3 className="text-xl font-bold font-display text-slate-950 mb-1">Related Free Tools</h3>
        <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-6">People also search for</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RELATED_TOOLS.filter(t => t.route !== window.location.pathname).slice(0, 3).map((tool, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs hover:border-indigo-200 transition-all flex flex-col justify-between group text-left"
            >
              <div>
                <h4 className="font-bold text-sm text-slate-955 mb-1.5 group-hover:text-indigo-600 transition-colors">
                  {tool.name}
                </h4>
                <p className="text-xs text-slate-500 leading-normal line-clamp-3">
                  {tool.description}
                </p>
              </div>
              <button
                onClick={() => {
                  window.history.pushState(null, '', tool.route);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full mt-4 py-2 bg-slate-50 hover:bg-indigo-650 hover:text-white border border-slate-200 hover:border-indigo-650 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                Try Free &rarr;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Global Bottom Marketing CTA banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-left shadow-lg mb-8">
        <div className="space-y-1">
          <span className="inline-flex px-2 py-0.5 leading-none bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/20 text-[9px] font-mono font-bold uppercase tracking-wider">
            Premium Features
          </span>
          <h3 className="text-lg font-bold font-display text-white mt-1">
            Want AI to automate your entire client reporting?
          </h3>
          <p className="text-slate-400 text-xs leading-relaxed max-w-lg">
            Unlock automatic data integrations, white-labeled client portal URLs, and unlimited generated reports.
          </p>
        </div>
        <button
          onClick={() => {
            window.history.pushState(null, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="w-full sm:w-auto py-3 px-6 bg-indigo-600 hover:bg-indigo-755 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shrink-0 shadow-md border-none"
        >
          Try ReportIQ Free
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Exit Intent Popup */}
      {showExitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6.5 shadow-2xl relative animate-scale-up text-left font-sans">
            <button
              onClick={handleDismissExit}
              className="absolute top-4.5 right-4.5 text-slate-400 hover:text-slate-655 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors border-none bg-transparent"
              title="Close"
            >
              <X className="w-4.5 h-4.5" />
            </button>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="inline-flex px-2 py-0.5 leading-none bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 text-[10px] font-mono font-bold uppercase tracking-wider">
                  Special Offer
                </span>
                <h3 className="text-xl font-bold font-display text-slate-950 leading-tight">
                  Wait — your report is almost ready
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Sign up free and get unlimited access to all 10 AI tools plus full client reporting. No credit card needed.
                </p>
              </div>

              <form onSubmit={handleExitSubmit} className="space-y-3 pt-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email address"
                  value={exitEmail}
                  onChange={(e) => setExitEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-3 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400 font-sans"
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-xs border-none"
                >
                  Get Free Access &rarr;
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
