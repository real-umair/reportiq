import Groq from 'groq-sdk';

const apiKey = process.env.GROQ_TOOLS_API_KEY || process.env.GROQ_API_KEY || 'MISSING_KEY';

export const groqTools = new Groq({ apiKey });

