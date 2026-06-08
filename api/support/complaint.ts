import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin, supabase } from "../_utils/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { name, email, description, subject, plan } = req.body;
    if (!name || !email || !description) {
      return res.status(400).json({ error: "Name, email, and description are required." });
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

    const { default: nodemailer } = await import("nodemailer");

    if (host && user && pass) {
      console.log(`Sending support complaint via SMTP to support@reportiq.xyz...`);
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

      return res.status(200).json({ success: true, message: "Complaint sent successfully!" });
    } else {
      console.log(`[SIMULATED COMPLAINT EMAIL SENT TO support@reportiq.xyz]`);
      console.log(`Sender: Name: ${name}, Email: ${email}`);
      console.log(`Subject: ${emailSubject}`);
      console.log(`Body:\n${emailBody}`);
      console.log(`-----------------------------------------------`);
      return res.status(200).json({
        success: true,
        simulated: true,
        message: "Complaint sent successfully! (Simulated support complaint logged to terminal console)."
      });
    }
  } catch (err: any) {
    console.error("Failed to send support complaint email:", err);
    return res.status(500).json({ error: err.message || "Failed to submit support complaint." });
  }
}
