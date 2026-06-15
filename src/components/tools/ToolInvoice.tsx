import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolInvoice() {
  const fields: ToolField[] = [
    { name: 'service', label: 'Service Provided', placeholder: 'UI/UX Design' },
    { name: 'clientName', label: 'Client Name', placeholder: 'Acme Corp' },
    { name: 'hours', label: 'Hours Logged', placeholder: '24' },
  ];

  const instructions = [
    "Specify the service type (e.g. Web Design, SEO Consulting), client name, and hours billed.",
    "Click generate to create 3 professional invoice description line items detailing the value delivered.",
    "<strong>SEO Tip:</strong> Reach freelance developer audiences by writing tutorials targeting search phrases like <strong>invoice description writer tool</strong> or <strong>billing hours description sample</strong>.",
    "Select the line item description that best matches your client's deliverables milestones."
  ];

  return (
    <ToolPage
      title="Free Invoice Description Writer"
      description="Write professional invoice descriptions with AI. Free tool for freelancers."
      fields={fields}
      apiEndpoint="/api/tools/invoice-description"
      metaTitle="Free Invoice Description Writer | ReportIQ"
      metaDescription="Write professional invoice descriptions with AI. Free invoice description writer tool and billing hours description sample."
      instructions={instructions}
    />
  );
}

