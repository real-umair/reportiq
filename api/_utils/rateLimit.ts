const ipUsage: Record<string, Record<string, { count: number; resetAt: number }>> = {};

export function checkRateLimit(ip: string, tool: string): boolean {
  const now = Date.now();
  if (!ipUsage[ip]) ipUsage[ip] = {};
  if (!ipUsage[ip][tool] || ipUsage[ip][tool].resetAt < now) {
    ipUsage[ip][tool] = { count: 0, resetAt: now + 24 * 60 * 60 * 1000 };
  }
  if (ipUsage[ip][tool].count >= 3) return false;
  ipUsage[ip][tool].count++;
  return true;
}
