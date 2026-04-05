"use client";

import { useState, useTransition } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Icon } from "@/components/ui/icon";
import {
  createEvent,
  updateEvent,
  transitionEventStatus,
  setFeaturedEvent,
  deleteEvent,
} from "./actions";
import { getEventStateLabel, getEventStateBadgeVariant } from "@/lib/events";
import type { EventStatus } from "@/lib/events";

interface SerializedEvent {
  id: string;
  name: string;
  slug: string;
  description: string;
  startsAt: string;
  endsAt: string;
  registrationOpensAt: string | null;
  registrationClosesAt: string | null;
  reviewOpensAt: string | null;
  reviewClosesAt: string | null;
  status: EventStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  registrationCount: number;
  projectCount: number;
  submissionCount: number;
}

const ALLOWED_TRANSITIONS: Record<string, { label: string; status: string }[]> = {
  draft: [{ label: "Open Registration", status: "open" }],
  open: [
    { label: "Start Event", status: "active" },
    { label: "Revert to Draft", status: "draft" },
  ],
  active: [
    { label: "Start Judging", status: "judging" },
    { label: "Revert to Open", status: "open" },
  ],
  judging: [
    { label: "Complete Event", status: "complete" },
    { label: "Revert to Active", status: "active" },
  ],
  complete: [{ label: "Re-open Judging", status: "judging" }],
};

export function AdminHackathonsClient({
  events,
}: {
  events: SerializedEvent[];
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const stats = {
    total: events.length,
    active: events.filter((e) => e.status === "active").length,
    draft: events.filter((e) => e.status === "draft").length,
    complete: events.filter((e) => e.status === "complete").length,
  };

  function handleCreate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createEvent({
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        description: formData.get("description") as string,
        startsAt: formData.get("startsAt") as string,
        endsAt: formData.get("endsAt") as string,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setShowCreate(false);
      }
    });
  }

  function handleUpdate(eventId: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateEvent({
        eventId,
        name: formData.get("name") as string,
        slug: formData.get("slug") as string,
        description: formData.get("description") as string,
        startsAt: formData.get("startsAt") as string,
        endsAt: formData.get("endsAt") as string,
      });
      if (!result.success) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleTransition(eventId: string, newStatus: string) {
    setError(null);
    startTransition(async () => {
      const result = await transitionEventStatus({ eventId, newStatus });
      if (!result.success) setError(result.error);
    });
  }

  function handleSetFeatured(eventId: string) {
    setError(null);
    startTransition(async () => {
      const result = await setFeaturedEvent({ eventId });
      if (!result.success) setError(result.error);
    });
  }

  function handleDelete(eventId: string) {
    if (!confirm("Are you sure you want to delete this event?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteEvent({ eventId });
      if (!result.success) setError(result.error);
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-heading">Hackathons</h1>
        <Button onClick={() => setShowCreate(!showCreate)} disabled={isPending}>
          {showCreate ? "Cancel" : "Create Hackathon"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total },
          { label: "Active", value: stats.active },
          { label: "Drafts", value: stats.draft },
          { label: "Completed", value: stats.complete },
        ].map((stat) => (
          <Card key={stat.label} size="sm">
            <CardContent>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {stat.label}
              </p>
              <p className="text-2xl font-heading mt-1">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="mb-4 p-3 text-sm text-destructive bg-destructive/10 rounded-lg">
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <Card className="mb-6">
          <form action={handleCreate}>
            <CardHeader>
              <CardTitle>New Hackathon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Name</label>
                  <Input name="name" placeholder="Hackathon #02" required />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Slug</label>
                  <Input name="slug" placeholder="hackathon-02" required />
                </div>
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Description</label>
                <Textarea name="description" placeholder="A 7-day building event..." required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">Starts at</label>
                  <Input name="startsAt" type="datetime-local" required />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Ends at</label>
                  <Input name="endsAt" type="datetime-local" required />
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                Create
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* Event list */}
      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id}>
            {editingId === event.id ? (
              <form action={(fd) => handleUpdate(event.id, fd)}>
                <CardHeader>
                  <CardTitle>Edit Hackathon</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Name</label>
                      <Input name="name" defaultValue={event.name} required />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Slug</label>
                      <Input name="slug" defaultValue={event.slug} required />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Description</label>
                    <Textarea
                      name="description"
                      defaultValue={event.description}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Starts at</label>
                      <Input
                        name="startsAt"
                        type="datetime-local"
                        defaultValue={event.startsAt.slice(0, 16)}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Ends at</label>
                      <Input
                        name="endsAt"
                        type="datetime-local"
                        defaultValue={event.endsAt.slice(0, 16)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setEditingId(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    Save
                  </Button>
                </CardFooter>
              </form>
            ) : (
              <>
                <CardHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <CardTitle>{event.name}</CardTitle>
                      <Badge variant={getEventStateBadgeVariant(event.status)}>
                        {getEventStateLabel(event.status)}
                      </Badge>
                      {event.featured && (
                        <Badge variant="default" className="gap-1">
                          <Icon name="star" size="3" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditingId(event.id)}
                        disabled={isPending}
                      >
                        <Icon name="edit" size="4" />
                      </Button>
                      {!event.featured && event.registrationCount === 0 && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(event.id)}
                          disabled={isPending}
                          className="text-destructive hover:text-destructive"
                        >
                          <Icon name="delete" size="4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-6 text-xs text-muted-foreground font-mono">
                    <span>
                      {new Date(event.startsAt).toLocaleDateString()} &ndash;{" "}
                      {new Date(event.endsAt).toLocaleDateString()}
                    </span>
                    <span>{event.registrationCount} registrations</span>
                    <span>{event.projectCount} projects</span>
                    <span>{event.submissionCount} submissions</span>
                    <span className="text-muted-foreground/60">/{event.slug}</span>
                  </div>
                </CardContent>
                <CardFooter className="gap-2 flex-wrap">
                  {/* State transitions */}
                  {ALLOWED_TRANSITIONS[event.status]?.map((t) => (
                    <Button
                      key={t.status}
                      variant={t.status === "draft" || t.status === "open" || t.status === "active" ? "outline" : "secondary"}
                      size="sm"
                      onClick={() => handleTransition(event.id, t.status)}
                      disabled={isPending}
                    >
                      {t.label}
                    </Button>
                  ))}

                  {/* Featured toggle */}
                  {!event.featured && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetFeatured(event.id)}
                      disabled={isPending}
                      className="ml-auto"
                    >
                      <Icon name="star" size="3.5" />
                      Set as Featured
                    </Button>
                  )}
                </CardFooter>
              </>
            )}
          </Card>
        ))}

        {events.length === 0 && (
          <p className="text-center text-muted-foreground py-12">
            No hackathons yet. Create one to get started.
          </p>
        )}
      </div>
    </div>
  );
}
