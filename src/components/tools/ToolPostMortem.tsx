import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolPostMortem() {
  const fields: ToolField[] = [
    { name: 'projectName', label: 'Project Name', placeholder: 'Acme Q2 Marketing Campaign' },
    { name: 'wentWell', label: 'What Went Well', placeholder: 'Exceeded traffic target by 20%, design received high praise...', type: 'textarea' },
    { name: 'challenges', label: 'Challenges & Learnings', placeholder: 'Development phase delayed by 2 weeks, communications lag...', type: 'textarea' },
  ];

  const instructions = [
    "Input the project name or client campaign identifier.",
    "Outline the key achievements, targets exceeded, and successful aspects.",
    "Identify any bottlenecks, communication delays, or bugs that occurred, along with lessons for future sprints.",
    "<strong>SEO Tip:</strong> Build brand authority by sharing summaries targeting <strong>project post mortem report</strong> or <strong>retrospective summary writer</strong>."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a project post-mortem report?</h2>
        <p className="leading-relaxed mb-4">
          A project post-mortem report — also called a project retrospective or debrief summary — analyzes what went well, what went wrong, and how to improve future projects. It captures key insights and details actionable learnings for project teams and stakeholders.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why write a post-mortem?</h2>
        <p className="leading-relaxed mb-4">
          Post-mortems ensure that mistakes are not repeated and that successful strategies are documented and shared across the team. ReportIQ's AI compiles your rough bullet points into a clean, constructive report.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Project Post-Mortem Generator"
      description="Compile comprehensive project retrospective reports using AI. Analyze successes, challenges, and future optimizations."
      fields={fields}
      apiEndpoint="/api/tools/post-mortem"
      metaTitle="Free Project Post-Mortem Generator — AI Retrospective | ReportIQ"
      metaDescription="Generate detailed project post-mortem and retrospective reports instantly with AI. Free post-mortem template generator."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}
