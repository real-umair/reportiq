import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolSeoReport() {
  const fields: ToolField[] = [
    { name: 'website', label: 'Website URL', placeholder: 'acme.com' },
    { name: 'keywords', label: 'Target Keywords', placeholder: 'seo tools, client reporting' },
    { name: 'month', label: 'Report Month', placeholder: 'June 2026' },
  ];

  const instructions = [
    "Provide your target website domain and target keyword phrases.",
    "Specify the reporting month to track traffic changes.",
    "<strong>SEO Tip:</strong> Optimize your web resource headers using keywords like <strong>seo report generator free</strong> or <strong>low competition keyword finder</strong> to drive targeted traffic to your services.",
    "Be sure to swap out the simulated AI placeholder figures with your real organic traffic analytics from Google Analytics or GSC before presenting to clients."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is an SEO report generator?</h2>
        <p className="leading-relaxed mb-4">
          An SEO report generator — also called an SEO reporting tool, search engine optimization report maker, or SEO client report builder — is a tool that creates professional SEO performance reports for clients. It summarizes keyword rankings, organic traffic growth, backlinks, technical improvements, and content performance into a clear, readable document.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What should an SEO report include?</h2>
        <p className="leading-relaxed mb-4">Every professional SEO report should include:</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Keyword ranking changes</strong> — which keywords moved up or down</li>
          <li><strong>Organic traffic summary</strong> — total visits and growth percentage</li>
          <li><strong>Backlinks built</strong> — new links acquired and their domain authority</li>
          <li><strong>Technical fixes</strong> — errors resolved and improvements made</li>
          <li><strong>Content published</strong> — new pages and blog posts created</li>
          <li><strong>Next month strategy</strong> — planned actions for the coming period</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">How to write an SEO report faster</h2>
        <p className="leading-relaxed">
          Use an AI SEO report generator like this free tool. Enter your key metrics and work completed, click generate, and get a professional SEO report in seconds. No templates to fill in, no formatting to do, no time wasted.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free SEO Report Generator"
      description="Generate professional SEO reports instantly with AI. Free for SEO freelancers and agencies."
      fields={fields}
      apiEndpoint="/api/tools/seo-report"
      metaTitle="Free SEO Report Generator — AI Powered | ReportIQ"
      metaDescription="Generate professional SEO reports instantly with AI. Free seo report generator, organic traffic summary template."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}

