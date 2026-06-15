import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolMonthlyReport() {
  const fields: ToolField[] = [
    { name: 'businessType', label: 'Business Type', placeholder: 'SaaS / E-commerce' },
    { name: 'month', label: 'Report Month', placeholder: 'June 2026' },
    { name: 'keyResults', label: 'Key Results & Achievements', placeholder: 'Increased conversion rate by 15%, launched summer campaign', type: 'textarea' },
  ];

  return (
    <ToolPage
      title="Free Monthly Report Template Generator"
      description="Create professional monthly reports instantly with AI. Free, no signup needed."
      fields={fields}
      apiEndpoint="/api/tools/monthly-report"
      metaTitle="Free Monthly Report Template Generator | ReportIQ"
      metaDescription="Create professional monthly reports instantly with AI. Free, no signup needed."
    />
  );
}
