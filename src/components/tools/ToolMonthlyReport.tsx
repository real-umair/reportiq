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

  return (
    <ToolPage
      title="Free Monthly Report Template Generator"
      description="Create professional monthly reports instantly with AI. Free, no signup needed."
      fields={fields}
      apiEndpoint="/api/tools/monthly-report"
      metaTitle="Free Monthly Report Template Generator | ReportIQ"
      metaDescription="Create professional monthly reports instantly with AI. Free monthly progress report template and business achievements report sample."
      instructions={instructions}
    />
  );
}

