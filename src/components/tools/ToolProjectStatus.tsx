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

  return (
    <ToolPage
      title="Free Project Status Report Generator"
      description="Generate professional project status reports with AI. Free, no signup required."
      fields={fields}
      apiEndpoint="/api/tools/project-status"
      metaTitle="Free Project Status Report Generator | ReportIQ"
      metaDescription="Generate professional project status reports with AI. Free project status report template and weekly project status report layout."
      instructions={instructions}
    />
  );
}

