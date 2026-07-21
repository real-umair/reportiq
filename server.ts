import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import multer from "multer";
import { createRequire } from "module";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const require = createRequire(import.meta.url);
// @ts-ignore
const pdfParse = require("pdf-parse");
// @ts-ignore
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import toolsHandler from "./api/tools.js";
import blogHandler from "./api/blog.js";
import seoHandler from "./api/seo.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Initialize Supabase Client on the backend
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey) : null;

// Authentication middleware to check Supabase user JWT token
const requireAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      console.warn("[requireAuth] Access denied. No session token provided in headers.");
      res.status(401).json({ error: "Access denied. No session token provided." });
      return;
    }
    const token = authHeader.substring(7);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[requireAuth] SUPABASE_URL or SUPABASE_ANON_KEY is not defined in local server environment");
      res.status(401).json({ error: "Access denied. Server misconfiguration." });
      return;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error("[requireAuth] Supabase auth.getUser error:", error.message || error);
      res.status(401).json({ error: "Access denied. Invalid session or token." });
      return;
    }
    if (!user) {
      console.warn("[requireAuth] Access denied. No user matched token.");
      res.status(401).json({ error: "Access denied. Invalid session or token." });
      return;
    }
    (req as any).user = user;
    next();
  } catch (err: any) {
    console.error("[requireAuth] Authentication exception caught:", err.message || err);
    res.status(401).json({ error: err.message || "Authentication failed." });
  }
};

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API endpoints
app.post("/api/reports/generate", requireAuth, async (req, res) => {
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
      res.status(400).json({ error: "Missing required fields: clientName, periodStart, periodEnd" });
      return;
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

    console.log("Generating report using highly accelerated Groq Llama 3.3 70B model...");
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
    res.json(parsedData);
  } catch (error: any) {
    console.error("Groq AI report generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI report" });
  }
});

app.post("/api/extract-document", requireAuth, upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file was uploaded." });
      return;
    }

    const { originalname, buffer } = req.file;
    const extension = path.extname(originalname).toLowerCase();
    let text = "";

    if (extension === ".pdf") {
      const data = await pdfParse(buffer);
      text = data.text || "";
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    } else if (extension === ".txt" || extension === ".csv" || extension === ".json") {
      text = buffer.toString("utf8");
    } else if (extension === ".xlsx" || extension === ".xls") {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let sheetsText: string[] = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        // Convert sheet to csv format representation
        const csv = XLSX.utils.sheet_to_csv(sheet);
        if (csv.trim()) {
          sheetsText.push(`--- Sheet: ${sheetName} ---\n${csv}`);
        }
      }
      text = sheetsText.join("\n\n");
    } else {
      res.status(400).json({ error: `Unsupported file type: ${extension}. Supported formats: .pdf, .docx, .txt, .csv, .json, .xlsx, .xls` });
      return;
    }

    res.json({ text: text.trim(), filename: originalname });
  } catch (error: any) {
    console.error("Document text extraction failed:", error);
    res.status(500).json({ error: error.message || "Failed to extract text from document" });
  }
});

app.post("/api/reports/generate-section", requireAuth, async (req, res) => {
  try {
    const { topic, tone, clientName } = req.body;
    if (!topic) {
      res.status(400).json({ error: "Missing required field: topic" });
      return;
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
    if (!contentText) {
      throw new Error("Invalid or empty response from Groq completions.");
    }

    const parsedData = JSON.parse(contentText.trim());
    res.json(parsedData);
  } catch (error: any) {
    console.error("Groq AI section generation failed:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI section" });
  }
});

