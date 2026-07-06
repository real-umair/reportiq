import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase, supabaseAdmin, getAuthUser } from "./_utils/supabase.js";
import nodemailer from "nodemailer";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (!action || Array.isArray(action)) {
    return res.status(400).json({ error: "Missing or invalid action parameter." });
  }

  // Route request based on action
  switch (action) {
    case "generate":
      return handleGenerate(req, res);
    case "generate-section":
      return handleGenerateSection(req, res);
    case "send-email":
      return handleSendEmail(req, res);
    case "slug":
      return handleGetBySlug(req, res);
    case "feedback":
      return handleFeedback(req, res);
    default:
      return res.status(400).json({ error: `Unknown action: ${action}` });
  }
}

// 1. handleGenerate
async function handleGenerate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Access denied. Invalid or missing session token." });

  try {
    const {
      clientName,
      agencyName,
      periodStart,
      periodEnd,
      manualNotes,
      customMetrics,
      length,
      tone,
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
    if (!groqApiKey) throw new Error("GROQ_API_KEY environment variable is not defined");

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
    if (!contentText) throw new Error("Invalid or empty response structure from Groq model completions.");

    const parsedData = JSON.parse(contentText.trim());
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Groq AI report generation failed:", error);
    return res.status(500).json({ error: error.message || "Failed to generate AI report" });
  }
}

// 2. handleGenerateSection
async function handleGenerateSection(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Access denied. Invalid or missing session token." });

  try {
    const { topic, tone, clientName } = req.body;
    if (!topic) return res.status(400).json({ error: "Missing required field: topic" });

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
    if (!groqApiKey) throw new Error("GROQ_API_KEY environment variable is not defined");

    console.log("Generating single section via Groq...");
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
        temperature: 0.7,
        include_reasoning: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned error status ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    const contentText = resJson.choices?.[0]?.message?.content;
    if (!contentText) throw new Error("Invalid or empty response from Groq completions.");

    const parsedData = JSON.parse(contentText.trim());
    return res.status(200).json(parsedData);
  } catch (error: any) {
    console.error("Groq AI section generation failed:", error);
    return res.status(500).json({ error: error.message || "Failed to generate AI section" });
  }
}

// 3. handleSendEmail
async function handleSendEmail(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const user = await getAuthUser(req);
  if (!user) return res.status(401).json({ error: "Access denied. Invalid or missing session token." });

  try {
    const { toEmail, subject, text, html, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;
    if (!toEmail) return res.status(400).json({ error: "Recipient email is required" });

    const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

    let processedText = text || "";
    let processedHtml = html || "";

    const replaceLocalhostWithAppUrl = (str: string) => {
      if (!str) return str;
      return str.replace(/https?:\/\/[^\s"'<>\n]+/g, (url) => {
        if (url.includes("/r/")) {
          const match = url.match(/\/r\/([a-zA-Z0-9_-]+)/);
          if (match) return `${appUrl}/r/${match[1]}`;
        }
        return url;
      });
    };

    processedText = replaceLocalhostWithAppUrl(processedText);
    processedHtml = replaceLocalhostWithAppUrl(processedHtml);

    const host = smtpHost || process.env.SMTP_HOST;
    const port = parseInt(smtpPort || process.env.SMTP_PORT || "587", 10);
    const smtpUsername = smtpUser || process.env.SMTP_USER;
    const smtpPassword = smtpPass || process.env.SMTP_PASS;

    if (host && smtpUsername && smtpPassword) {
      console.log(`Sending real email via SMTP host ${host} to ${toEmail}...`);
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user: smtpUsername, pass: smtpPassword },
      });

      await transporter.sendMail({
        from: `"ReportIQ Platform" <${smtpUsername}>`,
        to: toEmail,
        subject: subject || "Branded Progress Deliverables Report",
        text: processedText,
        html: processedHtml || `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">${processedText.replace(/\n/g, "<br>")}</div>`,
      });

      return res.status(200).json({ success: true, message: "Email sent successfully!" });
    } else {
      console.log("No SMTP credentials configured. Creating a temporary Ethereal test mail account on the fly...");
      try {
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });

        const info = await testTransporter.sendMail({
          from: '"ReportIQ Test" <test@reportiq.xyz>',
          to: toEmail,
          subject: subject || "Branded Progress Deliverables Report",
          text: processedText,
          html: processedHtml || `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">${processedText.replace(/\n/g, "<br>")}</div>`,
        });

        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log(`[Ethereal Test Mail Sent] Preview URL: ${previewUrl}`);
        return res.status(200).json({
          success: true,
          message: `Email sent (Test Mode)! View dynamic styling and email body here: ${previewUrl}`
        });
      } catch (testErr) {
        console.warn("Failed to generate test Ethereal account, falling back to simulated console logs:", testErr);
        console.log(`[SIMULATED EMAIL SENT IN DEV MODE]`);
        console.log(`Recipient: ${toEmail}`);
        console.log(`Subject: ${subject}`);
        console.log(`Content:\n${processedText}`);
        console.log(`-----------------------------------------------`);
        return res.status(200).json({
          success: true,
          simulated: true,
          message: "Email sent successfully! (ReportIQ test mode: Simulated deliverable logged to terminal console. To unlock real outbound SMTP delivery, configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS under Settings or in your environment settings)."
        });
      }
    }
  } catch (err: any) {
    console.error("Outbound mail delivery failure:", err);
    return res.status(500).json({ error: err.message || "Outbound email delivery fell back with errors." });
  }
}

