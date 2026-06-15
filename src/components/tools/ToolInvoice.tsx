import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolInvoice() {
  const fields: ToolField[] = [
    { name: 'service', label: 'Service Provided', placeholder: 'UI/UX Design' },
    { name: 'clientName', label: 'Client Name', placeholder: 'Acme Corp' },
    { name: 'hours', label: 'Hours Logged', placeholder: '24' },
  ];

  return (
    <ToolPage
      title="Free Invoice Description Writer"
      description="Write professional invoice descriptions with AI. Free tool for freelancers."
      fields={fields}
      apiEndpoint="/api/tools/invoice-description"
      metaTitle="Free Invoice Description Writer — AI Powered | ReportIQ"
      metaDescription="Write professional invoice descriptions with AI. Free tool for freelancers."
    />
  );
}
