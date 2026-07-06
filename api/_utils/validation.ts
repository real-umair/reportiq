import { VercelResponse } from '@vercel/node';

export function sanitizeInput(input: any): string {
  if (typeof input !== 'string') return '';
  // 1. Remove HTML tags
  let sanitized = input.replace(/<\/?[^>]+(>|$)/g, "");
  // 2. Simple SQL injection defense (remove typical SQL commands or quotes)
  sanitized = sanitized.replace(/['"\\;]/g, "");
  // 3. Prompt injection defense
  const promptInjectionKeywords = [
    /ignore\s+(any\s+)?previous/gi,
    /system\s+prompt/gi,
    /ignore\s+instructions/gi,
    /you\s+are\s+now/gi,
    /new\s+role/gi,
    /stop\s+writing/gi,
    /do\s+not\s+write/gi
  ];
  for (const regex of promptInjectionKeywords) {
    sanitized = sanitized.replace(regex, "");
  }
  return sanitized.trim();
}

export function validateFields(fields: Record<string, any>, res: VercelResponse): boolean {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || String(value).trim() === '') {
      res.status(400).json({ error: 'All fields are required' });
      return false;
    }
    const maxLength = ['rawData', 'workDone', 'results', 'wentWell', 'challenges', 'kpis', 'metrics', 'deliverables', 'tasksDone', 'goals'].includes(key) ? 3000 : 500;
    if (String(value).length > maxLength) {
      res.status(400).json({ error: 'Input too long' });
      return false;
    }
  }
  return true;
}
