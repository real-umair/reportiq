import { VercelRequest, VercelResponse } from '@vercel/node';
import { groqTools } from '../_utils/groqTools';
import { checkRateLimit } from '../_utils/rateLimit';
import { handleCors } from '../_utils/cors';
import { sanitizeInput, validateFields } from '../_utils/validation';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!handleCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const ip = (req.headers['x-forwarded-for'] as string || 'unknown').split(',')[0].trim();
  const allowed = checkRateLimit(ip, 'client-report');
  
  if (!allowed) {
    return res.status(429).json({ 
      limited: true, 
      message: "You have reached today's free limit. Sign up for ReportIQ to get unlimited access → reportiq.xyz"
    });
  }

  const { clientName, industry, workDone } = req.body;
  if (!validateFields({ clientName, industry, workDone }, res)) return;

  const sClientName = sanitizeInput(clientName);
  const sIndustry = sanitizeInput(industry);
  const sWorkDone = sanitizeInput(workDone);

  try {
    const completion = await groqTools.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ 
        role: 'user', 
        content: `Write a professional client report for ${sClientName} in the ${sIndustry} industry. Work completed: ${sWorkDone}. Include sections: Work Completed, Key Results, Coming Up Next. 300 words maximum.` 
      }],
      max_tokens: 500,
    });

    return res.status(200).json({ result: completion.choices[0].message.content });
  } catch (error: any) {
    console.error('Client report generation error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
