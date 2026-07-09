export type Plan = 'free' | 'starter' | 'pro' | 'arbitrage';
export type ReportStatus = 'draft' | 'generating' | 'ready' | 'sent';
export type IntegrationType = 'github' | 'manual' | 'google_analytics' | 'notion';

export interface Profile {
  uid: string;
  email: string;
  fullName: string | null;
  agencyName: string | null;
  logoUrl: string | null;
  brandColor: string;
  reportStyle?: 'Professional' | 'Modern' | 'Minimal';
  plan: Plan;
  reportsGeneratedThisMonth: number;
  trialStartDate?: string;
  isTrial?: boolean;
  avatarUrl?: string | null;
  brandLogoUrl?: string | null;
  whiteLabel?: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpPass?: string | null;
}

export interface TeamMember {
  id: string;
  ownerId: string;
  memberEmail: string;
  memberId: string | null;
  role: 'viewer' | 'editor' | 'admin';
  status: 'pending' | 'active';
  invitedAt: string;
}

export interface Client {
  id: string;
  userId: string;
  name: string;
  email: string | null;
  company: string | null;
  logoUrl: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Integration {
  id: string;
  userId: string;
  clientId: string | null;
  type: IntegrationType;
  config: Record<string, any>;
  isActive: boolean;
}

export interface ReportSection {
  title: string;
  content: string;
  type: 'completed' | 'metrics' | 'upcoming' | 'custom';
}

export interface ReportAttachment {
  id: string;
  type: 'image' | 'link' | 'doc' | 'preview';
  name: string;
  url: string;
  size?: number;
  domainName?: string;
}

export interface Report {
  id: string;
  userId: string;
  clientId: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  status: ReportStatus;
  slug: string;
  aiSummary: string | null;
  rawData: Record<string, any>;
  sections: ReportSection[];
  customMessage: string | null;
  attachments?: ReportAttachment[];
  tone?: string;
  viewCount: number;
  createdAt: string;
}

export const PLAN_LIMITS: Record<Plan, { reports: number; clients: number }> = {
  free:      { reports: 3,    clients: 2    },
  starter:   { reports: 20,   clients: 10   },
  pro:       { reports: 999,  clients: 999  },
  arbitrage: { reports: 9999, clients: 9999 },
};
