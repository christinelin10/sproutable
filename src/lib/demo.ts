export const DEMO_PASSWORD = "gardenhub";

export const DEMO_ACCOUNTS = [
  { email: "manager1@demo.com", name: "Maria Alvarez", group: "manager", note: "Riverside" },
  { email: "manager2@demo.com", name: "Sam Okonkwo", group: "manager", note: "Hilltop" },
  { email: "member1@demo.com", name: "Denise Carter", group: "user", note: "Member, bed holder" },
  { email: "member2@demo.com", name: "Carlos Rivera", group: "user", note: "Member, Spanish" },
  { email: "user1@demo.com", name: "Priya Shah", group: "user", note: "No garden yet" },
  { email: "user2@demo.com", name: "Luis Gomez", group: "user", note: "Pending request" },
  { email: "pat@demo.com", name: "Pat Nguyen", group: "user", note: "Removed from chat" },
  { email: "admin@demo.com", name: "Avery Chen", group: "user", note: "Verified badge" },
] as const;

export const PLATFORM_ADMINS = new Set(["admin@demo.com"]);
