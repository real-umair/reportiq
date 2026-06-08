import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseAdmin, supabase } from "../../_utils/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
      return res.status(500).json({ error: feedbackErr.message });
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

    return res.status(200).json({ success: true, feedback: feedbackData });
  } catch (err: any) {
    console.error("[Feedback Endpoint] Global error:", err);
    return res.status(500).json({ error: err.message || "Failed to submit feedback" });
  }
}
