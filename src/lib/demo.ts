export const DEMO_PASSWORD = "gardenhub";

export const DEMO_ACCOUNTS = [
  { email: "manager1@demo.com", role: "manager" },
  { email: "manager2@demo.com", role: "manager" },
  { email: "member1@demo.com", role: "member" },
  { email: "member2@demo.com", role: "member" },
  { email: "user1@demo.com", role: "new" },
  { email: "user2@demo.com", role: "pending" },
  { email: "pat@demo.com", role: "chat_removed" },
  { email: "admin@demo.com", role: "admin" },
] as const;

export const PLATFORM_ADMINS = new Set(["admin@demo.com"]);
