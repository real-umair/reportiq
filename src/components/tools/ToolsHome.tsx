import React, { useEffect } from 'react';
import { 
  FileText, 
  Building2, 
  Globe, 
  Mail, 
  Calendar, 
  TrendingUp, 
  Share2, 
  DollarSign, 
  ClipboardList, 
  UserCheck, 
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface ToolCard {
  name: string;
  description: string;
  route: string;
  icon: React.ComponentType<any>;
}

export default function ToolsHome() {
  // Update page title/meta description
  useEffect(() => {
    document.title = 'Free AI Tools for Freelancers & Agencies | ReportIQ';
    const metaDescEl = document.querySelector('meta[name="description"]');
    if (metaDescEl) {
      metaDescEl.setAttribute('content', 'Explore 10 free AI-powered reporting tools for digital marketing agencies, SEO professionals, and freelancers. No signup required.');
    }
  }, []);

  const tools: ToolCard[] = [
    {
      name: 'Client Report Generator',
      description: 'Generate a professional client report instantly with AI. Summarize work completed, results, and upcoming plans.',
      route: '/tools/client-report-generator',
      icon: FileText,
    },
    {
      name: 'Agency Report Template',
      description: 'Create professional agency reports in seconds. Write executive summaries, work results, and next steps.',
      route: '/tools/agency-report-template',
      icon: Building2,
    },
    {
      name: 'SEO Report Generator',
      description: 'Generate professional SEO performance reports targeting search keywords, traffic metrics, and optimization plans.',
      route: '/tools/seo-report-generator',
      icon: Globe,
    },
    {
      name: 'Client Update Email Writer',
      description: 'Draft professional, encouraging client update emails detailing weekly tasks, accomplishments, and next milestones.',
      route: '/tools/client-update-email',
      icon: Mail,
    },
    {
      name: 'Monthly Report Template',
      description: 'Produce high-quality monthly progress reports for your business, highlighting key achievements and next month plans.',
      route: '/tools/monthly-report-template',
      icon: Calendar,
    },
    {
      name: 'KPI Report Generator',
      description: 'Compile detailed KPI summary reports containing metrics, performance analysis, highlights, and growth recommendations.',
      route: '/tools/kpi-report-generator',
      icon: TrendingUp,
    },
    {
      name: 'Social Media Report Generator',
      description: 'Analyze social channel performance. Generate breakdown summaries, engagement highlights, and future strategies.',
      route: '/tools/social-media-report',
      icon: Share2,
    },
    {
      name: 'Invoice Description Writer',
      description: 'Write professional descriptions for invoice line items, covering design, consulting, and development hours.',
      route: '/tools/invoice-description-writer',
      icon: DollarSign,
    },
    {
      name: 'Project Status Report Writer',
      description: 'Track project health. Generate status summaries, highlight bottlenecks or blockers, and specify next actions.',
      route: '/tools/project-status-report',
      icon: ClipboardList,
    },
    {
      name: 'Client Onboarding Email Writer',
      description: 'Draft warm client onboarding emails welcoming new customers and aligning them on what to expect.',
      route: '/tools/client-onboarding-email',
      icon: UserCheck,
    },
  ];

  const handleNavigate = (route: string) => {
    window.history.pushState(null, '', route);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 font-sans">
      {/* Hero Header Section */}
      <div className="text-center mb-16">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-100 text-indigo-750 font-bold rounded-full text-xs font-mono uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
          Free Resources
        </span>
        <h1 className="text-4xl sm:text-6xl font-black font-display text-slate-950 tracking-tight leading-none mb-6">
          Free AI Tools for<br />
          <span className="text-indigo-600 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Freelancers & Agencies</span>
        </h1>
        <p className="text-slate-550 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Unlock 10 free AI-powered drafting utilities. Instantly generate reports, status summaries, onboarding emails, and client updates. No credit card or signup required.
        </p>
      </div>

      {/* Grid of 10 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
        {tools.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <div 
              key={idx} 
              className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between items-start text-left group hover:border-indigo-200"
            >
              <div className="space-y-4">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0 transition-colors group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold font-display text-slate-950 text-base leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => handleNavigate(tool.route)}
                className="w-full mt-6 py-2.5 bg-slate-50 hover:bg-indigo-600 text-slate-700 hover:text-white border border-slate-200 hover:border-indigo-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-3xs"
              >
                Use Free Tool
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bottom Registration CTA Section */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center justify-between gap-8 text-left shadow-xl relative overflow-hidden">
        {/* Glow styling details */}
        <div className="absolute -right-32 -bottom-32 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-32 -top-32 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl"></div>

        <div className="space-y-2 relative z-10">
          <span className="inline-flex px-2 py-0.5 leading-none bg-indigo-500/20 text-indigo-300 rounded-md border border-indigo-500/20 text-[9px] font-mono font-bold uppercase tracking-wider">
            All-In-One Workspace
          </span>
          <h2 className="text-2xl sm:text-3.5xl font-black font-display text-white tracking-tight leading-tight">
            Stop writing client reports manually.
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-xl">
            Upgrade to ReportIQ to securely connect your registries, invite your team, and generate fully branded white-label customer portals automatically.
          </p>
        </div>
        
        <button
          onClick={() => {
            window.history.pushState(null, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="w-full lg:w-auto py-4 px-8 bg-indigo-600 hover:bg-indigo-750 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer text-sm shrink-0 shadow-lg border-none relative z-10"
        >
          Try ReportIQ Free
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
