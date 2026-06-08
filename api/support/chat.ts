import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages list is required." });
    }

    const groqApiKey = process.env.GROQ_API_KEY || "";
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY is not defined");
    }

    const systemPrompt = `You are a helpful and professional customer support AI assistant for ReportIQ.
ReportIQ is an automated client reporting platform that helps digital agencies and creative freelancers generate branded progress reports, KPIs, and deliverables portals using AI.
Our official support email is support@reportiq.xyz (and NOT support@reportiq.com). When users ask for our support or contact email, always provide support@reportiq.xyz.

Key features of ReportIQ:
- Connect clients to agency workspaces.
- Compose reports manually or upload PDF/DOCX/TXT/Excel documents.
- Generate executive summaries and milestone sections with Groq Llama-3 AI.
- Share interactive public links with clients.
- Starter tier ($29/mo) unlocks: Custom Brand Logo, report attachments (images, docs, links), advanced tones (Formal, Friendly, Bold, Minimal) and length settings, AI section writer.
- Pro tier ($79/mo) unlocks: White labeling (removes ReportIQ branding), report analytics (track view counts and open timestamps), client portal logins, priority 24h support, branded agency URLs.

Answer user questions briefly, professionally, and clearly.`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    const assistantMessage = resJson.choices?.[0]?.message;
    return res.status(200).json({ message: assistantMessage });
  } catch (err: any) {
    console.error("Support chat error:", err);
    return res.status(500).json({ error: err.message || "Failed to process support message." });
  }
}
