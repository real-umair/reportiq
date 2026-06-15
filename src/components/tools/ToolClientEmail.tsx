import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolClientEmail() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Jane Smith' },
    { name: 'workCompleted', label: 'Work Completed', placeholder: 'Completed frontend design review and API integrations', type: 'textarea' },
    { name: 'nextSteps', label: 'Next Steps', placeholder: 'Deploying staging environment next week', type: 'textarea' },
  ];

  const instructions = [
    "Enter the client name, completed tasks, and the upcoming project milestones.",
    "Click generate to format a friendly, professional update email in seconds.",
    "<strong>SEO Tip:</strong> Build strong organic site visibility by publishing guides using search keywords like <strong>client update email templates</strong> or <strong>freelancer update email sample</strong>.",
    "Copy the text and adjust the greetings/signature to match your usual client communication style."
  ];

  return (
    <ToolPage
      title="Free Client Update Email Writer"
      description="Write professional client update emails in seconds with AI. Free tool for freelancers."
      fields={fields}
      apiEndpoint="/api/tools/client-email"
      metaTitle="Free Client Update Email Writer | ReportIQ"
      metaDescription="Write professional client update emails in seconds with AI. Free client update email templates and weekly client reporting templates."
      instructions={instructions}
    />
  );
}

