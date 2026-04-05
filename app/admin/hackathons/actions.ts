"use server";

import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import * as Sentry from "@sentry/nextjs";
import { db } from "@/lib/db";
import {
  events,
  eventRegistrations,
  profiles,
  adminAuditLog,
} from "@/lib/db/schema";
import { isAdmin } from "@/lib/admin";
import { z } from "zod";

type ActionResult = { success: true } | { success: false; error: string };

const eventSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(100)
    .regex(/^[a-z0-9]+(?:[-][a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
  description: z.string().min(1, "Description is required").max(1000),
  startsAt: z.string().min(1, "Start date is required"),
  endsAt: z.string().min(1, "End date is required"),
});

async function getActorProfile(clerkUserId: string) {
  return db.query.profiles.findFirst({
    where: eq(profiles.clerkId, clerkUserId),
    columns: { id: true },
  });
}

// --- Allowed state transitions ---
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  draft: ["open"],
  open: ["active", "draft"],
  active: ["judging", "open"],
  judging: ["complete", "active"],
  complete: ["judging"],
};

export async function createEvent(formData: {
  name: string;
  slug: string;
  description: string;
  startsAt: string;
  endsAt: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = eventSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { name, slug, description, startsAt, endsAt } = parsed.data;

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db.insert(events).values({
      name,
      slug,
      description,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      status: "draft",
    });

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "create_event",
      metadata: JSON.stringify({ name, slug }),
    });

    revalidatePath("/admin/hackathons");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "createEvent" },
    });
    return { success: false, error: "Failed to create event" };
  }
}

export async function updateEvent(data: {
  eventId: string;
  name: string;
  slug: string;
  description: string;
  startsAt: string;
  endsAt: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    const { name, slug, description, startsAt, endsAt } = parsed.data;

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(events)
      .set({
        name,
        slug,
        description,
        startsAt: new Date(startsAt),
        endsAt: new Date(endsAt),
        updatedAt: new Date(),
      })
      .where(eq(events.id, data.eventId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "update_event",
      metadata: JSON.stringify({ eventId: data.eventId, name, slug }),
    });

    revalidatePath("/admin/hackathons");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "updateEvent" },
    });
    return { success: false, error: "Failed to update event" };
  }
}

export async function transitionEventStatus(data: {
  eventId: string;
  newStatus: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, data.eventId),
    });
    if (!event) return { success: false, error: "Event not found" };

    const allowed = ALLOWED_TRANSITIONS[event.status];
    if (!allowed?.includes(data.newStatus)) {
      return {
        success: false,
        error: `Cannot transition from "${event.status}" to "${data.newStatus}"`,
      };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db
      .update(events)
      .set({
        status: data.newStatus as typeof event.status,
        updatedAt: new Date(),
      })
      .where(eq(events.id, data.eventId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "transition_event_status",
      metadata: JSON.stringify({
        eventId: data.eventId,
        from: event.status,
        to: data.newStatus,
      }),
    });

    revalidatePath("/admin/hackathons");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "transitionEventStatus" },
    });
    return { success: false, error: "Failed to transition event status" };
  }
}

export async function setFeaturedEvent(data: {
  eventId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db.transaction(async (tx) => {
      // Clear featured from all events
      await tx.update(events).set({ featured: false });
      // Set featured on target
      await tx
        .update(events)
        .set({ featured: true, updatedAt: new Date() })
        .where(eq(events.id, data.eventId));
    });

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "set_featured_event",
      metadata: JSON.stringify({ eventId: data.eventId }),
    });

    revalidatePath("/admin/hackathons");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "setFeaturedEvent" },
    });
    return { success: false, error: "Failed to set featured event" };
  }
}

export async function deleteEvent(data: {
  eventId: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) {
      return { success: false, error: "Unauthorized" };
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, data.eventId),
    });
    if (!event) return { success: false, error: "Event not found" };
    if (event.featured) {
      return { success: false, error: "Cannot delete the featured event" };
    }

    // Check for linked data
    const hasRegistrations = await db.query.eventRegistrations.findFirst({
      where: eq(eventRegistrations.eventId, data.eventId),
    });
    if (hasRegistrations) {
      return {
        success: false,
        error: "Cannot delete an event with registrations",
      };
    }

    const actor = await getActorProfile(userId);
    if (!actor) return { success: false, error: "Actor profile not found" };

    await db.delete(events).where(eq(events.id, data.eventId));

    await db.insert(adminAuditLog).values({
      actorProfileId: actor.id,
      action: "delete_event",
      metadata: JSON.stringify({ eventId: data.eventId, name: event.name }),
    });

    revalidatePath("/admin/hackathons");
    return { success: true };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "server-action", action: "deleteEvent" },
    });
    return { success: false, error: "Failed to delete event" };
  }
}
