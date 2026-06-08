import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { topic, tone, clientName } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Missing required field: topic" });
    }

    const selectedTone = tone || "Professional";

    const systemPrompt = `You are an expert agency account manager writing professional client report sections. 
Write a highly professional deliverable or milestone section based strictly on the user's topic.
The section tone must be: ${selectedTone}.
Write a single, highly polished and comprehensive paragraph (approx 3-5 sentences, max 120 words). 
Format: Return exactly a JSON object with this shape: { "title": "A short elegant title for the section", "content": "The generated section paragraph details according to the tone specified" }`;

    const prompt = `Topic of the section: "${topic}"
Client Name: "${clientName || 'our client partner'}"

Please generate the section title and content. No markdown or wrappers outside the requested JSON.`;

    const groqApiKey = process.env.GROQ_API_KEY || "";
    
    if (!groqApiKey) {
      throw new Error("GROQ_API_KEY environment variable is not defined");
    }

    console.log("Generating single section via Groq...");
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
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned error status ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    const contentText = resJson.choices?.[0]?.message?.content;
    if (!contentText) {
      throw new Error("Invalid or empty response from Groq completions.");
    }

    const parsedData = JSON.parse(contentText.trim());
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Groq AI section generation failed:", error);
    return res.status(500).json({ error: error.message || "Failed to generate AI section" });
  }
}
