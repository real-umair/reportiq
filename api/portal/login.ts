import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabase, supabaseAdmin } from "../_utils/supabase.js";
import { handleCors } from "../_utils/cors.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS check
  if (!handleCors(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, agencyId } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Please enter your email address." });
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
      return res.status(404).json({
        error: "No client portal registered for this email address. Please contact your agency.",
      });
    }

    // 3. Fetch agency owner profile
    const { data: dbProfile, error: profileError } = await activeClient
      .from("profiles")
      .select("*")
      .eq("id", dbClient.user_id)
      .maybeSingle();

    if (profileError) throw profileError;

    if (!dbProfile) {
      return res.status(404).json({ error: "Unable to locate parent agency profile." });
    }

    // Check plan limits - MUST be Pro or Arbitrage plan
    if (dbProfile.plan !== "pro" && dbProfile.plan !== "arbitrage") {
      return res.status(403).json({
        error: "The client portal is only available on Pro and Arbitrage plans. Please contact your agency provider.",
      });
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

    return res.status(200).json({ client, profile, reports });
  } catch (err: any) {
    console.error("Portal API login failed:", err);
    return res.status(500).json({ error: err.message || "Failed to log in." });
  }
}
