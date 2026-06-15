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

  return (
    <ToolPage
      title="Free KPI Report Generator"
      description="Generate professional KPI summary reports with AI. Free tool for businesses and agencies."
      fields={fields}
      apiEndpoint="/api/tools/kpi-report"
      metaTitle="Free KPI Report Generator | ReportIQ"
      metaDescription="Generate professional KPI summary reports with AI. Free kpi summary report generator and key performance indicators template."
      instructions={instructions}
    />
  );
}

