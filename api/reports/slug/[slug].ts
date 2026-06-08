import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase } from "../../_utils/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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

    if (!dbReport) {
      return res.status(404).json({ error: "Report not found" });
    }

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

    let profile = null;
    if (report.userId) {
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", report.userId)
        .maybeSingle();

      if (dbProfile) {
        profile = {
          uid: dbProfile.id,
          email: dbProfile.email,
          fullName: dbProfile.full_name,
          agencyName: dbProfile.agency_name,
          logoUrl: dbProfile.logo_url,
          brandColor: dbProfile.brand_color || "#6366f1",
          plan: dbProfile.plan || "free",
          reportsGeneratedThisMonth: dbProfile.reports_generated_this_month || 0,
          brandLogoUrl: dbProfile.brand_logo_url || null,
          avatarUrl: dbProfile.avatar_url || null,
        };
      }
    }

    let client = null;
    if (report.clientId) {
      const { data: dbClient } = await supabase
        .from("clients")
        .select("*")
        .eq("id", report.clientId)
        .maybeSingle();

      if (dbClient) {
        client = {
          id: dbClient.id,
          userId: dbClient.user_id,
          name: dbClient.name,
          email: dbClient.email,
          company: dbClient.company,
          logoUrl: dbClient.logo_url,
          notes: dbClient.notes,
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
