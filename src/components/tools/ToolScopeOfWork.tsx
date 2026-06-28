import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolScopeOfWork() {
  const fields: ToolField[] = [
    { name: 'projectName', label: 'Project Name / Client Name', placeholder: 'Acme Website Redesign' },
    { name: 'deliverables', label: 'Core Deliverables & Tasks', placeholder: 'Design 5 mockups, build WordPress site, set up tracking...', type: 'textarea' },
    { name: 'timeline', label: 'Timeline & Budget Details', placeholder: '6 weeks duration, total project fee of $4,500' },
  ];

  const instructions = [
    "Enter the project title and client name.",
    "Outline the specific milestones, phases, and assets you will deliver to the client.",
    "Include budget caps, hourly assumptions, and milestones to prevent project scope creep.",
    "<strong>SEO Tip:</strong> Integrate phrases like <strong>scope of work generator free</strong> or <strong>SOW template builder</strong> to rank highly for freelance contract search queries."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a Scope of Work (SOW) generator?</h2>
        <p className="leading-relaxed mb-4">
          A Scope of Work (SOW) generator is an AI tool that assists freelancers, consultants, and agencies in drafting comprehensive project scope documents. It clearly details what is included in a project, what is excluded, payment milestones, and target timelines.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why is an SOW important?</h2>
        <p className="leading-relaxed mb-4">
          Having a written and agreed-upon SOW prevents "scope creep," protects you from working on tasks you didn't price, and aligns expectations with your client before any work starts.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Scope of Work (SOW) Generator"
      description="Draft clear, professional project scopes in seconds. Outline project deliverables, timelines, and budget rules."
      fields={fields}
      apiEndpoint="/api/tools/scope-of-work"
      metaTitle="Free Scope of Work (SOW) Generator — AI Powered | ReportIQ"
      metaDescription="Generate custom scopes of work and project SOW agreements instantly with AI. Free freelance contract helper."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}
