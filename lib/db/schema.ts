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

// --- Profiles ---

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  displayName: text("display_name").notNull(),
  bio: text("bio"),
  websiteUrl: text("website_url"),
  twitterHandle: text("twitter_handle"),
  githubHandle: text("github_handle"),
  twitchUrl: text("twitch_url"),
  streamUrl: text("stream_url"),
  experienceLevel: experienceLevelEnum("experience_level"),
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
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.eventId, t.profileId)]
);

export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;

// --- Relations ---

export const profilesRelations = relations(profiles, ({ many }) => ({
  eventRegistrations: many(eventRegistrations),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  eventRegistrations: many(eventRegistrations),
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
