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

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">How to draft a client update email</h2>
        <p className="leading-relaxed mb-4">
          A client update email is a crucial touchpoint for keeping clients informed about project statuses and deliverables. A professional client email generator or client status email template helps streamline client communication templates, ensuring your updates are clear, concise, and structured.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Best practices for client status emails</h2>
        <p className="leading-relaxed mb-4">When sending a project status update email, follow these best practices:</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Keep the subject line descriptive</strong> — make it easy to find in their inbox</li>
          <li><strong>Use bullet points for readability</strong> — clients appreciate quick scannability</li>
          <li><strong>Highlight achievements</strong> — call out milestones met or wins</li>
          <li><strong>Confirm next steps clearly</strong> — list what's on deck for the coming week</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why automate client communication templates?</h2>
        <p className="leading-relaxed">
          Writing individual status updates takes hours. A professional client email generator lets you turn bulleted notes into polished updates in 30 seconds, maintaining a consistent cadence of communication without the overhead.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Client Update Email Writer"
      description="Write professional client update emails in seconds with AI. Free tool for freelancers."
      fields={fields}
      apiEndpoint="/api/tools/client-email"
      metaTitle="Free Client Update Email Writer | ReportIQ"
      metaDescription="Write professional client update emails in seconds with AI. Free client update email templates and weekly client reporting templates."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}

