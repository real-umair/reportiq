import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolSeoReport() {
  const fields: ToolField[] = [
    { name: 'website', label: 'Website URL', placeholder: 'acme.com' },
    { name: 'keywords', label: 'Target Keywords', placeholder: 'seo tools, client reporting' },
    { name: 'month', label: 'Report Month', placeholder: 'June 2026' },
  ];

  const instructions = [
    "Provide your target website domain and target keyword phrases.",
    "Specify the reporting month to track traffic changes.",
    "<strong>SEO Tip:</strong> Optimize your web resource headers using keywords like <strong>seo report generator free</strong> or <strong>low competition keyword finder</strong> to drive targeted traffic to your services.",
    "Be sure to swap out the simulated AI placeholder figures with your real organic traffic analytics from Google Analytics or GSC before presenting to clients."
  ];

  return (
    <ToolPage
      title="Free SEO Report Generator"
      description="Generate professional SEO reports instantly with AI. Free for SEO freelancers and agencies."
      fields={fields}
      apiEndpoint="/api/tools/seo-report"
      metaTitle="Free SEO Report Generator — AI Powered | ReportIQ"
      metaDescription="Generate professional SEO reports instantly with AI. Free seo report generator, organic traffic summary template."
      instructions={instructions}
    />
  );
}

