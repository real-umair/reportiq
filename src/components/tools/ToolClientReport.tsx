import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolClientReport() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Acme Inc' },
    { name: 'industry', label: 'Industry', placeholder: 'Digital Marketing' },
    { name: 'workDone', label: 'Work Done This Month', placeholder: 'Built landing page, ran ads campaign...', type: 'textarea' },
  ];

  const instructions = [
    "Enter the client name and industry to customize the generated report style.",
    "Outline 3–5 key milestones, ad spend metrics, or deliverables completed in the 'Work Done' box.",
    "<strong>SEO Tip:</strong> Publish reports containing low-competition phrases like <strong>free client status report</strong> or <strong>automated agency reports</strong> on your blog to attract client leads searching for templates.",
    "Swap out the illustrative AI-generated placeholder data with your real analytics before delivering the report to clients."
  ];

  return (
    <ToolPage
      title="Free Client Report Generator"
      description="Generate a professional client report instantly with AI. Free, no signup required."
      fields={fields}
      apiEndpoint="/api/tools/client-report"
      metaTitle="Free Client Report Generator — AI Powered | ReportIQ"
      metaDescription="Generate professional client reports instantly with AI. Free client status report generator, no signup required."
      instructions={instructions}
    />
  );
}

