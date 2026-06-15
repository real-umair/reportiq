import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolSeoReport() {
  const fields: ToolField[] = [
    { name: 'website', label: 'Website URL', placeholder: 'acme.com' },
    { name: 'keywords', label: 'Target Keywords', placeholder: 'seo tools, client reporting' },
    { name: 'month', label: 'Report Month', placeholder: 'June 2026' },
  ];

  return (
    <ToolPage
      title="Free SEO Report Generator"
      description="Generate professional SEO reports instantly with AI. Free for SEO freelancers and agencies."
      fields={fields}
      apiEndpoint="/api/tools/seo-report"
      metaTitle="Free SEO Report Generator — AI Powered | ReportIQ"
      metaDescription="Generate professional SEO reports instantly with AI. Free for SEO freelancers and agencies."
    />
  );
}
