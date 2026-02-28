import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// Example table — replace with your own schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

// --- Enums ---

export const experienceLevelEnum = pgEnum("experience_level", [
  "getting_started",
  "built_a_few",
  "ships_constantly",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "draft",
  "open",
  "active",
  "judging",
  "complete",
]);

export const teamPreferenceEnum = pgEnum("team_preference", [
  "solo",
  "has_team",
  "has_team_open",
  "looking_for_team",
]);

export const startingPointEnum = pgEnum("starting_point", ["new", "existing"]);

export const commitmentLevelEnum = pgEnum("commitment_level", [
  "all_in",
  "daily",
  "nights_weekends",
  "not_sure",
]);

export const userRoleEnum = pgEnum("user_role", [
  "user",
  "moderator",
  "admin",
]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "declined",
  "revoked",
]);

export const inviteTypeEnum = pgEnum("invite_type", ["direct", "link"]);

// --- Profiles ---

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  username: text("username").unique(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  twitterHandle: text("twitter_handle"),
  githubHandle: text("github_handle"),
  twitchUrl: text("twitch_url"),
  streamUrl: text("stream_url"),
  country: text("country"),
  region: text("region"),
  experienceLevel: experienceLevelEnum("experience_level"),
  role: userRoleEnum("role").default("user").notNull(),
  allowInvites: boolean("allow_invites").default(true).notNull(),
  bannedAt: timestamp("banned_at"),
  bannedBy: uuid("banned_by"),
  banReason: text("ban_reason"),
  hiddenAt: timestamp("hidden_at"),
  hiddenBy: uuid("hidden_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

// --- Events ---

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").unique().notNull(),
  description: text("description").notNull(),
  startsAt: timestamp("starts_at").notNull(),
  endsAt: timestamp("ends_at").notNull(),
  registrationOpensAt: timestamp("registration_opens_at"),
  registrationClosesAt: timestamp("registration_closes_at"),
  status: eventStatusEnum("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;

// --- Event Registrations ---

export const eventRegistrations = pgTable(
  "event_registrations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    teamPreference: teamPreferenceEnum("team_preference").notNull(),
    commitmentLevel: commitmentLevelEnum("commitment_level"),
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.eventId, t.profileId)]
);

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;

// --- Projects ---

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profiles.id),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  startingPoint: startingPointEnum("starting_point"),
  goalText: text("goal_text"),
  githubUrl: text("github_url"),
  liveUrl: text("live_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type Project = typeof projects.$inferSelect;
export type NewProject = typeof projects.$inferInsert;

// --- Event Projects (junction) ---

export const eventProjects = pgTable(
  "event_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.eventId, t.projectId)]
);

export type EventProject = typeof eventProjects.$inferSelect;
export type NewEventProject = typeof eventProjects.$inferInsert;

// --- Team Invites ---

export const teamInvites = pgTable(
  "team_invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => profiles.id),
    recipientId: uuid("recipient_id").references(() => profiles.id),
    type: inviteTypeEnum("type").notNull(),
    status: inviteStatusEnum("status").default("pending").notNull(),
    token: text("token").unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_team_invites_recipient_status").on(t.recipientId, t.type, t.status),
    index("idx_team_invites_sender_status").on(t.senderId, t.status),
    index("idx_team_invites_project_status").on(t.projectId, t.status),
  ]
);

export type TeamInvite = typeof teamInvites.$inferSelect;
export type NewTeamInvite = typeof teamInvites.$inferInsert;

// --- Project Members ---

export const projectMembers = pgTable(
  "project_members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    inviteId: uuid("invite_id").references(() => teamInvites.id),
    joinedAt: timestamp("joined_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.projectId, t.profileId)]
);

export type ProjectMember = typeof projectMembers.$inferSelect;
export type NewProjectMember = typeof projectMembers.$inferInsert;

// --- Relations ---

export const profilesRelations = relations(profiles, ({ many }) => ({
  eventRegistrations: many(eventRegistrations),
  projects: many(projects),
  sentInvites: many(teamInvites, { relationName: "inviteSender" }),
  receivedInvites: many(teamInvites, { relationName: "inviteRecipient" }),
  projectMemberships: many(projectMembers),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  eventRegistrations: many(eventRegistrations),
  eventProjects: many(eventProjects),
}));

export const eventRegistrationsRelations = relations(
  eventRegistrations,
  ({ one }) => ({
    event: one(events, {
      fields: [eventRegistrations.eventId],
      references: [events.id],
    }),
    profile: one(profiles, {
      fields: [eventRegistrations.profileId],
      references: [profiles.id],
    }),
  })
);

export const projectsRelations = relations(projects, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [projects.profileId],
    references: [profiles.id],
  }),
  eventProjects: many(eventProjects),
  members: many(projectMembers),
  invites: many(teamInvites),
}));

