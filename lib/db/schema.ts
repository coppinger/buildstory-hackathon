import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
  uniqueIndex,
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

export const featureBoardStatusEnum = pgEnum("feature_board_status", [
  "inbox",
  "exploring",
  "next",
  "now",
  "shipped",
  "closed",
  "archived",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "team_invite",
  "mention",
  "item_shipped",
  "comment_reply",
]);

export const highlightCategoryEnum = pgEnum("highlight_category", [
  "creativity",
  "business_case",
  "technical_challenge",
  "impact",
  "design",
]);

export const postContextTypeEnum = pgEnum("post_context_type", [
  "project",
  "tool",
]);

export const postSourceEnum = pgEnum("post_source", [
  "manual",
  "cli",
  "webhook",
]);

export const reactionTargetTypeEnum = pgEnum("reaction_target_type", [
  "post",
  "comment",
]);

export const reactionEmojiEnum = pgEnum("reaction_emoji", [
  "fire",
  "rocket",
  "lightbulb",
  "clap",
  "wrench",
]);

// --- Profiles ---

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").unique().notNull(),
  username: text("username").unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
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
  discordCardDismissed: boolean("discord_card_dismissed").default(false).notNull(),
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
  reviewOpensAt: timestamp("review_opens_at"),
  reviewClosesAt: timestamp("review_closes_at"),
  status: eventStatusEnum("status").notNull(),
  featured: boolean("featured").default(false).notNull(),
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
  notifications: many(notifications, { relationName: "notificationRecipient" }),
  featureBoardItems: many(featureBoardItems),
  featureBoardUpvotes: many(featureBoardUpvotes),
  featureBoardComments: many(featureBoardComments),
  eventSubmissions: many(eventSubmissions),
  hackathonReviews: many(hackathonReviews),
  posts: many(posts),
  postComments: many(postComments),
  reactions: many(reactions),
}));

