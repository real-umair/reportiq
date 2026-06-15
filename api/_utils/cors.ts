import { VercelRequest, VercelResponse } from '@vercel/node';

export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';
  
  const allowedOrigins = [
    'https://www.reportiq.xyz',
    'https://reportiq.xyz',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  let matchedOrigin = '';
  if (origin && allowedOrigins.includes(origin)) {
    matchedOrigin = origin;
  } else if (referer) {
    const isAllowed = allowedOrigins.some(ao => referer.startsWith(ao));
    if (isAllowed) {
      try {
        matchedOrigin = new URL(referer).origin;
      } catch (e) {
        // invalid URL format
      }
    }
  }
  
  if (!matchedOrigin) {
    res.status(403).json({ error: 'CORS policy violation: Access from this origin is not allowed.' });
    return false;
  }
  
  res.setHeader('Access-Control-Allow-Origin', matchedOrigin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return false;
  }
  
  return true;
}
