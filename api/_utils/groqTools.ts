import Groq from 'groq-sdk';
export const groqTools = new Groq({ apiKey: process.env.GROQ_TOOLS_API_KEY });
