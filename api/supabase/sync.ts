import type { VercelRequest, VercelResponse } from "@vercel/node";
import { supabaseUrl, supabaseAnonKey } from "../_utils/supabase.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { clients, reports } = req.body;
    console.log(`Synchronizing database records to Supabase instance at ${supabaseUrl}...`);

    let syncClientsStatus = "unattempted";
    let syncReportsStatus = "unattempted";

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

    return res.status(200).json({
      status: "completed",
      syncedAt: new Date().toISOString(),
      syncClientsStatus,
      syncReportsStatus,
      supabaseInstance: supabaseUrl
    });
  } catch (err: any) {
    console.error("Supabase sync transaction failed:", err);
    return res.status(500).json({ error: err.message || "Supabase integration sync error" });
  }
}
