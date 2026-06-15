import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolKpiReport() {
  const fields: ToolField[] = [
    { name: 'businessName', label: 'Business Name', placeholder: 'Smith Consulting' },
    { name: 'kpis', label: 'KPIs & Metrics', placeholder: 'CAC: $45, LTV: $350, Churn: 2.1%', type: 'textarea' },
    { name: 'period', label: 'Reporting Period', placeholder: 'Q2 2026' },
  ];

  return (
    <ToolPage
      title="Free KPI Report Generator"
      description="Generate professional KPI summary reports with AI. Free tool for businesses and agencies."
      fields={fields}
      apiEndpoint="/api/tools/kpi-report"
      metaTitle="Free KPI Report Generator — AI Powered | ReportIQ"
      metaDescription="Generate professional KPI summary reports with AI. Free tool for businesses and agencies."
    />
  );
}
