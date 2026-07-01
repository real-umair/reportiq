import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getAuthUser } from "../_utils/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: "Access denied. Invalid or missing session token." });
  }

  try {
    const {
      clientName,
      agencyName,
      periodStart,
      periodEnd,
      manualNotes,
      customMetrics,
      length, // target length: 'short' | 'medium' | 'detailed'
      tone,   // target tone
      isDocumentMode,
    } = req.body;

    if (!clientName || !periodStart || !periodEnd) {
      return res.status(400).json({ error: "Missing required fields: clientName, periodStart, periodEnd" });
    }

    let lengthGuidance = "Write approximately 500 words total";
    let maxTokens = 800;
    if (length === "short") {
      lengthGuidance = "Write maximum 250 words total";
      maxTokens = 400;
    } else if (length === "detailed") {
      lengthGuidance = "Write approximately 900 words total";
      maxTokens = 1600;
    }

    const selectedTone = tone || "Formal & Corporate";

    const systemPrompt = `You are an expert agency account manager. You write clear, positive, and polished client reports in English. Avoid technical jargon or system credits. Fill sections with professional, detailed copy according to this length rule: ${lengthGuidance}. Write this report in a ${selectedTone} tone and style. Your output MUST be a valid JSON object matching this schema exactly: { "summary": "executive summary paragraph", "sections": [ { "title": "completed milestone title", "content": "detailed summary paragraph matching desired length", "type": "completed" | "metrics" | "upcoming" } ] }`;
    
    // Prepare prompt
    let documentGuidance = "";
    if (isDocumentMode) {
      documentGuidance = "The following content was extracted from a document uploaded by the agency. Read it carefully, understand the key points, and write a professional client report based on this content. Ignore any formatting artifacts from the document extraction.";
    }

    const prompt = `
      You are an expert report writer for the digital agency "${agencyName || 'Smith Digital'}".
      Write a highly professional and encouraging client report for "${clientName}".
      Report timeframe: ${periodStart} to ${periodEnd}.
      Write this report in a ${selectedTone} tone and style.
      ${documentGuidance}

      Work accomplished, milestones, or raw updates:
      ${manualNotes || "(No additional notes provided)"}

      Key performance indicators & metrics:
      ${
        customMetrics && Array.isArray(customMetrics) && customMetrics.length > 0
          ? customMetrics.map((m: any) => `- ${m.label || m.name}: ${m.value}`).join("\n")
          : "(No specific metrics provided)"
      }

      Deliverables & Details:
      Please produce a summarized overview and construct exactly three distinct action blocks detailing:
      1. Work Completed: Concrete milestones finished during this period.
      2. Performance Highlight: Results achieved, metrics explanation, and progress.
      3. Future Focus: High-priority items targeted for the upcoming work cycles.
    `;

    const groqApiKey = process.env.GROQ_API_KEY || "";

    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY environment variable is not defined");
    }

    console.log("Generating report using highly accelerated Groq GPT OSS 120B model...");
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${groqApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        max_tokens: maxTokens,
        temperature: 0.2,
        include_reasoning: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned error status ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    const contentText = resJson.choices?.[0]?.message?.content;
    if (!contentText) {
      throw new Error("Invalid or empty response structure from Groq model completions.");
    }

    const parsedData = JSON.parse(contentText.trim());
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Groq AI report generation failed:", error);
    return res.status(500).json({ error: error.message || "Failed to generate AI report" });
  }
}
