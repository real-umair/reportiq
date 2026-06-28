import { VercelRequest, VercelResponse } from '@vercel/node';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { supabase } from './_utils/supabase.js';

// Resolve __dirname in ESM environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define tool SEO metadata mapping
const toolMap: Record<string, { title: string; description: string; name: string }> = {
  'client-report-generator': {
    name: 'Client Report Generator',
    title: 'Free Client Report Generator — AI Powered | ReportIQ',
    description: 'Generate professional monthly client reports instantly with AI. Free client report writer template for freelancers and digital agencies.'
  },
  'agency-report-template': {
    name: 'Agency Report Template',
    title: 'Free Agency Report Template & Generator | ReportIQ',
    description: 'Write professional agency reports in seconds. Free AI tool for digital marketing agencies, SEO teams, and creative studios.'
  },
  'seo-report-generator': {
    name: 'SEO Report Generator',
    title: 'Free SEO Report Generator — AI Powered | ReportIQ',
    description: 'Generate professional SEO reports instantly with AI. Free seo report generator, organic traffic summary template.'
  },
  'client-update-email': {
    name: 'Client Update Email Writer',
    title: 'Free Client Update Email Writer — AI Powered | ReportIQ',
    description: 'Draft professional, encouraging client update emails detailing weekly tasks, accomplishments, and next milestones.'
  },
  'monthly-report-template': {
    name: 'Monthly Report Template',
    title: 'Free Monthly Report Template & Generator | ReportIQ',
    description: 'Produce high-quality monthly progress reports for your business, highlighting key achievements and next month plans.'
  },
  'kpi-report-generator': {
    name: 'KPI Report Generator',
    title: 'Free KPI Report Generator — AI Powered | ReportIQ',
    description: 'Compile detailed KPI summary reports containing metrics, performance analysis, highlights, and growth recommendations.'
  },
  'social-media-report': {
    name: 'Social Media Report Generator',
    title: 'Free Social Media Report Generator — AI Powered | ReportIQ',
    description: 'Analyze social channel performance. Generate breakdown summaries, engagement highlights, and future strategies.'
  },
  'invoice-description-writer': {
    name: 'Invoice Description Writer',
    title: 'Free Invoice Description Writer — AI Powered | ReportIQ',
    description: 'Write professional descriptions for invoice line items, covering design, consulting, and development hours.'
  },
  'project-status-report': {
    name: 'Project Status Report Writer',
    title: 'Free Project Status Report Writer — AI Powered | ReportIQ',
    description: 'Track project health. Generate status summaries, highlight bottlenecks or blockers, and specify next actions.'
  },
  'client-onboarding-email': {
    name: 'Client Onboarding Email Writer',
    title: 'Free Client Onboarding Email Writer — AI Powered | ReportIQ',
    description: 'Draft warm client onboarding emails welcoming new customers and aligning them on what to expect.'
  },
  'competitor-analysis-generator': {
    name: 'Competitor Analysis Generator',
    title: 'Free Competitor Analysis Generator — AI Powered | ReportIQ',
    description: 'Generate competitor analysis summaries to compare market positioning, identify gaps, and discover opportunities.'
  },
  'weekly-report-generator': {
    name: 'Weekly Progress Report Generator',
    title: 'Free Weekly Progress Report Generator — AI Powered | ReportIQ',
    description: 'Create weekly project progress updates detailing accomplishments, key metrics, and upcoming tasks.'
  },
  'ppc-performance-report': {
    name: 'PPC Ads Performance Report Writer',
    title: 'Free PPC Ads Performance Report Writer — AI Powered | ReportIQ',
    description: 'Compile ad spend, clicks, conversions, and ROAS metrics into professional advertising reports.'
  },
  'scope-of-work-generator': {
    name: 'Scope of Work (SOW) Generator',
    title: 'Free Scope of Work (SOW) Generator — AI Powered | ReportIQ',
    description: 'Draft comprehensive project SOW outlines specifying deliverables, project milestones, and contract terms.'
  },
  'project-post-mortem-generator': {
    name: 'Project Post-Mortem Debrief Writer',
    title: 'Free Project Post-Mortem Debrief Writer — AI Powered | ReportIQ',
    description: 'Run project retrospectives to highlight successes, address bottlenecks, and document key learnings.'
  },
  'onboarding-questionnaire-generator': {
    name: 'Client Onboarding Checklist Writer',
    title: 'Free Client Onboarding Checklist Writer — AI Powered | ReportIQ',
    description: 'Generate onboarding questionnaires to align project kickoff requirements and collect client details.'
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { type, slug } = req.query;

  // 1. Read index.html template
  const pathsToTry = [
    path.join(process.cwd(), 'dist', 'index.html'),
    path.join(process.cwd(), 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, '..', 'dist', 'index.html'),
    path.join(__dirname, '..', '..', 'dist', 'index.html')
  ];

  let indexHtml = '';
  let foundPath = '';
  for (const p of pathsToTry) {
    if (existsSync(p)) {
      indexHtml = readFileSync(p, 'utf8');
      foundPath = p;
      break;
    }
  }

  if (!indexHtml) {
    console.error("SEO Handler Error: dist/index.html not found. Paths tried:", pathsToTry);
    return res.status(500).send("Server template initialization error. Please run a production build first.");
  }

  // 2. Set default values
  let title = 'ReportIQ — AI Powered Client Reporting Tool for Freelancers and Agencies';
  let description = 'ReportIQ is the fastest AI client reporting tool for freelancers and agencies. Generate professional monthly client reports in 30 seconds. Free to start, no credit card needed.';
  let image = 'https://www.reportiq.xyz/og-image.png';
  let canonicalUrl = 'https://www.reportiq.xyz' + (req.url?.split('?')[0] || '');
  let jsonLdSchema = '';

  // 3. Resolve metadata details based on page type
  try {
    if (type === 'blog-home') {
      title = 'Client Reporting Blog — Tips for Freelancers and Agencies | ReportIQ';
      description = 'Expert tips on client reporting, agency growth, freelance productivity, and AI tools. Free resources updated weekly. Automate your client reports.';
    } else if (type === 'blog' && slug && typeof slug === 'string') {
      const { data: post, error } = await supabase
        .from('blogs')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (post) {
        title = post.meta_title || `${post.title} | ReportIQ Blog`;
        description = post.meta_description || post.excerpt || `Read our guide about ${post.title} on the ReportIQ blog.`;
        if (post.cover_image_url) {
          image = post.cover_image_url;
        }

        // Build BlogPosting schema markup
        const datePub = post.published_at ? new Date(post.published_at).toISOString() : new Date().toISOString();
        jsonLdSchema = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": "${canonicalUrl}"
          },
          "headline": ${JSON.stringify(post.title)},
          "description": ${JSON.stringify(description.substring(0, 160))},
          "image": ${JSON.stringify(image)},
          "author": {
            "@type": "Person",
            "name": ${JSON.stringify(post.author || 'ReportIQ Team')}
          },
          "publisher": {
            "@type": "Organization",
            "name": "ReportIQ",
            "logo": {
              "@type": "ImageObject",
              "url": "https://www.reportiq.xyz/favicon.svg"
            }
          },
          "datePublished": "${datePub}",
          "dateModified": "${post.updated_at ? new Date(post.updated_at).toISOString() : datePub}"
        }
        </script>
        `;
      } else {
        // Fallback for missing/deleted posts
        title = 'Article Not Found | ReportIQ Blog';
        description = 'The guide you are looking for does not exist, has been archived, or has moved to a new address.';
      }
    } else if (type === 'tools-home') {
      title = 'Free AI Tools for Freelancers & Agencies | ReportIQ';
      description = 'Explore 16 free AI-powered reporting tools for digital marketing agencies, SEO professionals, and freelancers. No signup required.';
    } else if (type === 'tool' && slug && typeof slug === 'string') {
      const toolMeta = toolMap[slug];
      if (toolMeta) {
        title = toolMeta.title;
        description = toolMeta.description;

        // Build SoftwareApplication schema markup for tool
        jsonLdSchema = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": ${JSON.stringify(toolMeta.name)},
          "description": ${JSON.stringify(toolMeta.description)},
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web Browser",
          "url": "${canonicalUrl}",
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
          }
        }
        </script>
        `;
      } else {
        title = 'Free AI Tools for Freelancers & Agencies | ReportIQ';
        description = 'Explore 16 free AI-powered reporting tools for digital marketing agencies, SEO professionals, and freelancers.';
      }
    }
  } catch (err) {
    console.error("SEO Metadata compilation failure:", err);
  }

  // 4. Inject dynamic SEO header fields into the static index.html markup
  const escapeHtml = (text: string) => text.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[m] || m));

  const escTitle = escapeHtml(title);
  const escDesc = escapeHtml(description);
  const escImg = escapeHtml(image);
  const escUrl = escapeHtml(canonicalUrl);

  let outputHtml = indexHtml;

  // Replace standard and social OG/Twitter head metadata
  outputHtml = outputHtml.replace(/<title>[^<]*<\/title>/i, `<title>${escTitle}</title>`);
  outputHtml = outputHtml.replace(/<meta name="description" content="[^"]*"/i, `<meta name="description" content="${escDesc}"`);
  outputHtml = outputHtml.replace(/<meta property="og:title" content="[^"]*"/i, `<meta property="og:title" content="${escTitle}"`);
  outputHtml = outputHtml.replace(/<meta property="og:description" content="[^"]*"/i, `<meta property="og:description" content="${escDesc}"`);
  outputHtml = outputHtml.replace(/<meta property="og:image" content="[^"]*"/i, `<meta property="og:image" content="${escImg}"`);
  outputHtml = outputHtml.replace(/<meta property="og:url" content="[^"]*"/i, `<meta property="og:url" content="${escUrl}"`);
  outputHtml = outputHtml.replace(/<meta name="twitter:title" content="[^"]*"/i, `<meta name="twitter:title" content="${escTitle}"`);
  outputHtml = outputHtml.replace(/<meta name="twitter:description" content="[^"]*"/i, `<meta name="twitter:description" content="${escDesc}"`);
  outputHtml = outputHtml.replace(/<meta name="twitter:image" content="[^"]*"/i, `<meta name="twitter:image" content="${escImg}"`);

  // Inject dynamic JSON-LD schema into head before closing tag
  if (jsonLdSchema) {
    outputHtml = outputHtml.replace('</head>', `${jsonLdSchema}\n</head>`);
  }

  // Return the SEO-enriched HTML document
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=600');
  return res.status(200).send(outputHtml);
}
