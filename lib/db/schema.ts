import { relations } from "drizzle-orm";
import {
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

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

// --- Relations ---

export const profilesRelations = relations(profiles, ({ many }) => ({
  eventRegistrations: many(eventRegistrations),
  projects: many(projects),
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
