import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolMonthlyReport() {
  const fields: ToolField[] = [
    { name: 'businessType', label: 'Business Type', placeholder: 'SaaS / E-commerce' },
    { name: 'month', label: 'Report Month', placeholder: 'June 2026' },
    { name: 'keyResults', label: 'Key Results & Achievements', placeholder: 'Increased conversion rate by 15%, launched summer campaign', type: 'textarea' },
  ];

  const instructions = [
    "Enter your business type, the target month, and 2–3 key results or accomplishments.",
    "Click generate to create a professional monthly report outline covering metrics, wins, and next month's goals.",
    "<strong>SEO Tip:</strong> Drive organic B2B visitors to your agency using search terms like <strong>monthly progress report template</strong> or <strong>business achievements report sample</strong> in your site content.",
    "Be sure to double-check and edit the metric outputs with your actual values before sharing."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a monthly report template?</h2>
        <p className="leading-relaxed mb-4">
          A monthly report template — also referred to as a monthly status report, monthly client update template, or monthly progress report — is a structured document that summarizes key activities, metrics, and outcomes over a 30-day period.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What should a monthly progress report include?</h2>
        <p className="leading-relaxed mb-4">To ensure alignment with clients and internal stakeholders, every monthly status report should feature:</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Key metrics summary</strong> — high-level figures and charts demonstrating performance changes</li>
          <li><strong>Completed deliverables</strong> — what tasks or campaigns were successfully executed</li>
          <li><strong>Strategic analysis</strong> — why certain metrics shifted and what takeaways arose</li>
          <li><strong>Next month roadmap</strong> — goals and key action items for the upcoming 30 days</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why use a dynamic monthly status report?</h2>
        <p className="leading-relaxed">
          Static PDF templates require manual adjustments and don't render well on mobile. An interactive monthly progress report makes it simple for clients to read updates on any device while ensuring your formatting looks flawless.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Monthly Report Template Generator"
      description="Create professional monthly reports instantly with AI. Free, no signup needed."
      fields={fields}
      apiEndpoint="/api/tools/monthly-report"
      metaTitle="Free Monthly Report Template Generator | ReportIQ"
      metaDescription="Create professional monthly reports instantly with AI. Free monthly progress report template and business achievements report sample."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}