export const eventsRelations = relations(events, ({ many }) => ({
  eventRegistrations: many(eventRegistrations),
  eventProjects: many(eventProjects),
  eventSubmissions: many(eventSubmissions),
  hackathonReviews: many(hackathonReviews),
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
  eventSubmissions: many(eventSubmissions),
  hackathonReviews: many(hackathonReviews),
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

// --- Twitch Categories ---

export const twitchCategories = pgTable("twitch_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  twitchId: text("twitch_id").notNull().unique(),
  name: text("name").notNull(),
  boxArtUrl: text("box_art_url"),
  addedBy: uuid("added_by")
    .notNull()
    .references(() => profiles.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TwitchCategory = typeof twitchCategories.$inferSelect;
export type NewTwitchCategory = typeof twitchCategories.$inferInsert;

export const twitchCategoriesRelations = relations(
  twitchCategories,
  ({ one }) => ({
    addedByProfile: one(profiles, {
      fields: [twitchCategories.addedBy],
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

// --- Prize Draws ---

export const prizeDraws = pgTable("prize_draws", {
  id: uuid("id").primaryKey().defaultRandom(),
  seed: text("seed").notNull(),
  winners: jsonb("winners").notNull(),
  winnerCount: integer("winner_count").notNull(),
  totalEligible: integer("total_eligible").notNull(),
  algorithm: text("algorithm").notNull(),
  drawnBy: uuid("drawn_by")
    .notNull()
    .references(() => profiles.id),
  drawnAt: timestamp("drawn_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PrizeDraw = typeof prizeDraws.$inferSelect;
export type NewPrizeDraw = typeof prizeDraws.$inferInsert;

export const prizeDrawsRelations = relations(prizeDraws, ({ one }) => ({
  actor: one(profiles, {
    fields: [prizeDraws.drawnBy],
    references: [profiles.id],
  }),
}));

// --- Notifications ---

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    type: notificationTypeEnum("type").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    href: text("href"),
    isRead: boolean("is_read").default(false).notNull(),
    actorProfileId: uuid("actor_profile_id").references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("idx_notifications_profile_read").on(t.profileId, t.isRead),
    index("idx_notifications_profile_created").on(t.profileId, t.createdAt),
  ]
);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export const notificationsRelations = relations(notifications, ({ one }) => ({
  profile: one(profiles, {
    fields: [notifications.profileId],
    references: [profiles.id],
    relationName: "notificationRecipient",
  }),
  actor: one(profiles, {
    fields: [notifications.actorProfileId],
    references: [profiles.id],
    relationName: "notificationActor",
  }),
}));

// --- Feature Board ---

export const featureBoardCategories = pgTable("feature_board_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  color: text("color").notNull(),
  sortOrder: integer("sort_order").default(0).notNull(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "cascade",
  }),
});

export type FeatureBoardCategory = typeof featureBoardCategories.$inferSelect;
export type NewFeatureBoardCategory = typeof featureBoardCategories.$inferInsert;

export const featureBoardItems = pgTable(
  "feature_board_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug"),
    description: text("description"),
    status: featureBoardStatusEnum("status").default("inbox").notNull(),
    categoryId: uuid("category_id").references(() => featureBoardCategories.id),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    projectId: uuid("project_id").references(() => projects.id, {
      onDelete: "cascade",
    }),
    // Denormalized counters — maintained via increment/decrement in server actions.
    // If drift is suspected, reconcile with: UPDATE feature_board_items SET
    //   upvote_count = (SELECT COUNT(*) FROM feature_board_upvotes WHERE item_id = feature_board_items.id),
    //   comment_count = (SELECT COUNT(*) FROM feature_board_comments WHERE item_id = feature_board_items.id AND deleted_at IS NULL);
    upvoteCount: integer("upvote_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    linearIssueId: text("linear_issue_id"),
    linearIssueUrl: text("linear_issue_url"),
    imageUrl: text("image_url"),
    internalNotes: text("internal_notes"),
    shippedAt: timestamp("shipped_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_feature_board_items_status").on(t.status),
    index("idx_feature_board_items_author").on(t.authorId),
    index("idx_feature_board_items_project").on(t.projectId),
    index("idx_feature_board_items_category").on(t.categoryId),
    // Slug uniqueness scoped to project: platform items (NULL) and per-project items
    uniqueIndex("idx_feature_board_items_platform_slug")
      .on(t.slug)
      .where(sql`${t.projectId} IS NULL`),
    uniqueIndex("idx_feature_board_items_project_slug")
      .on(t.projectId, t.slug)
      .where(sql`${t.projectId} IS NOT NULL`),
  ]
);

export type FeatureBoardItem = typeof featureBoardItems.$inferSelect;
export type NewFeatureBoardItem = typeof featureBoardItems.$inferInsert;

export const featureBoardUpvotes = pgTable(
  "feature_board_upvotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => featureBoardItems.id, { onDelete: "cascade" }),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique().on(t.itemId, t.profileId),
    index("idx_feature_board_upvotes_item").on(t.itemId),
    index("idx_feature_board_upvotes_profile").on(t.profileId),
  ]
);

export type FeatureBoardUpvote = typeof featureBoardUpvotes.$inferSelect;
export type NewFeatureBoardUpvote = typeof featureBoardUpvotes.$inferInsert;

export const featureBoardComments = pgTable(
  "feature_board_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => featureBoardItems.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    body: text("body").notNull(),
    parentCommentId: uuid("parent_comment_id"),
    isEdited: boolean("is_edited").default(false).notNull(),
    deletedAt: timestamp("deleted_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_feature_board_comments_item").on(t.itemId),
    index("idx_feature_board_comments_author").on(t.authorId),
  ]
);

export type FeatureBoardComment = typeof featureBoardComments.$inferSelect;
export type NewFeatureBoardComment = typeof featureBoardComments.$inferInsert;

// --- AI Tools ---

export const aiTools = pgTable("ai_tools", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  category: text("category").notNull(),
  description: text("description"),
  iconUrl: text("icon_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type AiTool = typeof aiTools.$inferSelect;
export type NewAiTool = typeof aiTools.$inferInsert;

// --- Event Submissions ---

export const eventSubmissions = pgTable(
  "event_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    whatBuilt: text("what_built").notNull(),
    demoUrl: text("demo_url"),
    demoMediaUrl: text("demo_media_url"),
    demoMediaType: text("demo_media_type"),
    repoUrl: text("repo_url"),
    lessonLearned: text("lesson_learned"),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique().on(t.eventId, t.projectId),
    index("idx_event_submissions_event").on(t.eventId),
    index("idx_event_submissions_profile").on(t.profileId),
  ]
);

export type EventSubmission = typeof eventSubmissions.$inferSelect;
export type NewEventSubmission = typeof eventSubmissions.$inferInsert;

// --- Event Submission Tools (junction) ---

export const eventSubmissionTools = pgTable(
  "event_submission_tools",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => eventSubmissions.id, { onDelete: "cascade" }),
    toolId: uuid("tool_id")
      .notNull()
      .references(() => aiTools.id),
  },
  (t) => [
    unique().on(t.submissionId, t.toolId),
    index("idx_event_submission_tools_submission").on(t.submissionId),
  ]
);

export type EventSubmissionTool = typeof eventSubmissionTools.$inferSelect;
export type NewEventSubmissionTool = typeof eventSubmissionTools.$inferInsert;

// --- Hackathon Reviews ---

export const hackathonReviews = pgTable(
  "hackathon_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id),
    reviewerProfileId: uuid("reviewer_profile_id")
      .notNull()
      .references(() => profiles.id),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id),
    feedback: text("feedback").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    unique().on(t.reviewerProfileId, t.projectId, t.eventId),
    index("idx_hackathon_reviews_event").on(t.eventId),
    index("idx_hackathon_reviews_project").on(t.projectId),
    index("idx_hackathon_reviews_reviewer").on(t.reviewerProfileId),
  ]
);

export type HackathonReview = typeof hackathonReviews.$inferSelect;
export type NewHackathonReview = typeof hackathonReviews.$inferInsert;

export const hackathonReviewHighlights = pgTable(
  "hackathon_review_highlights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reviewId: uuid("review_id")
      .notNull()
      .references(() => hackathonReviews.id, { onDelete: "cascade" }),
    category: highlightCategoryEnum("category").notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique().on(t.reviewId, t.category),
    index("idx_hackathon_review_highlights_review").on(t.reviewId),
  ]
);

export type HackathonReviewHighlight =
  typeof hackathonReviewHighlights.$inferSelect;
export type NewHackathonReviewHighlight =
  typeof hackathonReviewHighlights.$inferInsert;

// --- Posts ---

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    body: text("body").notNull(),
    imageUrl: text("image_url"),
    linkUrl: text("link_url"),
    contextType: postContextTypeEnum("context_type").notNull(),
    contextId: uuid("context_id").notNull(),
    source: postSourceEnum("source").default("manual").notNull(),
    reactionCount: integer("reaction_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_posts_context").on(t.contextType, t.contextId),
    index("idx_posts_author").on(t.authorId),
    index("idx_posts_created").on(t.createdAt),
  ]
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

// --- Post Comments ---

export const postComments = pgTable(
  "post_comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    authorId: uuid("author_id")
      .notNull()
      .references(() => profiles.id),
    body: text("body").notNull(),
    parentCommentId: uuid("parent_comment_id"),
    reactionCount: integer("reaction_count").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("idx_post_comments_post").on(t.postId),
    index("idx_post_comments_author").on(t.authorId),
    index("idx_post_comments_parent").on(t.parentCommentId),
  ]
);

