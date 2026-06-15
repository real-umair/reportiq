import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolProjectStatus() {
  const fields: ToolField[] = [
    { name: 'projectName', label: 'Project Name', placeholder: 'Mobile App Redesign' },
    { name: 'completedTasks', label: 'Completed Tasks', placeholder: 'Completed wireframes, finalized color scheme', type: 'textarea' },
    { name: 'blockers', label: 'Blockers', placeholder: 'Waiting on client feedback for branding assets', type: 'textarea' },
    { name: 'nextSteps', label: 'Next Steps', placeholder: 'Start high fidelity prototyping next week', type: 'textarea' },
  ];

  return (
    <ToolPage
      title="Free Project Status Report Generator"
      description="Generate professional project status reports with AI. Free, no signup required."
      fields={fields}
      apiEndpoint="/api/tools/project-status"
      metaTitle="Free Project Status Report Generator | ReportIQ"
      metaDescription="Generate professional project status reports with AI. Free, no signup required."
    />
  );
}
