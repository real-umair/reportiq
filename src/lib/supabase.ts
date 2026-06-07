import { createClient } from "@supabase/supabase-js";
import { Profile, Client, Report, Plan, ReportStatus } from "../types";

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helpers to map snake_case (Db) to camelCase (React Code)
export function mapProfile(dbProfile: any): Profile {
  const userPlan = (dbProfile.plan || "free") as Plan;

  return {
    uid: dbProfile.id,
    email: dbProfile.email,
    fullName: dbProfile.full_name,
    agencyName: dbProfile.agency_name,
    logoUrl: dbProfile.logo_url || null,
    brandColor: dbProfile.brand_color || "#6366f1",
    reportStyle: dbProfile.report_style || "Professional",
    plan: userPlan,
    reportsGeneratedThisMonth: dbProfile.reports_generated_this_month || 0,
    trialStartDate: undefined,
    isTrial: false,
    avatarUrl: dbProfile.avatar_url || null,
    brandLogoUrl: dbProfile.brand_logo_url || null,
    whiteLabel: dbProfile.white_label || false,
    smtpHost: dbProfile.smtp_host || null,
    smtpPort: dbProfile.smtp_port || null,
    smtpUser: dbProfile.smtp_user || null,
    smtpPass: dbProfile.smtp_pass || null,
  };
}

export function mapClient(dbClient: any): Client {
  return {
    id: dbClient.id,
    userId: dbClient.user_id,
    name: dbClient.name,
    email: dbClient.email,
    company: dbClient.company,
    logoUrl: dbClient.logo_url || null,
    notes: dbClient.notes,
    createdAt: dbClient.created_at,
  };
}

export function mapReport(dbReport: any): Report {
  return {
    id: dbReport.id,
    userId: dbReport.user_id,
    clientId: dbReport.client_id,
    title: dbReport.title,
    periodStart: dbReport.period_start,
    periodEnd: dbReport.period_end,
    status: dbReport.status as ReportStatus,
    slug: dbReport.slug,
    aiSummary: dbReport.ai_summary,
    rawData: dbReport.raw_data || {},
    sections: dbReport.sections || [],
    customMessage: dbReport.custom_message,
    attachments: dbReport.attachments || [],
    tone: dbReport.tone || "Formal & Corporate",
    viewCount: dbReport.view_count || 0,
    createdAt: dbReport.created_at,
  };
}

// User Action Wrappers backed strictly by Supabase
export const supabaseAuth = {
  onAuthStateChange(callback: (user: any) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      callback(session?.user || null);
    });
    return () => subscription.unsubscribe();
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  async signUp(email: string, password: string, fullName: string, agencyName: string, plan: Plan = "free") {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        fullName,
        agencyName,
        plan
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Signup failed");
    }

    const resJson = await response.json();
    
    // Automatically sign in client-side after backend admin signup succeeds
    const signInResult = await this.signIn(email, password);
    return signInResult;
  },

  async signOut() {
    await supabase.auth.signOut().catch(() => {});
  }
};