// Real Polar.sh Checkout session initialization
app.post("/api/billing/checkout", async (req, res) => {
  try {
    const { productId, email, customToken, customStarterId, customProId, paymentType } = req.body;
    if (!productId) {
      res.status(400).json({ error: "Missing productId specification" });
      return;
    }

    const polarToken = customToken || process.env.POLAR_API_TOKEN || "";
    const origin = req.headers.referer || req.headers.origin || "http://localhost:3000";

    if (email === "farooquiumair18@gmail.com") {
      console.log(`[Admin Billing Bypass] Auto-upgrading farooquiumair18@gmail.com to ${productId}...`);
      const activeClient = supabaseAdmin || supabase;
      const { error: upgradeErr } = await activeClient
        .from("profiles")
        .update({ plan: productId })
        .eq("email", "farooquiumair18@gmail.com");
      
      if (upgradeErr) {
        console.error("[Admin Billing Bypass] Failed to auto-upgrade:", upgradeErr);
      }
      
      const successUrl = `${origin.split('?')[0]}?payment_success=true&plan_choice=${productId}`;
      res.json({ checkoutUrl: successUrl });
      return;
    }

    // Dynamically resolve final Polar Product ID based on Friendly Name, standard mapped ID, or Lifetime ID
    let finalProductId = productId;
    const isLifetime = paymentType === "lifetime";

    if (productId === "starter") {
      finalProductId = customStarterId || (isLifetime ? process.env.POLAR_STARTER_LIFETIME_PRODUCT_ID : process.env.POLAR_STARTER_PRODUCT_ID) || process.env.POLAR_STARTER_PRODUCT_ID || "2181cbf5-01d7-4d92-addd-716d658acfff";
    } else if (productId === "pro") {
      finalProductId = customProId || (isLifetime ? process.env.POLAR_PRO_LIFETIME_PRODUCT_ID : process.env.POLAR_PRO_PRODUCT_ID) || process.env.POLAR_PRO_PRODUCT_ID || "10b53983-e9e0-4d2a-b665-71798bf8618e";
    } else {
      const defaultStarter = "2181cbf5-01d7-4d92-addd-716d658acfff";
      const defaultPro = "10b53983-e9e0-4d2a-b665-71798bf8618e";
      if (productId === defaultStarter) {
        finalProductId = customStarterId || (isLifetime ? process.env.POLAR_STARTER_LIFETIME_PRODUCT_ID : process.env.POLAR_STARTER_PRODUCT_ID) || process.env.POLAR_STARTER_PRODUCT_ID || defaultStarter;
      } else if (productId === defaultPro) {
        finalProductId = customProId || (isLifetime ? process.env.POLAR_PRO_LIFETIME_PRODUCT_ID : process.env.POLAR_PRO_PRODUCT_ID) || process.env.POLAR_PRO_PRODUCT_ID || defaultPro;
      }
    }

    // Determine environment (Sandbox vs production) automatically from the Token pattern
    const isSandbox = polarToken.includes("sb") || polarToken.includes("sandbox");
    const apiHost = isSandbox ? "https://sandbox-api.polar.sh" : "https://api.polar.sh";
    const buyHost = isSandbox ? "https://sandbox-buy.polar.sh" : "https://buy.polar.sh";

    console.log(`[Polar Billing] Creating session for Product ID: ${finalProductId} via ${apiHost} (isSandbox: ${isSandbox})...`);

    // Fetch call directly to newer Polar.sh API endpoint for checkouts
    const polarResponse = await fetch(`${apiHost}/v1/checkouts`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${polarToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        products: [finalProductId],
        success_url: `${origin}?payment_success=true&plan_choice=${productId}&plan_product_id=${finalProductId}`,
        cancel_url: `${origin}?payment_cancel=true&plan_choice=${productId}&plan_product_id=${finalProductId}`,
        customer_email: email || undefined
      })
    });

    if (polarResponse.ok) {
      const resJson = await polarResponse.json();
      console.log("Polar Checkout session completed successfully:", resJson.url);
      res.json({ checkoutUrl: resJson.url || `${buyHost}/${finalProductId}` });
    } else {
      const errorText = await polarResponse.text();
      console.warn(`Polar API responded with status ${polarResponse.status}:`, errorText);
      // Construct a highly robust direct buy fallback link instead of the defunct custom preview page
      const directUrl = `${buyHost}/${finalProductId}`;
      res.json({ checkoutUrl: directUrl, isFallback: true });
    }
  } catch (err: any) {
    console.error("Polar subscription integration session creation failed:", err);
    res.status(500).json({ error: err.message || "Failed to fetch checkout url" });
  }
});

// Backend Signup with IP check to prevent abuse
app.post("/api/auth/signup", async (req, res) => {
  try {
    const { email, password, fullName, agencyName } = req.body;
    if (!email || !password || !agencyName) {
      res.status(400).json({ error: "Missing required signup fields" });
      return;
    }

    const signupIp = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || req.ip || "unknown").split(",")[0].trim();
    console.log(`[Signup attempt] Email: ${email}, IP: ${signupIp}`);

    if (!supabaseAdmin) {
      res.status(500).json({ error: "Supabase service role key is not configured on the server." });
      return;
    }

    // Check count of profiles created from this IP
    const { data: existingProfiles, error: countError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("signup_ip", signupIp);

    if (countError) {
      console.error("Failed to query IP accounts:", countError);
    }

    const existingCount = existingProfiles?.length || 0;
    if (existingCount >= 2) {
      res.status(400).json({ error: "Multiple free accounts detected from your location. Please sign in to your existing account or upgrade to a paid plan." });
      return;
    }

    // Sign up user with admin client (so we can set email_confirm and bypass limit delays)
    const { data: authData, error: signupError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        agency_name: agencyName
      }
    });

    if (signupError) {
      throw signupError;
    }

    const user = authData.user;
    if (user) {
      const defaultProfile = {
        id: user.id,
        email: email,
        full_name: fullName,
        agency_name: agencyName,
        brand_color: "#6366f1",
        plan: "free",
        reports_generated_this_month: 0,
        signup_ip: signupIp,
        signup_count_from_ip: existingCount + 1,
        white_label: false
      };

      const { error: profileError } = await supabaseAdmin.from("profiles").upsert(defaultProfile);
      if (profileError) {
        console.error("Failed to save profile on backend signup:", profileError);
        throw profileError;
      }
    }

    res.json({ user });
  } catch (err: any) {
    console.error("Express signup endpoint failure:", err);
    res.status(400).json({ error: err.message || "Failed to complete signup." });
  }
});

