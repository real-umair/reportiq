import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolKpiReport() {
  const fields: ToolField[] = [
    { name: 'businessName', label: 'Business Name', placeholder: 'Smith Consulting' },
    { name: 'kpis', label: 'KPIs & Metrics', placeholder: 'CAC: $45, LTV: $350, Churn: 2.1%', type: 'textarea' },
    { name: 'period', label: 'Reporting Period', placeholder: 'Q2 2026' },
  ];

  const instructions = [
    "Input your business name, key performance metrics list, and the reporting period.",
    "Click generate to construct a detailed performance analysis with highlights and strategy updates.",
    "<strong>SEO Tip:</strong> Publish optimization case studies targeting low-competition phrases like <strong>kpi summary report generator</strong> or <strong>key performance indicators template</strong> to rank as a thought leader.",
    "Tailor the recommendations section to your actual business strategy before presenting to stakeholders."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a KPI report generator?</h2>
        <p className="leading-relaxed mb-4">
          A KPI report generator is a tool that synthesizes business performance data into a structured key performance indicator report. A KPI reporting template or business KPI summary highlights critical success metrics so that stakeholders and clients can make data-driven strategic decisions.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Crucial elements of a key performance indicator report</h2>
        <p className="leading-relaxed mb-4">To be effective, a business KPI summary must include the following sections:</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Target vs Actual tracking</strong> — clear comparisons showing if goals were met</li>
          <li><strong>Trend analysis over time</strong> — historical context showing growth trajectories</li>
          <li><strong>Performance drivers</strong> — insights explaining why specific metrics changed</li>
          <li><strong>Actionable recommendations</strong> — what adjustments should be made next</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Benefits of a business KPI summary tool</h2>
        <p className="leading-relaxed">
          An automated KPI report generator aggregates data into a cohesive overview instantly. Instead of spending hours building manual charts and tables, you can generate a professional summary outline in under 30 seconds.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free KPI Report Generator"
      description="Generate professional KPI summary reports with AI. Free tool for businesses and agencies."
      fields={fields}
      apiEndpoint="/api/tools/kpi-report"
      metaTitle="Free KPI Report Generator | ReportIQ"
      metaDescription="Generate professional KPI summary reports with AI. Free kpi summary report generator and key performance indicators template."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}

