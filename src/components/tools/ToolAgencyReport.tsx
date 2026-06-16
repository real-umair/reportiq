import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolAgencyReport() {
  const fields: ToolField[] = [
    { name: 'agencyName', label: 'Agency Name', placeholder: 'Smith Digital' },
    { name: 'clientName', label: 'Client Name', placeholder: 'Acme Inc' },
    { name: 'month', label: 'Report Month', placeholder: 'June 2026' },
  ];

  const instructions = [
    "Enter your agency name, client partner name, and the current report month.",
    "Click generate to draft a structured executive summary, listing accomplishments, key results, and next actions.",
    "<strong>SEO Tip:</strong> Publish template outlines using keywords like <strong>free agency report template</strong> or <strong>monthly agency progress report</strong> to attract marketing managers looking for report structure guides.",
    "Download the text file format and easily import it into Google Docs or Slack updates."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is an agency report template?</h2>
        <p className="leading-relaxed mb-4">
          An agency report template is a standardized format used by marketing, PR, and advertising agencies to document campaign performance and project updates for clients. Using an agency monthly report or agency status report template ensures that your agency client report format remains consistent, professional, and visually aligned with your brand identity.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What should an agency client report include?</h2>
        <p className="leading-relaxed mb-4">A standard agency client report format should feature:</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Executive summary</strong> of campaign achievements and key takeaways</li>
          <li><strong>Key performance indicators (KPIs)</strong> and milestone progress tracking</li>
          <li><strong>Detailed breakdown</strong> of work completed during the period</li>
          <li><strong>Roadmap and recommendations</strong> for the next period</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why customize your agency monthly report?</h2>
        <p className="leading-relaxed">
          Every client is unique. A static agency status report template can feel impersonal. Utilizing an AI-driven compiler allows agencies to tailor the language and layout to specific stakeholder preferences in seconds.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Agency Report Template Generator"
      description="Create professional agency reports in seconds with AI. Free tool for agencies and freelancers."
      fields={fields}
      apiEndpoint="/api/tools/agency-report"
      metaTitle="Free Agency Report Template Generator | ReportIQ"
      metaDescription="Create professional agency reports in seconds with AI. Free agency report template and executive summary builder."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}