// Support AI Chat using Groq Llama-3 model
app.post("/api/support/chat", async (req, res) => {
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      res.status(450).status(400).json({ error: "Messages list is required." });
      return;
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
- Generate executive summaries and milestone sections with Groq Llama 3.3 AI.
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
        max_tokens: 300,
        include_reasoning: false
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errText}`);
    }

    const resJson = await response.json();
    const assistantMessage = resJson.choices?.[0]?.message;
    res.json({ message: assistantMessage });
  } catch (err: any) {
    console.error("Support chat error:", err);
    res.status(500).json({ error: err.message || "Failed to process support message." });
  }
});

app.post("/api/support/complaint", async (req, res) => {
  try {
    const { name, email, description, subject, plan } = req.body;
    if (!name || !email || !description) {
      res.status(400).json({ error: "Name, email, and description are required." });
      return;
    }

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Store support ticket in Supabase database
    const dbClient = supabaseAdmin || supabase;
    if (dbClient) {
      try {
        const { error: dbErr } = await dbClient
          .from("support_tickets")
          .insert({
            name,
            email,
            description,
            subject: subject || "General Issue",
            plan: plan || "free"
          });
        if (dbErr) {
          console.warn("[Support Ticket] Could not save to database:", dbErr);
        } else {
          console.log("[Support Ticket] Successfully saved to Supabase support_tickets table!");
        }
      } catch (dbErr) {
        console.warn("[Support Ticket] Could not save to database:", dbErr);
      }
    }

    const isPriority = plan === "pro";
    const emailSubject = `${isPriority ? "[PRIORITY PRO SUPPORT] " : ""}ReportIQ Support Ticket — ${subject || "General Issue"}`;
    const emailBody = `
New Support Ticket Received:
-----------------------------
Name: ${name}
Email: ${email}
Plan Tier: ${plan || "free"}
Priority: ${isPriority ? "High (Priority 24h Support)" : "Standard"}

Description:
${description}
    `.trim();

    if (host && user && pass) {
      console.log(`Sending support complaint via SMTP to support@reportiq.xyz...`);
      const { default: nodemailer } = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: `"ReportIQ Support" <${user}>`,
        to: "support@reportiq.xyz",
        subject: emailSubject,
        text: emailBody,
        html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b; line-height: 1.5;">
          <h2 style="color: #e11d48; margin-top: 0;">New Support Ticket Received ${isPriority ? '(PRIORITY PRO SUPPORT)' : ''}</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Plan Tier:</strong> <span style="text-transform: uppercase; font-weight: bold; color: ${isPriority ? '#6366f1' : '#64748b'}">${plan || "free"}</span></p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p><strong>Description:</strong></p>
          <p style="white-space: pre-wrap; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0;">${description}</p>
        </div>`,
      });

      res.json({ success: true, message: "Complaint sent successfully!" });
    } else {
      console.log(`[SIMULATED COMPLAINT EMAIL SENT TO support@reportiq.xyz]`);
      console.log(`Sender: Name: ${name}, Email: ${email}`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Body:\n${emailBody}`);
      console.log(`-----------------------------------------------`);
      res.json({
        success: true,
        simulated: true,
        message: "Complaint sent successfully! (Simulated support complaint logged to terminal console)."
      });
    }
  } catch (err: any) {
    console.error("Failed to send support complaint email:", err);
    res.status(500).json({ error: err.message || "Failed to submit support complaint." });
  }
});

// Real-time Supabase Data Synchronization
app.post("/api/supabase/sync", requireAuth, async (req, res) => {
  try {
    const { clients, reports } = req.body;
    console.log(`Synchronizing database records to Supabase instance at ${supabaseUrl}...`);

    let syncClientsStatus = "unattempted";
    let syncReportsStatus = "unattempted";

    // Standard REST postgrest endpoint payload
    if (clients && clients.length > 0) {
      const cleanClients = clients.map((c: any) => ({
        id: c.id,
        user_id: c.userId,
        name: c.name,
        company: c.company || null,
        email: c.email || null,
        notes: c.notes || null,
        created_at: c.createdAt ? new Date(c.createdAt).toISOString() : new Date().toISOString()
      }));

      const response = await fetch(`${supabaseUrl}/rest/v1/clients`, {
        method: "POST",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(cleanClients)
      });
      syncClientsStatus = response.ok ? "success" : `failed (status: ${response.status})`;
    }

    if (reports && reports.length > 0) {
      const cleanReports = reports.map((r: any) => ({
        id: r.id,
        user_id: r.userId,
        client_id: r.clientId,
        title: r.title,
        status: r.status,
        slug: r.slug,
        ai_summary: r.aiSummary || null,
        view_count: r.viewCount || 0,
        created_at: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString()
      }));

      const response = await fetch(`${supabaseUrl}/rest/v1/reports`, {
        method: "POST",
        headers: {
          "apikey": supabaseAnonKey,
          "Authorization": `Bearer ${supabaseAnonKey}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates"
        },
        body: JSON.stringify(cleanReports)
      });
      syncReportsStatus = response.ok ? "success" : `failed (status: ${response.status})`;
    }

    res.json({
      status: "completed",
      syncedAt: new Date().toISOString(),
      syncClientsStatus,
      syncReportsStatus,
      supabaseInstance: supabaseUrl
    });
  } catch (err: any) {
    console.error("Supabase sync transaction failed:", err);
    res.status(500).json({ error: err.message || "Supabase integration sync error" });
  }
});

