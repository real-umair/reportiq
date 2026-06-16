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

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is an invoice description generator?</h2>
        <p className="leading-relaxed mb-4">
          An invoice description generator — or professional invoice writer — is a tool that creates detailed, clear billing line items. A detailed freelance invoice description or invoice line item generator helps ensure transparency, reducing billing disputes and accelerating client payments.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Writing a clear freelance invoice description</h2>
        <p className="leading-relaxed mb-4">When compiling descriptions for your invoices, ensure you include:</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Specific deliverables</strong> — detail the exact website pages redesigned or consulting sessions completed</li>
          <li><strong>Dates or timeline</strong> — outline when the work was done to prevent confusion</li>
          <li><strong>Billed hours or rate</strong> — clearly state how the total matches the logged hours</li>
          <li><strong>Professional phrasing</strong> — avoid ambiguous terms; use value-focused language</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Benefits of a professional invoice writer</h2>
        <p className="leading-relaxed">
          Clear line items show clients exactly what they are paying for, building trust and maintaining a high standard of professionalism. An invoice line item generator saves you time by formatting your notes into professional terms instantly.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Invoice Description Writer"
      description="Write professional invoice descriptions with AI. Free tool for freelancers."
      fields={fields}
      apiEndpoint="/api/tools/invoice-description"
      metaTitle="Free Invoice Description Writer | ReportIQ"
      metaDescription="Write professional invoice descriptions with AI. Free invoice description writer tool and billing hours description sample."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}