// 4. handleGetBySlug
async function handleGetBySlug(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { slug } = req.query;
    if (!slug || Array.isArray(slug)) {
      return res.status(400).json({ error: "Slug parameter is required." });
    }

    console.log(`[Supabase Engine] Fetching report matching slug "${slug}" directly from Supabase...`);

    const { data: dbReport, error: reportErr } = await supabase
      .from("reports")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (reportErr) throw reportErr;
    if (!dbReport) return res.status(404).json({ error: "Report not found" });

    const report = {
      id: dbReport.id,
      userId: dbReport.user_id,
      clientId: dbReport.client_id,
      title: dbReport.title,
      periodStart: dbReport.period_start,
      periodEnd: dbReport.period_end,
      status: dbReport.status,
      slug: dbReport.slug,
      aiSummary: dbReport.ai_summary,
      rawData: dbReport.raw_data || {},
      sections: dbReport.sections || [],
      customMessage: dbReport.custom_message,
      attachments: dbReport.attachments || [],
      viewCount: dbReport.view_count || 0,
      createdAt: dbReport.created_at,
    };

    const activeClient = supabaseAdmin || supabase;

    let profile = null;
    if (report.userId) {
      const { data: dbProfile } = await activeClient
        .from("profiles")
        .select("*")
        .eq("id", report.userId)
        .maybeSingle();

      if (dbProfile) {
        profile = {
          uid: dbProfile.id,
          fullName: dbProfile.full_name,
          agencyName: dbProfile.agency_name,
          logoUrl: dbProfile.logo_url,
          brandColor: dbProfile.brand_color || "#6366f1",
          brandLogoUrl: dbProfile.brand_logo_url || null,
          avatarUrl: dbProfile.avatar_url || null,
        };
      }
    }

    let client = null;
    if (report.clientId) {
      const { data: dbClient } = await activeClient
        .from("clients")
        .select("*")
        .eq("id", report.clientId)
        .maybeSingle();

      if (dbClient) {
        client = {
          id: dbClient.id,
          name: dbClient.name,
          company: dbClient.company,
          logoUrl: dbClient.logo_url,
          createdAt: dbClient.created_at,
        };
      }
    }

    return res.status(200).json({ report, profile, client });
  } catch (err: any) {
    console.error("Failed to query report by slug from Supabase:", err);
    return res.status(500).json({ error: err.message || "Failed to query database" });
  }
}

