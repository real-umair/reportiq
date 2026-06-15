import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolSocialMedia() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Fashion Brand' },
    { name: 'platforms', label: 'Social Platforms', placeholder: 'Instagram, TikTok' },
    { name: 'metrics', label: 'Performance Metrics', placeholder: 'Grew followers by 12%, engagement rate 4.8%, 150k video views', type: 'textarea' },
  ];

  const instructions = [
    "Enter the client name, social media platforms (e.g., Instagram, LinkedIn, TikTok), and key metrics.",
    "Click generate to construct a structured social media analytics breakdown.",
    "<strong>SEO Tip:</strong> Publish reports and share links using keywords like <strong>social media report generator free</strong> or <strong>instagram agency report template</strong> to capture traffic from social media managers looking for templates.",
    "Ensure you swap in your actual analytics export data into the draft before presenting to clients."
  ];

  return (
    <ToolPage
      title="Free Social Media Report Generator"
      description="Create professional social media reports instantly with AI. Free for agencies."
      fields={fields}
      apiEndpoint="/api/tools/social-media-report"
      metaTitle="Free Social Media Report Generator | ReportIQ"
      metaDescription="Create professional social media reports instantly with AI. Free social media report generator and instagram agency report template."
      instructions={instructions}
    />
  );
}

