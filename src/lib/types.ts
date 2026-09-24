export type AccountType = "manager" | "user";
export type Language = "en" | "es";
export type MembershipStatus = "pending" | "approved" | "rejected" | "removed";
export type EventCategory = "workday" | "workshop" | "meal" | "meeting" | "other";
export type Visibility = "public" | "members";
export type ModuleType =
  | "hero"
  | "about"
  | "gallery"
  | "upcoming_events"
  | "ways"
  | "tools"
  | "getting_here"
  | "announcements"
  | "contact";
export type BedStatus = "available" | "assigned" | "out_of_service";
export type JournalStage = "planted" | "growing" | "maintenance" | "harvest";
export type Involvement = "bed" | "volunteer" | "events" | "produce" | "learn";

export interface User {
  user_id: string;
  name: string;
  email: string;
  password_hash: string;
  account_type: AccountType;
  language: Language;
  phone: string;
  interest_tags: string;
  created_at: string;
  status: "active" | "disabled";
}

export interface Garden {
  garden_id: string;
  slug: string;
  name: string;
  description_en: string;
  description_es: string;
  address: string;
  neighborhood: string;
  timezone: string;
  contact_email: string;
  contact_phone: string;
  year_founded: string;
  bed_count: string;
  cover_image_url: string;
  involvement_options: string;
  verified: boolean;
  created_by: string;
  created_at: string;
}

export interface GardenManager {
  garden_id: string;
  user_id: string;
  added_at: string;
}

export interface HomeModule {
  module_id: string;
  garden_id: string;
  type: ModuleType;
  position: number;
  visible: boolean;
  title_en: string;
  title_es: string;
  body_en: string;
  body_es: string;
  config: Record<string, unknown>;
}

export interface Membership {
  membership_id: string;
  garden_id: string;
  user_id: string;
  status: MembershipStatus;
  note: string;
  interests: string;
  requested_at: string;
  decided_at: string;
  decided_by: string;
}

export interface GardenEvent {
  event_id: string;
  garden_id: string;
  title_en: string;
  title_es: string;
  description_en: string;
  description_es: string;
  category: EventCategory;
  location: string;
  start_datetime: string;
  end_datetime: string;
  all_day: boolean;
  visibility: Visibility;
  capacity: number | null;
  recurrence_rule: string;
  recurrence_until: string;
  status: "active" | "cancelled";
  created_by: string;
  created_at: string;
}

export interface EventException {
  exception_id: string;
  event_id: string;
  occurrence_date: string;
  action: "cancelled" | "modified";
  title_en?: string;
  title_es?: string;
  description_en?: string;
  description_es?: string;
  location?: string;
  start_time?: string;
  end_time?: string;
}

export interface MockEmail {
  email_id: string;
  to_email: string;
  subject_en: string;
  subject_es: string;
  body_en: string;
  body_es: string;
  created_at: string;
}

export interface Rsvp {
  rsvp_id: string;
  event_id: string;
  occurrence_date: string;
  user_id: string;
  name: string;
  email: string;
  party_size: number;
  volunteer: boolean;
  note: string;
  status: "going" | "cancelled";
  created_at: string;
}

export interface Announcement {
  announcement_id: string;
  garden_id: string;
  title_en: string;
  title_es: string;
  body_en: string;
  body_es: string;
  visibility: Visibility;
  pinned: boolean;
  created_by: string;
  created_at: string;
}

export interface Activity {
  activity_id: string;
  garden_id: string;
  type: string;
  ref_id: string;
  visibility: Visibility;
  /** Empty means everyone allowed by visibility. Set to notify one person. */
  audience_user_id: string;
  summary_en: string;
  summary_es: string;
  created_at: string;
}

export interface InboxState {
  user_id: string;
  garden_id: string;
  last_seen_at: string;
}

export interface Bed {
  bed_id: string;
  garden_id: string;
  label: string;
  size: string;
  notes: string;
  status: BedStatus;
  assigned_user_id: string;
  season: string;
}

export interface JournalEntry {
  entry_id: string;
  bed_id: string;
  garden_id: string;
  user_id: string;
  entry_date: string;
  stage: JournalStage;
  crop: string;
  text: string;
  image_urls: string[];
  harvest_amount: number | null;
  harvest_unit: "lb" | "kg" | "";
  created_at: string;
}

export interface Visit {
  visit_id: string;
  garden_id: string;
  user_id: string;
  visited_at: string;
  source: "checkin" | "rsvp";
}

export interface ChatMessage {
  message_id: string;
  garden_id: string;
  user_id: string;
  body: string;
  created_at: string;
  deleted: boolean;
  deleted_by: string;
}

export interface ChatBan {
  garden_id: string;
  user_id: string;
  banned_by: string;
  reason: string;
  created_at: string;
  active: boolean;
}

export interface Database {
  users: User[];
  gardens: Garden[];
  gardenManagers: GardenManager[];
  homeModules: HomeModule[];
  memberships: Membership[];
  events: GardenEvent[];
  eventExceptions: EventException[];
  rsvps: Rsvp[];
  announcements: Announcement[];
  activityLog: Activity[];
  inboxState: InboxState[];
  beds: Bed[];
  journalEntries: JournalEntry[];
  visits: Visit[];
  chatMessages: ChatMessage[];
  chatBans: ChatBan[];
  emails: MockEmail[];
}

export function emptyDatabase(): Database {
  return {
    users: [],
    gardens: [],
    gardenManagers: [],
    homeModules: [],
    memberships: [],
    events: [],
    eventExceptions: [],
    rsvps: [],
    announcements: [],
    activityLog: [],
    inboxState: [],
    beds: [],
    journalEntries: [],
    visits: [],
    chatMessages: [],
    chatBans: [],
    emails: [],
  };
}
