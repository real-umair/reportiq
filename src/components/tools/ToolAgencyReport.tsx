import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolAgencyReport() {
  const fields: ToolField[] = [
    { name: 'agencyName', label: 'Agency Name', placeholder: 'Smith Digital' },
    { name: 'clientName', label: 'Client Name', placeholder: 'Acme Inc' },
    { name: 'month', label: 'Report Month', placeholder: 'June 2026' },
  ];

  return (
    <ToolPage
      title="Free Agency Report Template Generator"
      description="Create professional agency reports in seconds with AI. Free tool for agencies and freelancers."
      fields={fields}
      apiEndpoint="/api/tools/agency-report"
      metaTitle="Free Agency Report Template Generator | ReportIQ"
      metaDescription="Create professional agency reports in seconds with AI. Free tool for agencies and freelancers."
    />
  );
}
