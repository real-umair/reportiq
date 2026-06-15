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

  return (
    <ToolPage
      title="Free Agency Report Template Generator"
      description="Create professional agency reports in seconds with AI. Free tool for agencies and freelancers."
      fields={fields}
      apiEndpoint="/api/tools/agency-report"
      metaTitle="Free Agency Report Template Generator | ReportIQ"
      metaDescription="Create professional agency reports in seconds with AI. Free agency report template and executive summary builder."
      instructions={instructions}
    />
  );
}

