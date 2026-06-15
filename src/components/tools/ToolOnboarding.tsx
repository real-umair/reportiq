import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolOnboarding() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Jane Doe' },
    { name: 'serviceType', label: 'Service / Retainer Type', placeholder: 'Monthly SEO Retainer' },
    { name: 'startDate', label: 'Start Date', placeholder: 'July 1st, 2026' },
  ];

  const instructions = [
    "Provide the client's name, service type, and the target start date.",
    "Click generate to construct a warm, welcoming onboarding email detailing next steps and expectations.",
    "<strong>SEO Tip:</strong> Drive high-intent lead signups by sharing articles targeting search terms like <strong>client onboarding email template</strong> or <strong>new client welcome email sample</strong>.",
    "Double-check the start date and insert links to your scheduling calendar or brand assets folder before hitting send."
  ];

  return (
    <ToolPage
      title="Free Client Onboarding Email Generator"
      description="Write professional client onboarding welcome emails with AI. Free tool for agencies."
      fields={fields}
      apiEndpoint="/api/tools/onboarding-email"
      metaTitle="Free Client Onboarding Email Generator | ReportIQ"
      metaDescription="Write professional client onboarding welcome emails with AI. Free client onboarding email template and new client welcome email sample."
      instructions={instructions}
    />
  );
}

