import React, { useState, useEffect } from 'react';
import { Copy, Download, Sparkles, Check, AlertCircle, ArrowRight, ArrowLeft, BookOpen } from 'lucide-react';

export interface ToolField {
  name: string;
  label: string;
  placeholder: string;
  type?: 'text' | 'textarea';
}

interface ToolPageProps {
  title: string;
  description: string;
  fields: ToolField[];
  apiEndpoint: string;
  metaTitle: string;
  metaDescription: string;
  instructions: string[];
}

export default function ToolPage({
  title,
  description,
  fields,
  apiEndpoint,
  metaTitle,
  metaDescription,
  instructions,
}: ToolPageProps) {
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    setRateLimited(false);

    // Validate client-side first
    for (const field of fields) {
      if (!formValues[field.name]?.trim()) {
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
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    required
                    maxLength={500}
                    placeholder={field.placeholder}
                    value={formValues[field.name]}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    rows={4}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-3 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                  />
                ) : (
                  <input
                    type="text"
                    required
                    maxLength={500}
                    placeholder={field.placeholder}
                    value={formValues[field.name]}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-3 text-sm focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all placeholder:text-slate-400"
                  />
                )}
                <div className="text-[10px] text-slate-400 text-right mt-1 font-mono">
                  {formValues[field.name]?.length || 0} / 500 characters
                </div>
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
                Composing with Llama-3 AI...
              </p>
            </div>
          ) : result ? (
            <div className="flex-1 flex flex-col justify-between h-full space-y-6">
              <div className="text-left">
                <span className="text-[9px] font-bold font-mono tracking-widest text-indigo-600 uppercase block mb-3.5">
                  Generated Output
                </span>
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs max-h-[300px] overflow-y-auto text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap select-text">
                  {result}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleCopyToClipboard}
                  className={`flex-1 py-2 px-3 border rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs ${
                    copied
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
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
                  onClick={handleDownloadTxt}
                  className="flex-1 py-2 px-3 bg-white text-slate-700 border border-slate-200 rounded-xl font-bold text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  Download TXT
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

      {/* Global Bottom Marketing CTA banner */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-left shadow-lg">
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
          className="w-full sm:w-auto py-3 px-6 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer text-xs shrink-0 shadow-md border-none"
        >
          Try ReportIQ Free
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
