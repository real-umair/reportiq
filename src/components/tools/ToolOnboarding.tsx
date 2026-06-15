import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolOnboarding() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Jane Doe' },
    { name: 'serviceType', label: 'Service / Retainer Type', placeholder: 'Monthly SEO Retainer' },
    { name: 'startDate', label: 'Start Date', placeholder: 'July 1st, 2026' },
  ];

  return (
    <ToolPage
      title="Free Client Onboarding Email Generator"
      description="Write professional client onboarding welcome emails with AI. Free tool for agencies."
      fields={fields}
      apiEndpoint="/api/tools/onboarding-email"
      metaTitle="Free Client Onboarding Email Generator | ReportIQ"
      metaDescription="Write professional client onboarding welcome emails with AI. Free tool for agencies."
    />
  );
}
