import { VercelRequest, VercelResponse } from '@vercel/node';
import { groqTools } from './_utils/groqTools.js';
import { checkRateLimit } from './_utils/rateLimit.js';
import { handleCors } from './_utils/cors.js';
import { sanitizeInput, validateFields } from './_utils/validation.js';
import { supabase } from './_utils/supabase.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Get the tool from query parameters first
  const { tool } = req.query;
  if (!tool || Array.isArray(tool)) {
    if (!handleCors(req, res)) return;
    return res.status(400).json({ error: 'Tool parameter is required' });
  }

  // Handle sitemap GET/OPTIONS requests, other tools must use POST
  if (tool === 'sitemap') {
    if (req.method !== 'GET' && req.method !== 'OPTIONS') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
    // Set public CORS headers for sitemap so any crawler can fetch it
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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
    const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
    const allowed = checkRateLimit(ip, tool);
    
    if (!allowed) {
      return res.status(429).json({ 
        limited: true, 
        message: "You have reached today's free limit. Sign up for ReportIQ to get unlimited access → reportiq.xyz"
      });
    }
  }

  let prompt = '';
  
  switch (tool) {
    case 'sitemap': {
      let blogUrls = '';
      try {
        const { data: posts } = await supabase
          .from('blogs')
          .select('slug, published_at')
          .eq('published', true);
        if (posts && posts.length > 0) {
          blogUrls = posts.map(p => {
            const dateStr = p.published_at ? p.published_at.split('T')[0] : '2026-06-15';
            return `  <url>
    <loc>https://www.reportiq.xyz/blog/${p.slug}</loc>
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
${blogUrls ? blogUrls + '\n' : ''}</urlset>`;
      res.setHeader('Content-Type', 'application/xml; charset=utf-8');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(sitemap);
    }
    case 'client-report': {
      const { clientName, industry, workDone } = req.body || {};
      if (!validateFields({ clientName, industry, workDone }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sIndustry = sanitizeInput(industry);
      const sWorkDone = sanitizeInput(workDone);
      prompt = `Write a professional client report for ${sClientName} in the ${sIndustry} industry. Work completed: ${sWorkDone}. Include sections: Work Completed, Key Results, Coming Up Next. 300 words maximum.`;
      break;
    }
    case 'agency-report': {
      const { agencyName, clientName, month } = req.body || {};
      if (!validateFields({ agencyName, clientName, month }, res)) return;
      const sAgencyName = sanitizeInput(agencyName);
      const sClientName = sanitizeInput(clientName);
      const sMonth = sanitizeInput(month);
      prompt = `Write a professional agency report from ${sAgencyName} for client ${sClientName} for ${sMonth}. Include: Executive Summary, Work Completed, Results, Next Steps. 300 words maximum.`;
      break;
    }
    case 'seo-report': {
      const { website, keywords, month } = req.body || {};
      if (!validateFields({ website, keywords, month }, res)) return;
      const sWebsite = sanitizeInput(website);
      const sKeywords = sanitizeInput(keywords);
      const sMonth = sanitizeInput(month);
      prompt = `Write a professional SEO report for ${sWebsite} targeting keywords: ${sKeywords} for ${sMonth}. Include: Overview, Keyword Performance, Traffic Summary, Recommendations. 300 words maximum.`;
      break;
    }
    case 'client-email': {
      const { clientName, workCompleted, nextSteps } = req.body || {};
      if (!validateFields({ clientName, workCompleted, nextSteps }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sWorkCompleted = sanitizeInput(workCompleted);
      const sNextSteps = sanitizeInput(nextSteps);
      prompt = `Write a professional client update email to ${sClientName}. Work completed: ${sWorkCompleted}. Next steps: ${sNextSteps}. Friendly professional tone. 200 words maximum.`;
      break;
    }
    case 'monthly-report': {
      const { businessType, month, keyResults } = req.body || {};
      if (!validateFields({ businessType, month, keyResults }, res)) return;
      const sBusinessType = sanitizeInput(businessType);
      const sMonth = sanitizeInput(month);
      const sKeyResults = sanitizeInput(keyResults);
      prompt = `Write a monthly report for a ${sBusinessType} business for ${sMonth}. Key results: ${sKeyResults}. Include: Monthly Summary, Key Achievements, Metrics, Next Month Plan. 300 words maximum.`;
      break;
    }
    case 'kpi-report': {
      const { businessName, kpis, period } = req.body || {};
      if (!validateFields({ businessName, kpis, period }, res)) return;
      const sBusinessName = sanitizeInput(businessName);
      const sKpis = sanitizeInput(kpis);
      const sPeriod = sanitizeInput(period);
      prompt = `Write a professional KPI summary report for ${sBusinessName} for ${sPeriod}. KPIs: ${sKpis}. Include: KPI Overview, Performance Analysis, Highlights, Recommendations. 300 words maximum.`;
      break;
    }
    case 'social-media-report': {
      const { clientName, platforms, metrics } = req.body || {};
      if (!validateFields({ clientName, platforms, metrics }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sPlatforms = sanitizeInput(platforms);
      const sMetrics = sanitizeInput(metrics);
      prompt = `Write a social media performance report for ${sClientName} on ${sPlatforms}. Metrics: ${sMetrics}. Include: Performance Overview, Platform Breakdown, Key Wins, Next Month Strategy. 300 words maximum.`;
      break;
    }
    case 'invoice-description': {
      const { service, clientName, hours } = req.body || {};
      if (!validateFields({ service, clientName, hours }, res)) return;
      const sService = sanitizeInput(service);
      const sClientName = sanitizeInput(clientName);
      const sHours = sanitizeInput(hours);
      prompt = `Write professional invoice line item descriptions for ${sService} provided to ${sClientName} for ${sHours} hours. Write 3 professional line items. 150 words maximum.`;
      break;
    }
    case 'project-status': {
      const { projectName, completedTasks, blockers, nextSteps } = req.body || {};
      if (!validateFields({ projectName, completedTasks, blockers, nextSteps }, res)) return;
      const sProjectName = sanitizeInput(projectName);
      const sCompletedTasks = sanitizeInput(completedTasks);
      const sBlockers = sanitizeInput(blockers);
      const sNextSteps = sanitizeInput(nextSteps);
      prompt = `Write a professional project status report for ${sProjectName}. Completed: ${sCompletedTasks}. Blockers: ${sBlockers}. Next steps: ${sNextSteps}. 300 words maximum.`;
      break;
    }
    case 'onboarding-email': {
      const { clientName, serviceType, startDate } = req.body || {};
      if (!validateFields({ clientName, serviceType, startDate }, res)) return;
      const sClientName = sanitizeInput(clientName);
      const sServiceType = sanitizeInput(serviceType);
      const sStartDate = sanitizeInput(startDate);
      prompt = `Write a professional client onboarding welcome email for ${sClientName} starting ${sServiceType} on ${sStartDate}. Include: warm welcome, what to expect, next steps. 250 words maximum.`;
      break;
    }
    default:
      return res.status(400).json({ error: 'Invalid tool name' });
  }

  try {
    const completion = await groqTools.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
    });

    return res.status(200).json({ result: completion.choices[0].message.content });
  } catch (error: any) {
    console.error(`Error in tool ${tool}:`, error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
