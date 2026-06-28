import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

export const supabaseUrl = process.env.SUPABASE_URL || "";
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export const supabaseAdmin = supabaseServiceRoleKey ? createClient(supabaseUrl, supabaseServiceRoleKey) : null;

// Helper to authenticate user from Authorization header JWT token
export async function getAuthUser(req: any) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (!authHeader || typeof authHeader !== "string" || !authHeader.startsWith("Bearer ")) {
      console.warn("[getAuthUser] Missing or invalid Authorization header");
      return null;
    }
    const token = authHeader.substring(7);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[getAuthUser] SUPABASE_URL or SUPABASE_ANON_KEY is not defined in backend environment");
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
      console.error("[getAuthUser] Supabase auth.getUser error:", error.message || error);
      return null;
    }
    if (!user) {
      console.warn("[getAuthUser] No user found for this token");
      return null;
    }
    return user;
  } catch (err: any) {
    console.error("[getAuthUser] Exception caught during user lookup:", err.message || err);
    return null;
  }
}
