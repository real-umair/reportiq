import React, { useState, useEffect } from "react";
import { supabaseDb } from "../lib/supabase";
import { Users2, Mail, UserPlus, Trash2, ShieldAlert, CheckCircle2, UserCheck, AlertCircle } from "lucide-react";
import { Profile } from "../types";

interface TeamProps {
  userId: string;
  profile: Profile | null;
  onRefresh: () => void;
}

export default function Team({ userId, profile, onRefresh }: TeamProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"viewer" | "editor" | "admin">("viewer");
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("owner");

  // Load team information
  useEffect(() => {
    loadTeam();
  }, [userId]);

  async function loadTeam() {
    try {
      setLoading(true);
      setError(null);
      
      // Determine user access role
      const context = await supabaseDb.getTeamContext(userId);
      setCurrentUserRole(context.role);

      // Load all workspace team members using ownerId
      const ownerId = context.ownerId;
      const list = await supabaseDb.getTeamMembers(ownerId);
      setMembers(list);
    } catch (err: any) {
      console.error("Failed to load team list:", err);
      setError(err.message || "Could not retrieve team members.");
    } finally {
      setLoading(false);
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    
    setInviting(true);
    setError(null);
    setInviteSuccess(null);

    try {
      const context = await supabaseDb.getTeamContext(userId);
      if (context.role !== "owner" && context.role !== "admin") {
        throw new Error("Only agency owners or administrators can invite team members.");
      }

      await supabaseDb.inviteTeamMember(context.ownerId, inviteEmail.trim(), inviteRole);
      
      setInviteEmail("");
      setInviteRole("viewer");
      setInviteSuccess(`Successfully invited ${inviteEmail.trim()} as ${inviteRole}!`);
      setTimeout(() => setInviteSuccess(null), 5000);
      
      onRefresh();
      await loadTeam();
    } catch (err: any) {
      console.error("Failed to send invite:", err);
      setError(err.message || "Could not invite team member.");
    } finally {
      setInviting(false);
    }
  };

  const handleRemove = async (memberId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to remove team invitation for ${email}?`)) {
      return;
    }

    try {
      const context = await supabaseDb.getTeamContext(userId);
      if (context.role !== "owner" && context.role !== "admin") {
        throw new Error("Only agency owners or administrators can remove team members.");
      }

      await supabaseDb.removeTeamMember(memberId, context.ownerId);
      
      onRefresh();
      await loadTeam();
    } catch (err: any) {
      console.error("Error removing team member:", err);
      setError(err.message || "Could not remove team member.");
    }
  };

  const canManageTeam = currentUserRole === "owner" || currentUserRole === "admin";

  return (
    <div className="space-y-6 font-sans text-sm max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-normal flex items-center gap-2">
            <Users2 className="w-6 h-6 text-indigo-650 shrink-0 text-indigo-600" />
            Team Workspace Directory
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Invite colleagues, choose permissions levels, and work collaboratively under your agency brand.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-105 text-red-700 rounded-xl text-xs font-medium flex gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {inviteSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl text-xs font-semibold flex gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
          <span>{inviteSuccess}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invite Form */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1 px-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[9px] font-bold font-mono uppercase tracking-wider rounded-md">
                TEAM CONTROL
              </span>
            </div>
            <h3 className="font-bold font-display text-slate-950 text-base leading-snug">
              Invite Team Member
            </h3>
            
            {!canManageTeam ? (
              <div className="p-4 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-xs text-slate-600">
                  <ShieldAlert className="w-4 h-4" />
                  Access Restricted
                </p>
                <p className="text-[11px] leading-relaxed">
                  Only team owners and administrators can invite new members or change permission settings.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4 pt-1">
                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative flex items-center">
                    <Mail className="absolute left-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="colleague@agency.com"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 outline-none p-2.5 pl-9 bg-slate-50/50 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold font-mono uppercase tracking-wider text-slate-500 mb-1.5">
                    Initial Permission Role *
                  </label>
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 outline-none p-2.5 px-3 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-medium text-slate-800"
                  >
                    <option value="viewer">Viewer (Read-only access)</option>
                    <option value="editor">Editor (Can manage reports & clients)</option>
                    <option value="admin">Admin (Can invite members, write edits)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={inviting || !inviteEmail}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  {inviting ? "Sending invite..." : "Invite Member"}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Current Members List */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Active & Pending Team Alignment ({members.length})</h3>
              <span className="text-[10px] text-slate-400 font-mono">WORKSPACE SHARED REAL-TIME</span>
            </div>

            {loading ? (
              <div className="p-10 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Resolving active team membership profiles...
              </div>
            ) : members.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-2">
                <span className="text-3xl">👥</span>
                <p className="text-xs font-bold text-slate-600">No other team members invited yet</p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Invite your colleagues by entering their email address. Once they sign up using that email, they will automatically sync to your workspace securely!
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {/* Always include Workspace Owner at the top of list */}
                <div className="p-4 px-5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs">
                      👑
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-905 text-slate-900">{profile?.fullName || "Agency Owner"}</h4>
                      <p className="text-slate-500 text-[10px] font-mono leading-none mt-1">{profile?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="p-1 px-2.5 bg-indigo-150 text-indigo-700 text-[9px] font-bold font-mono bg-indigo-50 border border-indigo-100 rounded-md uppercase">
                      Owner (Admin)
                    </span>
                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 font-mono">
                      <span className="w-1.5 h-1.5 bg-emerald-555 bg-emerald-500 rounded-full animate-pulse" />
                      ACTIVE
                    </span>
                  </div>
                </div>

                {members.map((member) => (
                  <div key={member.id} className="p-4 px-5 flex items-center justify-between hover:bg-slate-50/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center overflow-hidden">
                        {member.avatarUrl ? (
                          <img src={member.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold font-mono">
                            {(member.fullName || member.memberEmail)[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900">{member.fullName || "Pending User Registration"}</h4>
                        </div>
                        <p className="text-slate-500 text-[10px] font-mono leading-none mt-1">{member.memberEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end gap-1">
                        <span className="p-1 px-2.5 bg-slate-100 border border-slate-200 text-slate-655 text-slate-600 text-[9px] font-bold font-mono rounded-md uppercase">
                          {member.role}
                        </span>
                        
                        {member.status === "active" ? (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 font-mono">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            ACTIVE
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-bold text-amber-500 font-mono animate-pulse" title="Awaiting user sign up matching this invited email">
                            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                            PENDING REGISTRATION
                          </span>
                        )}
                      </div>

                      {canManageTeam && (
                        <button
                          onClick={() => handleRemove(member.id, member.memberEmail)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                          title="Remove team member"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
