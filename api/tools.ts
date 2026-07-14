import { VercelRequest, VercelResponse } from '@vercel/node';
import { groqTools } from './_utils/groqTools.js';
import { checkRateLimit } from './_utils/rateLimit.js';
import { handleCors } from './_utils/cors.js';
import { sanitizeInput, validateFields } from './_utils/validation.js';
import { supabase, getAuthUser } from './_utils/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get the tool from query parameters first
  const { tool } = req.query;
  if (!tool || Array.isArray(tool)) {
    if (!handleCors(req, res)) return;
    return res.status(400).json({ error: 'Tool parameter is required' });
  }

  // Handle sitemap GET/OPTIONS requests, other tools must use POST
  if (tool === 'sitemap') {
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    // Set public CORS headers for sitemap so any crawler can fetch it
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
  } else {
    // Validate CORS for standard tools
    if (!handleCors(req, res)) return;

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  }

  // Check rate limit only for prompt tools (exclude sitemap)
  if (tool !== 'sitemap') {
    const user = await getAuthUser(req);
    if (!user) {
      const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
      const allowed = checkRateLimit(ip, tool);
      
      if (!allowed) {
        return res.status(429).json({ 
          limited: true, 
          message: "You have reached today's free limit. Sign up for ReportIQ to get unlimited access → reportiq.xyz"
        });
      }
    }
  }

  let prompt = '';
  
  switch (tool) {
    case 'sitemap': {
      let blogUrls = '';
      const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
      try {
        const { data: posts } = await supabase
          .from('blogs')
          .select('slug, published_at')
          .eq('published', true);
        if (posts && posts.length > 0) {
          blogUrls = posts.map(p => {
            const dateStr = p.published_at ? p.published_at.split('T')[0] : '2026-06-15';
            return `  <url>
    <loc>https://www.reportiq.xyz/blog/${escapeXml(p.slug)}</loc>
    <lastmod>${dateStr}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
          }).join('\n');
        }
      } catch (dbErr) {
        console.error("Failed to query blog posts for sitemap:", dbErr);
      }

      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.reportiq.xyz/</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/about</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/features</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/contact</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/privacy</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/terms</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.3</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/blog</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/client-report-generator</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/agency-report-template</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/seo-report-generator</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/client-update-email</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/monthly-report-template</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/kpi-report-generator</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/social-media-report</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/invoice-description-writer</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/project-status-report</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/client-onboarding-email</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/competitor-analysis-generator</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/weekly-report-generator</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/ppc-performance-report</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/scope-of-work-generator</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/project-post-mortem-generator</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://www.reportiq.xyz/tools/onboarding-questionnaire-generator</loc>
    <lastmod>2026-06-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
${blogUrls ? blogUrls + '\n' : ''}</urlset>`;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      return res.status(200).send(sitemap);
    }
    case 'health': {
      return res.status(200).json({ status: 'ok' });
    }
    case 'client-report': {
      const { clientName, industry, workDone } = req.body || {};
      if (!validateFields({ clientName, industry, workDone }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sIndustry = sanitizeInput(industry);
      const sWorkDone = sanitizeInput(workDone);
      prompt = `Write a highly detailed, professional client progress report for ${sClientName} in the ${sIndustry} industry. Work completed: ${sWorkDone}. Include sections: Work Completed, Key Results, Coming Up Next. Ensure each section has extensive, descriptive, and actionable content (minimum 600 words total).`;
      break;
    }
    case 'agency-report': {
      const { agencyName, clientName, month } = req.body || {};
      if (!validateFields({ agencyName, clientName, month }, res)) return;
      const sAgencyName = sanitizeInput(agencyName);
      const sClientName = sanitizeInput(clientName);
      const sMonth = sanitizeInput(month);
      prompt = `Write a comprehensive, professional agency report from ${sAgencyName} for client ${sClientName} for the exact period of ${sMonth} (you must output the exact year and month from the input and do not default to other years). Include: Executive Summary, Work Completed, Results, Next Steps. Ensure each section is detailed, descriptive, and professional (minimum 700 words total).`;
      break;
    }
    case 'seo-report': {
      const { website, keywords, month, rawData, workDone } = req.body || {};
      if (!validateFields({ website, keywords, month, rawData }, res)) return;
      const sWebsite = sanitizeInput(website);
      const sKeywords = sanitizeInput(keywords);
      const sMonth = sanitizeInput(month);
      const sRawData = rawData ? sanitizeInput(rawData) : '';
      const sWorkDone = workDone ? sanitizeInput(workDone) : '';

      let rawDataContent = '';
      if (sRawData) {
        rawDataContent = `Here is the actual raw SEO performance data and metrics:
        ${sRawData}
        
        Strict rule: Focus your findings and recommendations on this raw data.`;
      }

      prompt = `Write an extensive, highly professional, and comprehensive SEO report for ${sWebsite} targeting keywords: ${sKeywords} for the exact period of ${sMonth}.
Work completed and SEO optimizations: ${sWorkDone}.
${rawDataContent}

Format your response using Markdown, including the following exact sections:

## Executive Summary
Provide a detailed, multi-paragraph executive summary comparing performance, strengths, and primary opportunities.

## Opportunity Score
Provide a Markdown table with columns (Category | Score) for these categories: Local SEO, Technical SEO, Content Strategy, Authority, Overall Opportunity.

## Priority Levels
Provide a Markdown table with columns (Priority | Recommendation) listing recommendations with priority emojis (🔴 High, 🟠 Medium, 🟢 Low).

## Expected Impact
Provide a Markdown table with columns (Recommendation | Expected Impact) listing recommendations and their expected impact (High, Medium, Low).

## Conclusion
Write a thorough, professional, and encouraging concluding section.

Ensure all tables are formatted correctly. Each section must have deep, thorough analysis and explanations (minimum 1000 words total).`;
      break;
    }
    case 'client-email': {
      const { clientName, workCompleted, nextSteps } = req.body || {};
      if (!validateFields({ clientName, workCompleted, nextSteps }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sWorkCompleted = sanitizeInput(workCompleted);
      const sNextSteps = sanitizeInput(nextSteps);
      prompt = `Write a detailed, professional client update email to ${sClientName}. Work completed: ${sWorkCompleted}. Next steps: ${sNextSteps}. Friendly yet professional tone, ensuring everything is explained clearly and comprehensively (minimum 400 words total).`;
      break;
    }
    case 'monthly-report': {
      const { businessType, month, keyResults } = req.body || {};
      if (!validateFields({ businessType, month, keyResults }, res)) return;
      const sBusinessType = sanitizeInput(businessType);
      const sMonth = sanitizeInput(month);
      const sKeyResults = sanitizeInput(keyResults);
      prompt = `Write an in-depth monthly performance report for a ${sBusinessType} business for the exact period of ${sMonth} (you must output the exact year and month from the input and do not default to other years). Key results: ${sKeyResults}. Include: Monthly Summary, Key Achievements, Metrics, Next Month Plan. Ensure every section has detailed, professional analysis (minimum 700 words total).`;
      break;
    }
    case 'kpi-report': {
      const { businessName, kpis, period } = req.body || {};
      if (!validateFields({ businessName, kpis, period }, res)) return;
      const sBusinessName = sanitizeInput(businessName);
      const sKpis = sanitizeInput(kpis);
      const sPeriod = sanitizeInput(period);
      prompt = `Write a highly detailed, professional KPI summary report for ${sBusinessName} for the exact period of ${sPeriod} (you must output the exact year and month/period from the input and do not default to other years). KPIs: ${sKpis}. Include: KPI Overview, Performance Analysis, Highlights, Recommendations. Ensure sections are thoroughly detailed with analytical insights (minimum 700 words total).`;
      break;
    }
    case 'social-media-report': {
      const { clientName, platforms, metrics } = req.body || {};
      if (!validateFields({ clientName, platforms, metrics }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sPlatforms = sanitizeInput(platforms);
      const sMetrics = sanitizeInput(metrics);
      prompt = `Write an in-depth social media performance report for ${sClientName} on ${sPlatforms}. Metrics: ${sMetrics}. Include: Performance Overview, Platform Breakdown, Key Wins, Next Month Strategy. Ensure each platform analysis is detailed, specific, and actionable (minimum 700 words total).`;
      break;
    }
    case 'invoice-description': {
      const { service, clientName, hours } = req.body || {};
      if (!validateFields({ service, clientName, hours }, res)) return;
      const sService = sanitizeInput(service);
      const sClientName = sanitizeInput(clientName);
      const sHours = sanitizeInput(hours);
      prompt = `Write professional and detailed invoice line item descriptions for ${sService} provided to ${sClientName} for ${sHours} hours. Write 3 professional, descriptive line items. 250 words maximum.`;
      break;
    }
    case 'project-status': {
      const { projectName, completedTasks, blockers, nextSteps } = req.body || {};
      if (!validateFields({ projectName, completedTasks, blockers, nextSteps }, res)) return;
      const sProjectName = sanitizeInput(projectName);
      const sCompletedTasks = sanitizeInput(completedTasks);
      const sBlockers = sanitizeInput(blockers);
      const sNextSteps = sanitizeInput(nextSteps);
      prompt = `Write a detailed, professional project status report for ${sProjectName}. Completed: ${sCompletedTasks}. Blockers: ${sBlockers}. Next steps: ${sNextSteps}. Ensure each section is descriptive and thorough (minimum 600 words total).`;
      break;
    }
    case 'onboarding-email': {
      const { clientName, serviceType, startDate } = req.body || {};
      if (!validateFields({ clientName, serviceType, startDate }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sServiceType = sanitizeInput(serviceType);
      const sStartDate = sanitizeInput(startDate);
      prompt = `Write a comprehensive, professional client onboarding welcome email for ${sClientName} starting ${sServiceType} on ${sStartDate}. Include: warm welcome, what to expect, next steps. Explain onboarding phases and resources in detail (minimum 450 words total).`;
      break;
    }
    case 'competitor-analysis': {
      const { clientName, competitor, focusArea, rawData } = req.body || {};
      if (!validateFields({ clientName, competitor, focusArea }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sCompetitor = sanitizeInput(competitor);
      const sFocusArea = sanitizeInput(focusArea);
      const sRawData = rawData ? sanitizeInput(rawData) : '';

      let rawDataContent = '';
      if (sRawData) {
        rawDataContent = `Here is the actual raw competitor data and metrics:
        ${sRawData}
        
        Strict rule: Focus your findings and recommendations on this raw data.`;
      }

      prompt = `Write a highly detailed, professional competitor analysis summary for ${sClientName} comparing against competitor ${sCompetitor} focusing on ${sFocusArea}.
${rawDataContent}

Format your response using Markdown, including the following exact sections:

## Executive Summary
Provide a detailed, multi-paragraph executive summary comparing our client's current positioning against the competitor's strengths and weaknesses.

## Opportunity Score
Provide a Markdown table with columns (Category | Score) for these categories: Local SEO, Technical SEO, Content Strategy, Authority, Overall Opportunity, comparing our client to the competitor.

## Priority Levels
Provide a Markdown table with columns (Priority | Recommendation) listing recommendations to win market share, with priority emojis (🔴 High, 🟠 Medium, 🟢 Low).

## Expected Impact
Provide a Markdown table with columns (Recommendation | Expected Impact) listing recommendations and their expected impact (High, Medium, Low).

## Conclusion
Write a thorough, professional, and encouraging concluding paragraph.

Ensure all tables are formatted correctly. Each section must provide deep analytical comparison and strategic insights (minimum 1000 words total).`;
      break;
    }
    case 'weekly-report': {
      const { clientName, tasksDone, nextSteps } = req.body || {};
      if (!validateFields({ clientName, tasksDone, nextSteps }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sTasksDone = sanitizeInput(tasksDone);
      const sNextSteps = sanitizeInput(nextSteps);
      prompt = `Write a detailed, professional weekly progress report for client ${sClientName}. Completed this week: ${sTasksDone}. Next week priorities: ${sNextSteps}. Include sections: Accomplishments, Next Steps. Provide thorough status updates for each task (minimum 600 words total).`;
      break;
    }
    case 'ppc-report': {
      const { clientName, adSpend, results, rawData, workDone } = req.body || {};
      if (!validateFields({ clientName, adSpend, rawData }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sAdSpend = sanitizeInput(adSpend);
      const sResults = sanitizeInput(results);
      const sRawData = rawData ? sanitizeInput(rawData) : '';
      const sWorkDone = workDone ? sanitizeInput(workDone) : '';

      let rawDataContent = '';
      if (sRawData) {
        rawDataContent = `Here is the actual raw campaign metrics and PPC data:
        ${sRawData}
        
        Strict rule: Focus your findings and recommendations on this raw data.`;
      }

      prompt = `Write a highly detailed, professional paid advertising performance report for client ${sClientName}.
Spend details: ${sAdSpend}.
Campaign outcomes: ${sResults}.
Adjustments & work completed: ${sWorkDone}.
${rawDataContent}

Format your response using Markdown, including the following exact sections:

## Executive Summary
Provide a detailed, multi-paragraph executive summary of the PPC campaign performance, highlighting ROI/ROAS, CPA, and spend efficiency.

## Opportunity Score
Provide a Markdown table with columns (Category | Score) for these categories: Campaign Structure, Conversion Rate, Bid Strategy, Ad Copy Relevance, Overall Opportunity.

## Priority Levels
Provide a Markdown table with columns (Priority | Recommendation) listing campaign recommendations with priority emojis (🔴 High, 🟠 Medium, 🟢 Low).

## Expected Impact
Provide a Markdown table with columns (Recommendation | Expected Impact) listing recommendations and their expected impact (High, Medium, Low).

## Conclusion
Write a thorough, professional, and encouraging concluding section.

Ensure all tables are formatted correctly. Each section must explain ROAS/CPA dynamics and keyword/placement performance in detail (minimum 1000 words total).`;
      break;
    }
    case 'scope-of-work': {
      const { projectName, deliverables, timeline } = req.body || {};
      if (!validateFields({ projectName, deliverables, timeline }, res)) return;
      const sProjectName = sanitizeInput(projectName);
      const sDeliverables = sanitizeInput(deliverables);
      const sTimeline = sanitizeInput(timeline);
      prompt = `Write a comprehensive, professional Scope of Work (SOW) outline for the project ${sProjectName}. Deliverables: ${sDeliverables}. Timeline & fee: ${sTimeline}. Include sections: Project Overview, Core Deliverables, Out-of-Scope Items, Timeline & Budget. Provide specific details under each heading (minimum 750 words total).`;
      break;
    }
    case 'post-mortem': {
      const { projectName, wentWell, challenges } = req.body || {};
      if (!validateFields({ projectName, wentWell, challenges }, res)) return;
      const sProjectName = sanitizeInput(projectName);
      const sWentWell = sanitizeInput(wentWell);
      const sChallenges = sanitizeInput(challenges);
      prompt = `Write an in-depth, professional project post-mortem and retrospective report for ${sProjectName}. Successes: ${sWentWell}. Bottlenecks/learnings: ${sChallenges}. Include sections: Retrospective Summary, Key Wins, Challenges & Root Causes, Future Sprints Recommendations. Explain takeaways and future prevention strategies in detail (minimum 700 words total).`;
      break;
    }
    case 'onboarding-questionnaire': {
      const { serviceType, industry, goals } = req.body || {};
      if (!validateFields({ serviceType, industry, goals }, res)) return;
      const sServiceType = sanitizeInput(serviceType);
      const sIndustry = sanitizeInput(industry);
      const sGoals = sanitizeInput(goals);
      prompt = `Write a comprehensive, professional client onboarding questionnaire template for a ${sServiceType} campaign in the ${sIndustry} industry targeting ${sGoals}. Create 10 strategic questions to gather critical requirements and brand alignment, adding guidance and context for why each question is asked (minimum 700 words total).`;
      break;
    }
    default:
      return res.status(400).json({ error: 'Invalid tool name' });
  }

  try {
    const completion = await groqTools.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2500,
    });

    return res.status(200).json({ result: completion.choices[0].message.content });
  } catch (error: any) {
    console.error(`Error in tool ${tool}:`, error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
