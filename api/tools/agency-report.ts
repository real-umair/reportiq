import { VercelRequest, VercelResponse } from '@vercel/node';
import { groqTools } from '../_utils/groqTools';
import { checkRateLimit } from '../_utils/rateLimit';
import { handleCors } from '../_utils/cors';
import { sanitizeInput, validateFields } from '../_utils/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
  const allowed = checkRateLimit(ip, 'agency-report');
  
  if (!allowed) {
    return res.status(429).json({ 
      limited: true, 
      message: "You have reached today's free limit. Sign up for ReportIQ to get unlimited access → reportiq.xyz"
    });
  }

  const { agencyName, clientName, month } = req.body;
  if (!validateFields({ agencyName, clientName, month }, res)) return;

  const sAgencyName = sanitizeInput(agencyName);
  const sClientName = sanitizeInput(clientName);
  const sMonth = sanitizeInput(month);

  try {
    const completion = await groqTools.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ 
        role: 'user', 
        content: `Write a professional agency report from ${sAgencyName} for client ${sClientName} for ${sMonth}. Include: Executive Summary, Work Completed, Results, Next Steps. 300 words maximum.` 
      }],
      max_tokens: 500,
    });

    return res.status(200).json({ result: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('Agency report generation error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
