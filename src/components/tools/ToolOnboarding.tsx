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

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a client onboarding email?</h2>
        <p className="leading-relaxed mb-4">
          A client onboarding email or welcome email for new clients is the initial message sent to establish the onboarding workflow. Utilizing a new client welcome email generator or client onboarding template ensures that your onboarding sequence is professional, comprehensive, and consistent.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What should a welcome email for new clients include?</h2>
        <p className="leading-relaxed mb-4">Every professional onboarding welcome email should cover:</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Warm welcome and excitement</strong> — set a positive, collaborative tone</li>
          <li><strong>Next steps and project kickoff details</strong> — specify when the kickoff meeting is or when work begins</li>
          <li><strong>Intake resources</strong> — links to intake questionnaires, brand assets folders, or access request forms</li>
          <li><strong>Communication guidelines</strong> — confirm preferred communication channels and reply expectations</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why use a client onboarding template?</h2>
        <p className="leading-relaxed">
          First impressions are everything. A standardized onboarding template ensures that you never miss a step in welcoming a client, establishing trust and clarity from day one. An AI-powered welcome email generator lets you compose these custom updates in seconds.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Client Onboarding Email Generator"
      description="Write professional client onboarding welcome emails with AI. Free tool for agencies."
      fields={fields}
      apiEndpoint="/api/tools/onboarding-email"
      metaTitle="Free Client Onboarding Email Generator | ReportIQ"
      metaDescription="Write professional client onboarding welcome emails with AI. Free client onboarding email template and new client welcome email sample."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}

