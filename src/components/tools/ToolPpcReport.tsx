import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolPpcReport() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Acme Store' },
    { name: 'adSpend', label: 'Ad Spend & Platforms', placeholder: '$1,500 spent on Google Search & Facebook Ads' },
    { name: 'results', label: 'Key Campaign Results', placeholder: 'Generated 140 conversions at $10.70 CPA with 3.2x ROAS', type: 'textarea' },
  ];

  const instructions = [
    "Enter the client name and target campaign reporting period.",
    "Detail the spend across your advertising channels (Google Search, Meta Ads, LinkedIn Ads, etc.).",
    "List conversion achievements, cost-per-acquisition (CPA), and click-through rates (CTR).",
    "<strong>SEO Tip:</strong> Embed search terms like <strong>ppc report generator free</strong> or <strong>ad performance reporting</strong> to make your digital tools more indexable."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-955 mb-3">What is a PPC report generator?</h2>
        <p className="leading-relaxed mb-4">
          A PPC report generator is a utility that compiles paid advertising spend, click activity, and conversion statistics into structured reports. It translates complex analytics into clean business insights for stakeholders.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-955 mb-3">Key metrics in a PPC report</h2>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Total Ad Spend</strong> — allocation of budget across different networks.</li>
          <li><strong>Cost Per Click (CPC) & CTR</strong> — engagement efficiency metrics.</li>
          <li><strong>Conversions & ROAS</strong> — bottom-line business value returned from ad spend.</li>
          <li><strong>Strategic Adjustments</strong> — bid adjustments, keyword expansion, and creative tests.</li>
        </ul>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free PPC Performance Report Writer"
      description="Compile clean, professional paid advertising reports using AI. Summarize ROAS, CPA, and ad spend."
      fields={fields}
      apiEndpoint="/api/tools/ppc-report"
      metaTitle="Free PPC Performance Report Writer — AI Powered | ReportIQ"
      metaDescription="Generate paid search and social ad performance reports instantly with AI. Free PPC report builder."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}
