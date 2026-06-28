import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolWeeklyReport() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Acme Corp' },
    { name: 'tasksDone', label: 'Completed Tasks This Week', placeholder: 'Optimized speed, published 2 posts...', type: 'textarea' },
    { name: 'nextSteps', label: 'Next Week Plans', placeholder: 'A/B test landing pages, set up email flows...', type: 'textarea' },
  ];

  const instructions = [
    "Enter the client or project name at the top.",
    "Outline the key achievements and tasks completed during the current week.",
    "Specify target priorities and upcoming tasks planned for the following week.",
    "<strong>SEO Tip:</strong> Generate custom templates using phrases like <strong>weekly client status update email</strong> to boost organic search discovery of your agency services."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a weekly status report generator?</h2>
        <p className="leading-relaxed mb-4">
          A weekly status report generator is an AI tool that organizes raw notes on task progress, achievements, and blockers into structured updates. It ensures alignment between service providers and clients with minimal manual drafting.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why send weekly reports?</h2>
        <p className="leading-relaxed mb-4">
          Weekly updates prevent project drift, build transparency, and help identify blockers early. With ReportIQ, you can generate clear, professional updates in seconds without taking hours out of your week.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Weekly Progress Report Generator"
      description="Create professional weekly project updates for your clients instantly with AI."
      fields={fields}
      apiEndpoint="/api/tools/weekly-report"
      metaTitle="Free Weekly Progress Report Generator — AI Powered | ReportIQ"
      metaDescription="Generate professional weekly status reports and progress updates instantly with AI. Free client update writer."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}
