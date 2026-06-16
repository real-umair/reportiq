import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolProjectStatus() {
  const fields: ToolField[] = [
    { name: 'projectName', label: 'Project Name', placeholder: 'Mobile App Redesign' },
    { name: 'completedTasks', label: 'Completed Tasks', placeholder: 'Completed wireframes, finalized color scheme', type: 'textarea' },
    { name: 'blockers', label: 'Blockers', placeholder: 'Waiting on client feedback for branding assets', type: 'textarea' },
    { name: 'nextSteps', label: 'Next Steps', placeholder: 'Start high fidelity prototyping next week', type: 'textarea' },
  ];

  const instructions = [
    "Enter the project name, completed tasks, active blockers, and the next milestones.",
    "Click generate to create a structured status report outlining project health for stakeholders.",
    "<strong>SEO Tip:</strong> Drive traffic by linking your templates to pages targeting keywords like <strong>project status report template</strong> or <strong>weekly project status report layout</strong>.",
    "Be transparent about blockers to keep client expectations aligned."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a project status report generator?</h2>
        <p className="leading-relaxed mb-4">
          A project status report generator is a tool that automatically creates a structured project progress report. Using a project update report template or project milestone report ensures that stakeholders and clients stay aligned on timelines, accomplishments, and active project health.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What should a project progress report include?</h2>
        <p className="leading-relaxed mb-4">A standard project milestone report should cover:</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Current project health</strong> — indication of whether the project is on track, at risk, or blocked</li>
          <li><strong>Milestone status updates</strong> — progress on active deliverables</li>
          <li><strong>Blockers and dependencies</strong> — any outstanding items causing delays</li>
          <li><strong>Next action items</strong> — upcoming milestones and task ownership</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why automate project milestone reports?</h2>
        <p className="leading-relaxed">
          Drafting project progress reports manually can take hours of compiling updates from multiple sources. A project update report template saves time by formatting complex details into professional, readable bullet points in seconds, allowing you to focus on the work itself.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Project Status Report Generator"
      description="Generate professional project status reports with AI. Free, no signup required."
      fields={fields}
      apiEndpoint="/api/tools/project-status"
      metaTitle="Free Project Status Report Generator | ReportIQ"
      metaDescription="Generate professional project status reports with AI. Free project status report template and weekly project status report layout."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}

