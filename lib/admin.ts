const adminIds = (process.env.ADMIN_USER_IDS ?? "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

export function isAdmin(clerkUserId: string): boolean {
  return adminIds.includes(clerkUserId);
}
