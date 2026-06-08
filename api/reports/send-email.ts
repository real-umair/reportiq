import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { toEmail, subject, text, html, smtpHost, smtpPort, smtpUser, smtpPass } = req.body;
    if (!toEmail) {
      return res.status(400).json({ error: "Recipient email is required" });
    }

    const appUrl = (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

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

    const { default: nodemailer } = await import("nodemailer");

    if (host && user && pass) {
      console.log(`Sending real email via SMTP host ${host} to ${toEmail}...`);
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

      return res.status(200).json({ success: true, message: "Email sent successfully!" });
    } else {
      console.log("No SMTP credentials configured. Creating a temporary Ethereal test mail account on the fly...");
      try {
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