export type PostComment = typeof postComments.$inferSelect;
export type NewPostComment = typeof postComments.$inferInsert;

// --- Reactions ---

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profiles.id),
    targetType: reactionTargetTypeEnum("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    emoji: reactionEmojiEnum("emoji").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique().on(t.targetType, t.targetId, t.profileId, t.emoji),
    index("idx_reactions_target").on(t.targetType, t.targetId),
    index("idx_reactions_profile").on(t.profileId),
  ]
);

export type Reaction = typeof reactions.$inferSelect;
export type NewReaction = typeof reactions.$inferInsert;

// --- Hackathon Reviews Relations ---

export const hackathonReviewsRelations = relations(
  hackathonReviews,
  ({ one, many }) => ({
    event: one(events, {
      fields: [hackathonReviews.eventId],
      references: [events.id],
    }),
    reviewer: one(profiles, {
      fields: [hackathonReviews.reviewerProfileId],
      references: [profiles.id],
    }),
    project: one(projects, {
      fields: [hackathonReviews.projectId],
      references: [projects.id],
    }),
    highlights: many(hackathonReviewHighlights),
  })
);

export const hackathonReviewHighlightsRelations = relations(
  hackathonReviewHighlights,
  ({ one }) => ({
    review: one(hackathonReviews, {
      fields: [hackathonReviewHighlights.reviewId],
      references: [hackathonReviews.id],
    }),
  })
);