export const supabaseDb = {
  async getProfile(uid: string): Promise<Profile> {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (error) throw error;
    if (!data) {
      throw new Error("Profile not found");
    }

    if (data.email) {
      await this.syncTeamInvitations(uid, data.email);
    }

    return mapProfile(data);
  },

  async syncTeamInvitations(uid: string, email: string) {
    try {
      const { data: invs, error } = await supabase
        .from("team_members")
        .select("id")
        .eq("member_email", email.trim().toLowerCase())
        .is("member_id", null);

      if (error) {
        console.warn("Could not query team_members for auto-link in backend:", error);
        return;
      }

      if (invs && invs.length > 0) {
        for (const inv of invs) {
          await supabase
            .from("team_members")
            .update({
              member_id: uid,
              status: "active"
            })
            .eq("id", inv.id);
        }
      }
    } catch (err) {
      console.error("Failed to sync team invitations:", err);
    }
  },

  async getTeamContext(uid: string): Promise<{ ownerId: string; role: 'owner' | 'viewer' | 'editor' | 'admin' }> {
    const { data, error } = await supabase
      .from("team_members")
      .select("owner_id, role")
      .eq("member_id", uid)
      .eq("status", "active")
      .maybeSingle();

    if (data) {
      return { ownerId: data.owner_id, role: data.role as any };
    }
    return { ownerId: uid, role: "owner" };
  },

  async getTeamMembers(ownerId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from("team_members")
      .select(`
        *,
        profiles:member_id (
          full_name,
          avatar_url
        )
      `)
      .eq("owner_id", ownerId)
      .order("invited_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(row => ({
      id: row.id,
      ownerId: row.owner_id,
      memberEmail: row.member_email,
      memberId: row.member_id,
      role: row.role,
      status: row.status,
      invitedAt: row.invited_at,
      fullName: row.profiles?.full_name || null,
      avatarUrl: row.profiles?.avatar_url || null,
    }));
  },

  async inviteTeamMember(ownerId: string, email: string, role: string): Promise<any> {
    const trimmedEmail = email.trim().toLowerCase();
    const { data: existing } = await supabase
      .from("team_members")
      .select("id")
      .eq("owner_id", ownerId)
      .eq("member_email", trimmedEmail)
      .maybeSingle();

    if (existing) {
      throw new Error("This email is already invited or a member of your team.");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", trimmedEmail)
      .maybeSingle();

    const { data, error } = await supabase
      .from("team_members")
      .insert({
        owner_id: ownerId,
        member_email: trimmedEmail,
        member_id: profile?.id || null,
        role: role,
        status: profile ? "active" : "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async removeTeamMember(inviteId: string, ownerId: string): Promise<void> {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", inviteId)
      .eq("owner_id", ownerId);

    if (error) throw error;
  },

  async updateProfile(uid: string, updates: Partial<Profile>): Promise<Profile> {
    const dbUpdates: any = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.agencyName !== undefined) dbUpdates.agency_name = updates.agencyName;
    if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
    if (updates.brandColor !== undefined) dbUpdates.brand_color = updates.brandColor;
    if (updates.reportStyle !== undefined) dbUpdates.report_style = updates.reportStyle;
    if (updates.plan !== undefined) dbUpdates.plan = updates.plan;
    if (updates.reportsGeneratedThisMonth !== undefined) dbUpdates.reports_generated_this_month = updates.reportsGeneratedThisMonth;
    if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;
    if (updates.brandLogoUrl !== undefined) dbUpdates.brand_logo_url = updates.brandLogoUrl;
    if (updates.whiteLabel !== undefined) dbUpdates.white_label = updates.whiteLabel;
    if (updates.smtpHost !== undefined) dbUpdates.smtp_host = updates.smtpHost;
    if (updates.smtpPort !== undefined) dbUpdates.smtp_port = updates.smtpPort;
    if (updates.smtpUser !== undefined) dbUpdates.smtp_user = updates.smtpUser;
    if (updates.smtpPass !== undefined) dbUpdates.smtp_pass = updates.smtpPass;

    const { data, error } = await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("id", uid)
      .select()
      .single();

    if (error) throw error;
    return mapProfile(data);
  },

  async getClients(uid: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from("clients")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapClient);
  },

  async addClient(uid: string, client: Partial<Client>): Promise<Client> {
    const { data: { user } } = await supabase.auth.getUser();
    const activeUserId = user?.id || uid;
    const generatedId = client.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "client-" + Math.random().toString(36).substring(2, 11));
    const { data, error } = await supabase
      .from("clients")
      .insert({
        id: generatedId,
        user_id: activeUserId,
        name: client.name,
        email: client.email || null,
        company: client.company || null,
        logo_url: client.logoUrl || null,
        notes: client.notes || null,
      })
      .select()
      .single();

    if (error) throw error;
    return mapClient(data);
  },

  async updateClient(id: string, uid: string, client: Partial<Client>): Promise<Client> {
    const { data, error } = await supabase
      .from("clients")
      .update({
        name: client.name,
        email: client.email || null,
        company: client.company || null,
        notes: client.notes || null,
        logo_url: client.logoUrl || null,
      })
      .eq("id", id)
      .eq("user_id", uid)
      .select()
      .single();

    if (error) throw error;
    return mapClient(data);
  },

  async deleteClient(id: string, uid: string): Promise<void> {
    await supabase
      .from("reports")
      .update({ client_id: null })
      .eq("client_id", id)
      .eq("user_id", uid);

    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id)
      .eq("user_id", uid);

    if (error) throw error;
  },

  async getReports(uid: string): Promise<Report[]> {
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapReport);
  },

  async getReportBySlug(slug: string): Promise<{ report: Report | null; profile: Profile | null; client: Client | null }> {
    try {
      const cacheRes = await fetch(`/api/reports/slug/${encodeURIComponent(slug)}`);
      if (cacheRes.ok) {
        const payload = await cacheRes.json();
        if (payload && payload.report) {
          return {
            report: payload.report,
            profile: payload.profile,
            client: payload.client
          };
        }
      }
    } catch (err) {
      console.warn("Portal fetch details warning; queries direct database client next:", err);
    }

    const { data: dbReport, error: reportErr } = await supabase
      .from("reports")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (reportErr) throw reportErr;
    if (!dbReport) {
      return { report: null, profile: null, client: null };
    }

    const report = mapReport(dbReport);
    
    let profile = null;
    try {
      profile = await this.getProfile(report.userId);
    } catch (e) {
      console.warn("Could not load creator profile on portal render:", e);
    }

    let client = null;
    if (report.clientId) {
      const { data: dbClient } = await supabase
        .from("clients")
        .select("*")
        .eq("id", report.clientId)
        .maybeSingle();
      if (dbClient) {
        client = mapClient(dbClient);
      }
    }

    return { report, profile, client };
  },

  async addReport(uid: string, report: Partial<Report>): Promise<Report> {
    const generatedId = report.id || (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "report-" + Math.random().toString(36).substring(2, 11));
    const { data, error } = await supabase
      .from("reports")
      .insert({
        id: generatedId,
        user_id: uid,
        client_id: report.clientId || null,
        title: report.title,
        period_start: report.periodStart,
        period_end: report.periodEnd,
        status: report.status || "draft",
        slug: report.slug,
        ai_summary: report.aiSummary || null,
        raw_data: report.rawData || {},
        sections: report.sections || [],
        custom_message: report.customMessage || null,
        attachments: report.attachments || [],
        tone: report.tone || "Formal & Corporate",
      })
      .select()
      .single();

    if (error) throw error;
    return mapReport(data);
  },

  async updateReport(id: string, uid: string, report: Partial<Report>): Promise<Report> {
    const dbUpdates: any = {};
    if (report.title !== undefined) dbUpdates.title = report.title;
    if (report.periodStart !== undefined) dbUpdates.period_start = report.periodStart;
    if (report.periodEnd !== undefined) dbUpdates.period_end = report.periodEnd;
    if (report.status !== undefined) dbUpdates.status = report.status;
    if (report.aiSummary !== undefined) dbUpdates.ai_summary = report.aiSummary;
    if (report.rawData !== undefined) dbUpdates.raw_data = report.rawData;
    if (report.sections !== undefined) dbUpdates.sections = report.sections;
    if (report.customMessage !== undefined) dbUpdates.custom_message = report.customMessage;
    if (report.attachments !== undefined) dbUpdates.attachments = report.attachments;
    if (report.tone !== undefined) dbUpdates.tone = report.tone;
    if (report.viewCount !== undefined) dbUpdates.view_count = report.viewCount;

    const { data, error } = await supabase
      .from("reports")
      .update(dbUpdates)
      .eq("id", id)
      .eq("user_id", uid)
      .select()
      .single();

    if (error) throw error;
    return mapReport(data);
  },

  async deleteReport(id: string, uid: string): Promise<void> {
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("id", id)
      .eq("user_id", uid);

    if (error) throw error;
  }
};
