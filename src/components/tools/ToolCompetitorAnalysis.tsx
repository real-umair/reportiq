import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolCompetitorAnalysis() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Business Name', placeholder: 'Acme Inc' },
    { name: 'competitor', label: 'Competitor Name / URL', placeholder: 'competitor.com' },
    { name: 'focusArea', label: 'Focus Area (e.g. SEO, Social, Ads, Product)', placeholder: 'Organic Search & SEO Performance' },
    { name: 'rawData', label: 'Raw Competitor Metrics', placeholder: 'Paste SEMrush, Ahrefs or Similarweb metrics (e.g., traffic: 5k/mo, rank: #4, top keywords) to base findings on real data...', type: 'textarea', required: true, maxLength: 3000 },
  ];

  const instructions = [
    "Enter your client's name and the primary competitor's name or website domain.",
    "Specify a focus area to tailor the analytical breakdown (e.g., SEO keyword overlaps, ad copy tactics, or product offerings).",
    "<strong>SEO Tip:</strong> Upload or paste actual metrics from SEMrush, Ahrefs, or Similarweb into the 'Raw Competitor Metrics' field to ensure the report is 100% correct.",
    "Before delivering this report, check the recommendations to make sure they align with your client's goals."
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
      description="Create professional competitor analysis summaries instantly with AI. Upload SEO audits or spreadsheet metrics to base your audit on real data."
      fields={fields}
      apiEndpoint="/api/tools/competitor-analysis"
      metaTitle="Free Competitor Analysis Generator — AI Powered | ReportIQ"
      metaDescription="Create detailed competitor analysis reports with AI. Upload SEMrush, Ahrefs, or Google spreadsheets to build accurate competitive audits."
      instructions={instructions}
      seoContent={seoContent}
      allowDocumentUpload={true}
    />
  );
}