// --- Posts Relations ---

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(profiles, {
    fields: [posts.authorId],
    references: [profiles.id],
  }),
  comments: many(postComments),
}));

export const postCommentsRelations = relations(
  postComments,
  ({ one, many }) => ({
    post: one(posts, {
      fields: [postComments.postId],
      references: [posts.id],
    }),
    author: one(profiles, {
      fields: [postComments.authorId],
      references: [profiles.id],
    }),
    parent: one(postComments, {
      fields: [postComments.parentCommentId],
      references: [postComments.id],
      relationName: "postCommentThread",
    }),
    replies: many(postComments, { relationName: "postCommentThread" }),
  })
);

export const reactionsRelations = relations(reactions, ({ one }) => ({
  profile: one(profiles, {
    fields: [reactions.profileId],
    references: [profiles.id],
  }),
}));

// --- AI Tools Relations ---

export const aiToolsRelations = relations(aiTools, ({ many }) => ({
  submissionTools: many(eventSubmissionTools),
}));

// --- Event Submissions Relations ---

export const eventSubmissionsRelations = relations(
  eventSubmissions,
  ({ one, many }) => ({
    event: one(events, {
      fields: [eventSubmissions.eventId],
      references: [events.id],
    }),
    project: one(projects, {
      fields: [eventSubmissions.projectId],
      references: [projects.id],
    }),
    profile: one(profiles, {
      fields: [eventSubmissions.profileId],
      references: [profiles.id],
    }),
    tools: many(eventSubmissionTools),
  })
);

export const eventSubmissionToolsRelations = relations(
  eventSubmissionTools,
  ({ one }) => ({
    submission: one(eventSubmissions, {
      fields: [eventSubmissionTools.submissionId],
      references: [eventSubmissions.id],
    }),
    tool: one(aiTools, {
      fields: [eventSubmissionTools.toolId],
      references: [aiTools.id],
    }),
  })
);

export const featureBoardCategoriesRelations = relations(
  featureBoardCategories,
  ({ many }) => ({
    items: many(featureBoardItems),
  })
);

export const featureBoardItemsRelations = relations(
  featureBoardItems,
  ({ one, many }) => ({
    category: one(featureBoardCategories, {
      fields: [featureBoardItems.categoryId],
      references: [featureBoardCategories.id],
    }),
    author: one(profiles, {
      fields: [featureBoardItems.authorId],
      references: [profiles.id],
    }),
    upvotes: many(featureBoardUpvotes),
    comments: many(featureBoardComments),
  })
);

export const featureBoardUpvotesRelations = relations(
  featureBoardUpvotes,
  ({ one }) => ({
    item: one(featureBoardItems, {
      fields: [featureBoardUpvotes.itemId],
      references: [featureBoardItems.id],
    }),
    profile: one(profiles, {
      fields: [featureBoardUpvotes.profileId],
      references: [profiles.id],
    }),
  })
);

export const featureBoardCommentsRelations = relations(
  featureBoardComments,
  ({ one, many }) => ({
    item: one(featureBoardItems, {
      fields: [featureBoardComments.itemId],
      references: [featureBoardItems.id],
    }),
    author: one(profiles, {
      fields: [featureBoardComments.authorId],
      references: [profiles.id],
    }),
    parent: one(featureBoardComments, {
      fields: [featureBoardComments.parentCommentId],
      references: [featureBoardComments.id],
      relationName: "commentThread",
    }),
    replies: many(featureBoardComments, { relationName: "commentThread" }),
  })
);