export const eventProjectsRelations = relations(eventProjects, ({ one }) => ({
  event: one(events, {
    fields: [eventProjects.eventId],
    references: [events.id],
  }),
  project: one(projects, {
    fields: [eventProjects.projectId],
    references: [projects.id],
  }),
}));

export const teamInvitesRelations = relations(teamInvites, ({ one }) => ({
  project: one(projects, {
    fields: [teamInvites.projectId],
    references: [projects.id],
  }),
  sender: one(profiles, {
    fields: [teamInvites.senderId],
    references: [profiles.id],
    relationName: "inviteSender",
  }),
  recipient: one(profiles, {
    fields: [teamInvites.recipientId],
    references: [profiles.id],
    relationName: "inviteRecipient",
  }),
}));

export const projectMembersRelations = relations(
  projectMembers,
  ({ one }) => ({
    project: one(projects, {
      fields: [projectMembers.projectId],
      references: [projects.id],
    }),
    profile: one(profiles, {
      fields: [projectMembers.profileId],
      references: [profiles.id],
    }),
    invite: one(teamInvites, {
      fields: [projectMembers.inviteId],
      references: [teamInvites.id],
    }),
  })
);

// --- Admin Audit Log ---

export const adminAuditLog = pgTable("admin_audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorProfileId: uuid("actor_profile_id")
    .notNull()
    .references(() => profiles.id),
  action: text("action").notNull(),
  targetProfileId: uuid("target_profile_id").references(() => profiles.id),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditLogEntry = typeof adminAuditLog.$inferInsert;

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  actor: one(profiles, {
    fields: [adminAuditLog.actorProfileId],
    references: [profiles.id],
    relationName: "auditActor",
  }),
  target: one(profiles, {
    fields: [adminAuditLog.targetProfileId],
    references: [profiles.id],
    relationName: "auditTarget",
  }),
}));

// --- Mentor Applications ---

export const mentorApplicationStatusEnum = pgEnum(
  "mentor_application_status",
  ["pending", "approved", "declined"]
);

export const mentorApplications = pgTable("mentor_applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  discordHandle: text("discord_handle").notNull(),
  twitterHandle: text("twitter_handle"),
  websiteUrl: text("website_url"),
  githubHandle: text("github_handle"),
  mentorTypes: text("mentor_types")
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  background: text("background").notNull(),
  availability: text("availability").notNull(),
  status: mentorApplicationStatusEnum("status").default("pending").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type MentorApplication = typeof mentorApplications.$inferSelect;
export type NewMentorApplication = typeof mentorApplications.$inferInsert;

export const mentorApplicationsRelations = relations(
  mentorApplications,
  ({ one }) => ({
    reviewer: one(profiles, {
      fields: [mentorApplications.reviewedBy],
      references: [profiles.id],
    }),
  })
);

// --- Sponsorship Inquiries ---

export const sponsorshipInquiryStatusEnum = pgEnum(
  "sponsorship_inquiry_status",
  ["pending", "contacted", "accepted", "declined"]
);

export const sponsorshipInquiries = pgTable("sponsorship_inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyName: text("company_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull().unique(),
  websiteUrl: text("website_url"),
  offerDescription: text("offer_description").notNull(),
  additionalNotes: text("additional_notes"),
  status: sponsorshipInquiryStatusEnum("status").default("pending").notNull(),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});

export type SponsorshipInquiry = typeof sponsorshipInquiries.$inferSelect;
export type NewSponsorshipInquiry = typeof sponsorshipInquiries.$inferInsert;

export const sponsorshipInquiriesRelations = relations(
  sponsorshipInquiries,
  ({ one }) => ({
    reviewer: one(profiles, {
      fields: [sponsorshipInquiries.reviewedBy],
      references: [profiles.id],
    }),
  })
);
