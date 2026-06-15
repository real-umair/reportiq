import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolClientEmail() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Jane Smith' },
    { name: 'workCompleted', label: 'Work Completed', placeholder: 'Completed frontend design review and API integrations', type: 'textarea' },
    { name: 'nextSteps', label: 'Next Steps', placeholder: 'Deploying staging environment next week', type: 'textarea' },
  ];

  return (
    <ToolPage
      title="Free Client Update Email Writer"
      description="Write professional client update emails in seconds with AI. Free tool for freelancers."
      fields={fields}
      apiEndpoint="/api/tools/client-email"
      metaTitle="Free Client Update Email Generator | ReportIQ"
      metaDescription="Write professional client update emails in seconds with AI. Free tool for freelancers."
    />
  );
}
