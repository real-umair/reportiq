import React from 'react';
import ToolPage, { ToolField } from './ToolPage';

export default function ToolSocialMedia() {
  const fields: ToolField[] = [
    { name: 'clientName', label: 'Client Name', placeholder: 'Fashion Brand' },
    { name: 'platforms', label: 'Social Platforms', placeholder: 'Instagram, TikTok' },
    { name: 'metrics', label: 'Performance Metrics', placeholder: 'Grew followers by 12%, engagement rate 4.8%, 150k video views', type: 'textarea' },
  ];

  const instructions = [
    "Enter the client name, social media platforms (e.g., Instagram, LinkedIn, TikTok), and key metrics.",
    "Click generate to construct a structured social media analytics breakdown.",
    "<strong>SEO Tip:</strong> Publish reports and share links using keywords like <strong>social media report generator free</strong> or <strong>instagram agency report template</strong> to capture traffic from social media managers looking for templates.",
    "Ensure you swap in your actual analytics export data into the draft before presenting to clients."
  ];

  const seoContent = (
    <div className="space-y-6 text-xs sm:text-sm text-slate-600">
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What is a social media report generator?</h2>
        <p className="leading-relaxed mb-4">
          A social media report generator — also called a social media reporting tool, social analytics report maker, or social media performance report builder — creates professional monthly social media reports for clients. It summarizes follower growth, engagement rates, reach, top performing content, and strategy results.
        </p>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">What should a social media report include?</h2>
        <p className="leading-relaxed mb-4">Every social media client report should cover:</p>
        <ul className="list-disc pl-5 space-y-1.5 mb-4">
          <li><strong>Follower growth</strong> — new followers gained and total count</li>
          <li><strong>Reach and impressions</strong> — how many people saw your content</li>
          <li><strong>Engagement rate</strong> — likes, comments, shares, and saves</li>
          <li><strong>Top performing posts</strong> — best content of the month</li>
          <li><strong>Paid ad results</strong> — if running social ads, ROAS and conversions</li>
          <li><strong>Next month content plan</strong> — upcoming campaigns and strategy</li>
        </ul>
      </div>
      <div>
        <h2 className="text-lg font-extrabold font-display text-slate-950 mb-3">Why agencies use social media report generators</h2>
        <p className="leading-relaxed">
          Social media managers typically manage 5 to 15 clients. Writing individual monthly reports for each client manually takes an entire work day. A social media report generator reduces each report to under 60 seconds, saving agencies 20 to 40 hours per month.
        </p>
      </div>
    </div>
  );

  return (
    <ToolPage
      title="Free Social Media Report Generator"
      description="Create professional social media reports instantly with AI. Free for agencies."
      fields={fields}
      apiEndpoint="/api/tools/social-media-report"
      metaTitle="Free Social Media Report Generator | ReportIQ"
      metaDescription="Create professional social media reports instantly with AI. Free social media report generator and instagram agency report template."
      instructions={instructions}
      seoContent={seoContent}
    />
  );
}