// Direct email dispatch support
app.post("/api/reports/send-email", requireAuth, async (req, res) => {
  try {
    const { toEmail, subject, text, html, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;
    if (!toEmail) {
      res.status(400).json({ error: "Recipient email is required" });
      return;
    }

    const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

    // Dynamically replace any hardcoded localhost or browser-injected URLs for reports
    // with the official APP_URL configured in the environment variables (Vercel, Cloud Run, etc.)
    let processedText = text || "";
    let processedHtml = html || "";

    const replaceLocalhostWithAppUrl = (str: string) => {
      if (!str) return str;
      return str.replace(/https?:\/\/[^\s"'<>\n]+/g, (url) => {
        if (url.includes("/r/")) {
          const match = url.match(/\/r\/([a-zA-Z0-9_-]+)/);
          if (match) {
            return `${appUrl}/r/${match[1]}`;
          }
        }
        return url;
      });
    };

    processedText = replaceLocalhostWithAppUrl(processedText);
    processedHtml = replaceLocalhostWithAppUrl(processedHtml);

    const host = smtpHost || process.env.SMTP_HOST;
    const port = parseInt(smtpPort || process.env.SMTP_PORT || "587", 10);
    const user = smtpUser || process.env.SMTP_USER;
    const pass = smtpPass || process.env.SMTP_PASS;

    if (host && user && pass) {
      console.log(`Sending real email via SMTP host ${host} to ${toEmail}...`);
      const { default: nodemailer } = await import("nodemailer");
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });

      await transporter.sendMail({
        from: `"ReportIQ Platform" <${user}>`,
        to: toEmail,
        subject: subject || "Branded Progress Deliverables Report",
        text: processedText,
        html: processedHtml || `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">${processedText.replace(/\n/g, "<br>")}</div>`,
      });

      res.json({ success: true, message: "Email sent successfully!" });
    } else {
      console.log("No SMTP credentials configured. Creating a temporary Ethereal test mail account on the fly...");
      try {
        const { default: nodemailer } = await import("nodemailer");
        const testAccount = await nodemailer.createTestAccount();
        const testTransporter = nodemailer.createTransport({
          host: "smtp.ethereal.email",
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass,
          },
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
        res.json({
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
        res.json({
          success: true,
          simulated: true,
          message: "Email sent successfully! (ReportIQ test mode: Simulated deliverable logged to terminal console. To unlock real outbound SMTP delivery, configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS under Settings or in your environment settings)."
        });
      }
    }
  } catch (err: any) {
    console.error("Outbound mail delivery failure:", err);
    res.status(500).json({ error: err.message || "Outbound email delivery fell back with errors." });
  }
});

// Tools & Sitemap backend routes
app.all("/api/tools", async (req, res) => {
  try {
    await toolsHandler(req as any, res as any);
  } catch (err: any) {
    console.error("Local tools handler error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.all("/api/tools/:tool", async (req, res) => {
  req.query.tool = req.params.tool;
  try {
    await toolsHandler(req as any, res as any);
  } catch (err: any) {
    console.error("Local tools handler error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.get("/api/sitemap", async (req, res) => {
  req.query.tool = "sitemap";
  try {
    await toolsHandler(req as any, res as any);
  } catch (err: any) {
    console.error("Local sitemap handler error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.get("/sitemap.xml", async (req, res) => {
  req.query.tool = "sitemap";
  try {
    await toolsHandler(req as any, res as any);
  } catch (err: any) {
    console.error("Local sitemap handler error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Blog backend routes
app.get("/api/blog/posts", async (req, res) => {
  try {
    req.query.action = "posts";
    await blogHandler(req as any, res as any);
  } catch (err: any) {
    console.error("Local blog posts handler error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.get("/api/blog/post", async (req, res) => {
  try {
    req.query.action = "post";
    await blogHandler(req as any, res as any);
  } catch (err: any) {
    console.error("Local blog post handler error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

app.post("/api/reports/:id/feedback", async (req, res) => {
  try {
    const { id } = req.params;
    const { reaction, comment } = req.body;

    if (!reaction || !["great", "ok", "needs_work"].includes(reaction)) {
      res.status(400).json({ error: "Invalid reaction value. Must be 'great', 'ok', or 'needs_work'." });
      return;
    }

    const activeClient = supabaseAdmin || supabase;

    // 1. Insert feedback into report_feedback
    const { data: feedbackData, error: feedbackErr } = await activeClient
      .from("report_feedback")
      .insert({
        report_id: id,
        reaction,
        comment: comment || null
      })
      .select()
      .single();

    if (feedbackErr) {
      console.error("[Feedback Endpoint] Database insert failed:", feedbackErr);
      res.status(500).json({ error: feedbackErr.message });
      return;
    }

    // 2. Load report details to get creator's user_id and title
    const { data: report, error: reportErr } = await activeClient
      .from("reports")
      .select("user_id, title")
      .eq("id", id)
      .maybeSingle();

    if (reportErr || !report) {
      console.warn("[Feedback Endpoint] Could not fetch report details for email notification:", reportErr);
    } else {
      // 3. Load creator profile to get their email address and SMTP settings
      const { data: profile, error: profileErr } = await activeClient
        .from("profiles")
        .select("email, smtp_host, smtp_port, smtp_user, smtp_pass, agency_name")
        .eq("id", report.user_id)
        .maybeSingle();

      if (profileErr || !profile || !profile.email) {
        console.warn("[Feedback Endpoint] Could not fetch agency profile for email notification:", profileErr);
      } else {
        // 4. Send email notification via Nodemailer
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
        const user = profile.smtp_user || process.env.SMTP_USER;
        const pass = profile.smtp_pass || process.env.SMTP_PASS;

        try {
          const { default: nodemailer } = await import("nodemailer");
          let transporter;

          if (host && user && pass) {
            transporter = nodemailer.createTransport({
              host,
              port,
              secure: port === 465,
              auth: { user, pass }
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
            const senderEmail = user || "noreply@reportiq.xyz";
            const info = await transporter.sendMail({
              from: `"ReportIQ Notifications" <${senderEmail}>`,
              to: profile.email,
              subject: subject,
              text: emailBodyText,
              html: emailBodyHtml
            });

            if (!host || !user || !pass) {
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
    res.json({ success: true, feedback: feedbackData });
  } catch (err: any) {
    console.error("[Feedback Endpoint] Global error:", err);
    res.status(500).json({ error: err.message || "Failed to submit feedback" });
  }
});

app.get("/api/reports/slug/:slug", async (req, res) => {
  try {
    const slug = req.params.slug;
    console.log(`[Supabase Engine] Fetching report matching slug "${slug}" directly from Supabase...`);

    const { data: dbReport, error: reportErr } = await supabase
      .from("reports")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (reportErr) throw reportErr;

    if (!dbReport) {
      res.status(404).json({ error: "Report not found" });
      return;
    }

    // Use admin client to bypass guest RLS restriction for profiles/clients metadata
    const activeClient = supabaseAdmin || supabase;

    // Query Corresponding Profile
    let profile = null;
    let plan = "free";
    if (dbReport.user_id) {
      const { data: dbProfile } = await activeClient
        .from("profiles")
        .select("*")
        .eq("id", dbReport.user_id)
        .maybeSingle();

      if (dbProfile) {
        plan = dbProfile.plan || "free";
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

    // Securely increment view count on the database using the admin client to bypass guest RLS limitations
    const newViewCount = (dbReport.view_count || 0) + 1;
    let updatedRawData = { ...(dbReport.raw_data || {}) };

    if (plan === "pro" || plan === "arbitrage") {
      const currentLogs = Array.isArray(updatedRawData.viewsLog) ? [...updatedRawData.viewsLog] : [];
      currentLogs.push(new Date().toISOString());
      updatedRawData.viewsLog = currentLogs;
    }

    await activeClient
      .from("reports")
      .update({
        view_count: newViewCount,
        raw_data: updatedRawData
      })
      .eq("id", dbReport.id);

    // Map report fields to React camelCase types
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
      rawData: updatedRawData,
      sections: dbReport.sections || [],
      customMessage: dbReport.custom_message,
      attachments: dbReport.attachments || [],
      viewCount: newViewCount,
      createdAt: dbReport.created_at,
    };

    // Query Corresponding Client
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
          notes: dbClient.notes,
          createdAt: dbClient.created_at,
        };
      }
    }

    res.json({ report, profile, client });
  } catch (err: any) {
    console.error("Failed to query report by slug from Supabase:", err);
    res.status(500).json({ error: err.message || "Failed to query database" });
  }
});

app.post("/api/portal/login", async (req, res) => {
  try {
    const { email, agencyId } = req.body;
    if (!email) {
      res.status(400).json({ error: "Please enter your email address." });
      return;
    }

    const emailInput = email.trim().toLowerCase();

    // Use admin client to bypass guest RLS restriction for profiles/clients lookup
    const activeClient = supabaseAdmin || supabase;

    let dbClient = null;
    let matchingSubClient: any = null;

    // If agencyId is provided, let's first check if it matches a client ID directly
    if (agencyId) {
      const { data: clientById } = await activeClient
        .from("clients")
        .select("*")
        .eq("id", agencyId)
        .maybeSingle();

      if (clientById) {
        let isMatch = false;
        if (clientById.email && clientById.email.trim().toLowerCase() === emailInput) {
          isMatch = true;
        } else {
          try {
            const parsed = JSON.parse(clientById.notes || "{}");
            if (parsed && Array.isArray(parsed.subClients)) {
              const sub = parsed.subClients.find((s: any) => s.email && s.email.trim().toLowerCase() === emailInput);
              if (sub) {
                isMatch = true;
                matchingSubClient = sub;
              }
            }
          } catch(e) {}
        }

        if (isMatch) {
          dbClient = clientById;
        }
      }
    }

    if (!dbClient) {
      // 1. Fetch client matching email directly
      let query = activeClient
        .from("clients")
        .select("*")
        .ilike("email", emailInput);

      if (agencyId) {
        query = query.eq("user_id", agencyId);
      }

      const { data: directClient, error: clientError } = await query.maybeSingle();
      if (clientError) throw clientError;

      if (directClient) {
        dbClient = directClient;
      } else {
        // 2. Search notes column for subClients with matching email
        let notesQuery = activeClient
          .from("clients")
          .select("*")
          .like("notes", `%${emailInput}%`);

        if (agencyId) {
          notesQuery = notesQuery.eq("user_id", agencyId);
        }

        const { data: candidates, error: notesError } = await notesQuery;
        if (notesError) throw notesError;

        if (candidates && candidates.length > 0) {
          for (const candidate of candidates) {
            try {
              const parsed = JSON.parse(candidate.notes || "{}");
              if (parsed && Array.isArray(parsed.subClients)) {
                const sub = parsed.subClients.find((s: any) => s.email && s.email.trim().toLowerCase() === emailInput);
                if (sub) {
                  dbClient = candidate;
                  matchingSubClient = sub;
                  break;
                }
              }
            } catch(e) {}
          }
        }
      }
    }

    if (!dbClient) {
      res.status(404).json({
        error: "No client portal registered for this email address. Please contact your agency.",
      });
      return;
    }

    // 3. Fetch agency owner profile
    const { data: dbProfile, error: profileError } = await activeClient
      .from("profiles")
      .select("*")
      .eq("id", dbClient.user_id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!dbProfile) {
      res.status(404).json({ error: "Unable to locate parent agency profile." });
      return;
    }

    // Check plan limits - MUST be Pro or Arbitrage plan
    if (dbProfile.plan !== "pro" && dbProfile.plan !== "arbitrage") {
      res.status(403).json({
        error: "The client portal is only available on Pro and Arbitrage plans. Please contact your agency provider.",
      });
      return;
    }

    // 4. Fetch reports linked to this client (status must be ready or sent)
    const { data: dbReports, error: reportsError } = await activeClient
      .from("reports")
      .select("*")
      .eq("client_id", dbClient.id)
      .in("status", ["ready", "sent"])
      .order("created_at", { ascending: false });

    if (reportsError) throw reportsError;

    // Filter reports if a sub-client is logged in
    let filteredReports = dbReports || [];
    if (matchingSubClient) {
      filteredReports = filteredReports.filter((r: any) => {
        const rawData = r.raw_data || {};
        return rawData.isArbitrage === true && 
               rawData.subClientName && 
               rawData.subClientName.trim().toLowerCase() === matchingSubClient.name.trim().toLowerCase();
      });
    }

    // Map values to camelCase structures
    const client = {
      id: dbClient.id,
      userId: dbClient.user_id,
      name: matchingSubClient ? matchingSubClient.name : dbClient.name,
      email: matchingSubClient ? matchingSubClient.email : dbClient.email,
      company: dbClient.company,
      logoUrl: dbClient.logo_url || null,
      notes: dbClient.notes,
      createdAt: dbClient.created_at,
    };

    const profile = {
      uid: dbProfile.id,
      email: dbProfile.email,
      fullName: dbProfile.full_name,
      agencyName: dbProfile.agency_name,
      logoUrl: dbProfile.logo_url || null,
      brandColor: dbProfile.brand_color || "#6366f1",
      plan: dbProfile.plan,
      reportsGeneratedThisMonth: dbProfile.reports_generated_this_month || 0,
      avatarUrl: dbProfile.avatar_url || null,
      brandLogoUrl: dbProfile.brand_logo_url || null,
    };

    const reports = (filteredReports || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      clientId: r.client_id,
      title: r.title,
      periodStart: r.period_start,
      periodEnd: r.period_end,
      status: r.status,
      slug: r.slug,
      aiSummary: r.ai_summary,
      rawData: r.raw_data || {},
      sections: r.sections || [],
      customMessage: r.custom_message,
      attachments: r.attachments || [],
      tone: r.tone || "Formal & Corporate",
      viewCount: r.view_count || 0,
      createdAt: r.created_at,
    }));

    res.json({ client, profile, reports });
  } catch (err: any) {
    console.error("Portal API login failed:", err);
    res.status(500).json({ error: err.message || "Failed to log in." });
  }
});

// Automatically ensure Postgres database tables on Supabase using service role key
async function initializeDatabaseSchema() {
  const url = process.env.SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    console.warn("[Schema Setup] SUPABASE_SERVICE_ROLE_KEY is missing. Cannot verify database schemas automatically.");
    return;
  }

  console.log("[Schema Setup] Initializing database schemas on Supabase instance:", url);

  const sqlQuery = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Create public.profiles
    CREATE TABLE IF NOT EXISTS public.profiles (
      id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email text,
      full_name text,
      agency_name text,
      brand_color text DEFAULT '#6366f1',
      report_style text DEFAULT 'Professional',
      plan text DEFAULT 'free',
      polar_customer_id text,
      reports_generated_this_month integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS report_style text DEFAULT 'Professional';
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_ip text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_count_from_ip integer DEFAULT 1;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS white_label boolean DEFAULT false;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS smtp_host text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS smtp_port integer;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS smtp_user text;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS smtp_pass text;
    ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

    -- Create public.clients
    CREATE TABLE IF NOT EXISTS public.clients (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
      name text NOT NULL,
      email text,
      company text,
      notes text,
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

    -- Create public.reports
    CREATE TABLE IF NOT EXISTS public.reports (
      id uuid PRIMARY KEY,
      user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
      client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
      title text,
      period_start date,
      period_end date,
      status text DEFAULT 'draft',
      slug text UNIQUE,
      ai_summary text,
      sections jsonb,
      custom_message text,
      attachments jsonb DEFAULT '[]',
      tone text DEFAULT 'Formal & Corporate',
      view_count integer DEFAULT 0,
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS tone text DEFAULT 'Formal & Corporate';
    ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS raw_data jsonb DEFAULT '{}';
    ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

    -- Create public.support_tickets
    CREATE TABLE IF NOT EXISTS public.support_tickets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      email text NOT NULL,
      description text NOT NULL,
      subject text,
      plan text DEFAULT 'free',
      created_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

    -- Define RLS Policies for support tickets
    DROP POLICY IF EXISTS "Anyone can insert support tickets" ON public.support_tickets;
    CREATE POLICY "Anyone can insert support tickets" ON public.support_tickets FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Anyone can read support tickets" ON public.support_tickets;

    -- Bootstrap Supabase storage buckets and permissions
    INSERT INTO storage.buckets (id, name, public) VALUES ('report-images', 'report-images', true) ON CONFLICT (id) DO NOTHING;
    INSERT INTO storage.buckets (id, name, public) VALUES ('report-docs', 'report-docs', true) ON CONFLICT (id) DO NOTHING;

    DROP POLICY IF EXISTS "Public Select Storage Images" ON storage.objects;
    CREATE POLICY "Public Select Storage Images" ON storage.objects FOR SELECT USING (bucket_id = 'report-images' OR bucket_id = 'report-docs');

    DROP POLICY IF EXISTS "Anyone can insert details" ON storage.objects;
    CREATE POLICY "Anyone can insert details" ON storage.objects FOR INSERT WITH CHECK (
      (bucket_id = 'report-images' OR bucket_id = 'report-docs' OR bucket_id = 'avatars' OR bucket_id = 'logos')
      AND auth.uid() IS NOT NULL
    );

    -- Define RLS Policies
    DROP POLICY IF EXISTS "Users can only see own profile" ON public.profiles;
    CREATE POLICY "Users can only see own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

    DROP POLICY IF EXISTS "Users can only see own clients" ON public.clients;
    CREATE POLICY "Users can only see own clients" ON public.clients FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can only see own reports" ON public.reports;
    CREATE POLICY "Users can only see own reports" ON public.reports FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Public reports viewable by anyone" ON public.reports;
    CREATE POLICY "Public reports viewable by anyone" ON public.reports FOR SELECT USING (status = 'ready' OR status = 'sent');

    -- Create public.report_feedback table
    CREATE TABLE IF NOT EXISTS public.report_feedback (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      report_id uuid REFERENCES public.reports(id) ON DELETE CASCADE,
      reaction text CHECK (reaction IN ('great', 'ok', 'needs_work')),
      comment text,
      submitted_at timestamptz DEFAULT now()
    );
    ALTER TABLE public.report_feedback ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Anyone can submit feedback" ON public.report_feedback;
    CREATE POLICY "Anyone can submit feedback" ON public.report_feedback FOR INSERT WITH CHECK (true);

    DROP POLICY IF EXISTS "Report owners can view feedback" ON public.report_feedback;
    CREATE POLICY "Report owners can view feedback" ON public.report_feedback FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.reports 
        WHERE public.reports.id = report_feedback.report_id 
        AND public.reports.user_id = auth.uid()
      )
    );

    -- Create public.blogs table
    CREATE TABLE IF NOT EXISTS public.blogs (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      title text NOT NULL,
      slug text UNIQUE NOT NULL,
      content text NOT NULL,
      excerpt text,
      cover_image_url text,
      author text DEFAULT 'ReportIQ Team',
      tags text[] DEFAULT '{}',
      meta_title text,
      meta_description text,
      published boolean DEFAULT false,
      published_at timestamptz,
      view_count integer DEFAULT 0,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );

    ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Published blogs viewable by all" ON public.blogs;
    CREATE POLICY "Published blogs viewable by all" ON public.blogs FOR SELECT USING (published = true);

    DROP POLICY IF EXISTS "Admin can manage all blogs" ON public.blogs;
    CREATE POLICY "Admin can manage all blogs" ON public.blogs FOR ALL USING (true);

    -- Create handle_new_user function to automatically create profile
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS trigger AS $$
    BEGIN
      INSERT INTO public.profiles (id, email, full_name, agency_name, plan, brand_color, reports_generated_this_month, white_label)
      VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        COALESCE(new.raw_user_meta_data->>'agency_name', 'My Agency'),
        'free',
        '#6366f1',
        0,
        false
      )
      ON CONFLICT (id) DO NOTHING;
      RETURN new;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Create trigger to trigger handle_new_user on user creation
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  `;

  try {
    const res = await fetch(`${url}/client/v1/query`, {
      method: "POST",
      headers: {
        "apikey": serviceRoleKey,
        "Authorization": `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ query: sqlQuery })
    });

    if (res.ok) {
      console.log("[Schema Setup] Schema verified successfully. Postgres tables checked/created.");
    } else {
      const errText = await res.text();
      console.error(`[Schema Setup] Schema query error (Status ${res.status}):`, errText);
    }
  } catch (err) {
    console.error("[Schema Setup] Database setup request failed:", err);
  }
}

// Setup Vite Dev server / Production build server
async function configureApp() {
  await initializeDatabaseSchema();

  app.use(express.static(join(__dirname, 'dist')));

  // SEO dynamic injection route handler
  app.get(['/tools', '/tools/*', '/blog', '/blog/*'], async (req, res) => {
    const requestPath = req.path;
    let type = 'tools-home';
    let slug = '';
    
    if (requestPath.startsWith('/tools/')) {
      type = 'tool';
      slug = requestPath.substring(7);
    } else if (requestPath === '/tools') {
      type = 'tools-home';
    } else if (requestPath.startsWith('/blog/')) {
      type = 'blog';
      slug = requestPath.substring(6);
    } else if (requestPath === '/blog') {
      type = 'blog-home';
    }
    
    req.query = { ...req.query, type, slug };
    try {
      await seoHandler(req as any, res as any);
    } catch (err) {
      console.error("Local SEO handler error:", err);
      res.sendFile(join(__dirname, 'dist', 'index.html'));
    }
  });

  // Add this AFTER all other routes
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(__dirname, 'dist', 'index.html'))
    }
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`ReportIQ Server running at http://localhost:${PORT}`);
  });
}

configureApp();