// 5. handleFeedback
async function handleFeedback(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Report ID is required." });
    }

    const { reaction, comment } = req.body;
    if (!reaction || !["great", "ok", "needs_work"].includes(reaction)) {
      return res.status(400).json({ error: "Invalid reaction value. Must be 'great', 'ok', or 'needs_work'." });
    }

    const activeClient = supabaseAdmin || supabase;

    const { data: feedbackData, error: feedbackErr } = await activeClient
      .from("report_feedback")
      .insert({ report_id: id, reaction, comment: comment || null })
      .select()
      .single();

    if (feedbackErr) {
      console.error("[Feedback Endpoint] Database insert failed:", feedbackErr);
      return res.status(500).json({ error: feedbackErr.message });
    }

    const { data: report, error: reportErr } = await activeClient
      .from("reports")
      .select("user_id, title")
      .eq("id", id)
      .maybeSingle();

    if (reportErr || !report) {
      console.warn("[Feedback Endpoint] Could not fetch report details for email notification:", reportErr);
    } else {
      const { data: profile, error: profileErr } = await activeClient
        .from("profiles")
        .select("email, smtp_host, smtp_port, smtp_user, smtp_pass, agency_name")
        .eq("id", report.user_id)
        .maybeSingle();

      if (profileErr || !profile || !profile.email) {
        console.warn("[Feedback Endpoint] Could not fetch agency profile for email notification:", profileErr);
      } else {
        const subject = `New client feedback on ${report.title || "Client Report"}`;
        const reactionLabel = reaction === "great" ? "👍 Great" : reaction === "ok" ? "😐 OK" : "👎 Needs Work";
        const emailBodyText = `Hello,\n\nYour client has submitted new feedback on your report "${report.title || 'Client Report'}".\n\nReaction: ${reactionLabel}\nComment: ${comment || 'No comment provided'}\n\nBest regards,\nReportIQ Automated Notification`;

        const emailBodyHtml = `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #4f46e5; margin-bottom: 20px;">New Client Feedback Received</h2>
            <p>Hello,</p>
            <p>Your client has submitted new feedback on your report: <strong>"${report.title || 'Client Report'}"</strong>.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 6px;">
              <p style="margin: 0 0 10px 0;"><strong>Reaction:</strong> ${reactionLabel}</p>
              <p style="margin: 0;"><strong>Comment:</strong> ${comment || '<em style="color: #64748b;">No comment provided</em>'}</p>
            </div>
            <p style="color: #64748b; font-size: 12px; margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
              This notification was automatically sent from your ReportIQ workspace.
            </p>
          </div>
        `;

        const host = profile.smtp_host || process.env.SMTP_HOST;
        const port = parseInt(profile.smtp_port || process.env.SMTP_PORT || "587", 10);
        const smtpUsername = profile.smtp_user || process.env.SMTP_USER;
        const smtpPassword = profile.smtp_pass || process.env.SMTP_PASS;

        try {
          let transporter;
          if (host && smtpUsername && smtpPassword) {
            transporter = nodemailer.createTransport({
              host,
              port,
              secure: port === 465,
              auth: { user: smtpUsername, pass: smtpPassword }
            });
          } else {
            const isDev = process.env.NODE_ENV !== "production" || !process.env.SMTP_HOST;
            if (isDev) {
              const testAccount = await nodemailer.createTestAccount();
              transporter = nodemailer.createTransport({
                host: "smtp.ethereal.email",
                port: 587,
                secure: false,
                auth: { user: testAccount.user, pass: testAccount.pass }
              });
            }
          }

          if (transporter) {
            const senderEmail = smtpUsername || "noreply@reportiq.xyz";
            const info = await transporter.sendMail({
              from: `"ReportIQ Notifications" <${senderEmail}>`,
              to: profile.email,
              subject: subject,
              text: emailBodyText,
              html: emailBodyHtml
            });

            if (!host || !smtpUsername || !smtpPassword) {
              const etherealPreviewUrl = nodemailer.getTestMessageUrl(info) || "";
              console.log(`[Feedback Endpoint] [Ethereal Notification Sent] Preview URL: ${etherealPreviewUrl}`);
            } else {
              console.log(`[Feedback Endpoint] Notification email sent to ${profile.email}`);
            }
          } else {
            console.log(`[Feedback Endpoint] [SIMULATED EMAIL NOTIFICATION] Recipient: ${profile.email}, Subject: ${subject}`);
          }
        } catch (mailErr) {
          console.error("[Feedback Endpoint] Failed to send feedback notification email:", mailErr);
        }
      }
    }

    return res.status(200).json({ success: true, feedback: feedbackData });
  } catch (err: any) {
    console.error("[Feedback Endpoint] Global error:", err);
    return res.status(500).json({ error: err.message || "Failed to submit feedback" });
  }
}
