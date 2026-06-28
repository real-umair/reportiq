import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolOnboardingQuestionnaire() {
  const fields: ToolField[] = [
    { name: 'serviceType', label: 'Agency Service Type', placeholder: 'SEO & Content Marketing' },
    { name: 'industry', label: 'Client Industry', placeholder: 'SaaS / E-commerce' },
    { name: 'goals', label: 'Main Goals & Objectives', placeholder: 'Increase lead registrations and organic ranking for core terms', type: 'textarea' },
  ];

  const instructions = [
    "Enter the service your agency is providing (e.g., Google Ads management, branding, web development).",
    "Specify the client's industry and key target audience.",
    "Outline what they hope to achieve (e.g., double monthly signups, rank for local search queries).",
    "<strong>SEO Tip:</strong> Publish onboarding questionnaires like <strong>client onboarding questionnaire generator</strong> to capture high-value agency leads searching for onboarding frameworks."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a client onboarding questionnaire?</h2>
        <p className="leading-relaxed mb-4">
          A client onboarding questionnaire is a set of strategic questions sent to new clients before a project begins. It gathers details about their brand identity, login credentials, target audience, competitors, and core objectives.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why use a questionnaire generator?</h2>
        <p className="leading-relaxed mb-4">
          Instead of sending a generic PDF, you can generate custom questionnaires tailored to the exact service and industry of each client. This helps your agency onboard clients faster, gathers the right info on day one, and makes a professional first impression.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Onboarding Questionnaire Generator"
      description="Create tailored client onboarding questionnaires instantly with AI. Align on goals and gather necessary assets."
      fields={fields}
      apiEndpoint="/api/tools/onboarding-questionnaire"
      metaTitle="Free Onboarding Questionnaire Generator — AI Powered | ReportIQ"
      metaDescription="Generate custom client onboarding questionnaires and project kickoff checksheets instantly with AI. Free agency onboarding tool."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}
