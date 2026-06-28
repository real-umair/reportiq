import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolCompetitorAnalysis() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Business Name', placeholder: 'Acme Inc' },
    { name: 'competitor', label: 'Competitor Name / URL', placeholder: 'competitor.com' },
    { name: 'focusArea', label: 'Focus Area (e.g. SEO, Social, Ads, Product)', placeholder: 'Organic Search & SEO Performance' },
  ];

  const instructions = [
    "Enter your client's name and the primary competitor's name or website domain.",
    "Specify a focus area to tailor the analytical breakdown (e.g., SEO keyword overlaps, ad copy tactics, or product offerings).",
    "<strong>SEO Tip:</strong> Build client trust by sharing visual keyword maps or traffic comparison graphs alongside this generated text.",
    "Before delivering this report, enrich the AI observations with actual metrics from SEMrush, Ahrefs, or Similarweb."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a competitor analysis generator?</h2>
        <p className="leading-relaxed mb-4">
          A competitor analysis generator is an AI-powered utility that creates professional, structured competitive intelligence reports. It outlines overlaps, market positioning, advantages, and opportunities for your client against their key industry rival.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What should a competitive analysis include?</h2>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Market Position Comparison</strong> — relative brand strength and target market.</li>
          <li><strong>Strategic Focus Area</strong> — comparison of key channels like Paid Ads, Organic Search, or Pricing.</li>
          <li><strong>Strengths & Weaknesses (SWOT)</strong> — side-by-side analysis of key operational vectors.</li>
          <li><strong>Actionable Recommendations</strong> — strategic counter-measures to win market share.</li>
        </ul>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Competitor Analysis Generator"
      description="Create professional competitive analysis summaries instantly with AI. Compare market rivals easily."
      fields={fields}
      apiEndpoint="/api/tools/competitor-analysis"
      metaTitle="Free Competitor Analysis Generator — AI Powered | ReportIQ"
      metaDescription="Generate detailed competitor analysis reports instantly with AI. Free marketing and SWOT competitive summary builder."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}
