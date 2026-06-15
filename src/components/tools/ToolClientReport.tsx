import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolClientReport() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Acme Inc' },
    { name: 'industry', label: 'Industry', placeholder: 'Digital Marketing' },
    { name: 'workDone', label: 'Work Done This Month', placeholder: 'Built landing page, ran ads campaign...', type: 'textarea' },
  ];

  return (
    <ToolPage
      title="Free Client Report Generator"
      description="Generate a professional client report instantly with AI. Free, no signup required."
      fields={fields}
      apiEndpoint="/api/tools/client-report"
      metaTitle="Free Client Report Generator — AI Powered | ReportIQ"
      metaDescription="Generate professional client reports instantly with AI. Free tool, no signup required."
    />
  );
}
