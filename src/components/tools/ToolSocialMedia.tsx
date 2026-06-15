import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolSocialMedia() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Fashion Brand' },
    { name: 'platforms', label: 'Social Platforms', placeholder: 'Instagram, TikTok' },
    { name: 'metrics', label: 'Performance Metrics', placeholder: 'Grew followers by 12%, engagement rate 4.8%, 150k video views', type: 'textarea' },
  ];

  return (
    <ToolPage
      title="Free Social Media Report Generator"
      description="Create professional social media reports instantly with AI. Free for agencies."
      fields={fields}
      apiEndpoint="/api/tools/social-media-report"
      metaTitle="Free Social Media Report Generator | ReportIQ"
      metaDescription="Create professional social media reports instantly with AI. Free for agencies."
    />
  );
}
