"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  contactSponsorInquiry,
  acceptSponsorInquiry,
  declineSponsorInquiry,
} from "./actions";

interface SerializedInquiry {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  websiteUrl: string | null;
  offerDescription: string;
  additionalNotes: string | null;
  status: "pending" | "contacted" | "accepted" | "declined";
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface SponsorStats {
  total: number;
  pending: number;
  contacted: number;
  accepted: number;
  declined: number;
}

type TabFilter = "all" | "pending" | "contacted" | "accepted" | "declined";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "contacted":
      return {
        label: "Contacted",
        className: "text-blue-400 bg-blue-400/10",
      };
    case "accepted":
      return {
        label: "Accepted",
        className: "text-green-400 bg-green-400/10",
      };
    case "declined":
      return { label: "Declined", className: "text-red-400 bg-red-400/10" };
    default:
      return {
        label: "Pending",
        className: "text-yellow-400 bg-yellow-400/10",
      };
  }
}

export function AdminSponsorsClient({
  inquiries,
  stats,
}: {
  inquiries: SerializedInquiry[];
  stats: SponsorStats;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TabFilter>("all");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (tab === "all") return inquiries;
    return inquiries.filter((i) => i.status === tab);
  }, [inquiries, tab]);

  const statCards = [
    { label: "Total", value: stats.total, icon: "groups" },
    { label: "Pending", value: stats.pending, icon: "pending" },
    { label: "Contacted", value: stats.contacted, icon: "mail" },
    { label: "Accepted", value: stats.accepted, icon: "check_circle" },
    { label: "Declined", value: stats.declined, icon: "cancel" },
  ];

  const tabs: { key: TabFilter; label: string; count: number }[] = [
    { key: "all", label: "All", count: stats.total },
    { key: "pending", label: "Pending", count: stats.pending },
    { key: "contacted", label: "Contacted", count: stats.contacted },
    { key: "accepted", label: "Accepted", count: stats.accepted },
    { key: "declined", label: "Declined", count: stats.declined },
  ];

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleContact(inquiryId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await contactSponsorInquiry({ inquiryId });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleAccept(inquiryId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await acceptSponsorInquiry({ inquiryId });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleDecline(inquiryId: string) {
    setActionError(null);
    startTransition(async () => {
      const result = await declineSponsorInquiry({ inquiryId });
      if (!result.success) {
        setActionError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl">Sponsorship Inquiries</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage sponsorship inquiries.
        </p>
      </div>

      {actionError && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {actionError}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s) => (
          <Card key={s.label} className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <Icon
                name={s.icon}
                size="5"
                className="text-muted-foreground"
              />
              <span className="text-sm text-muted-foreground">{s.label}</span>
            </div>
            <p className="text-4xl font-mono tabular-nums font-medium">
              {s.value}
            </p>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
              tab === t.key
                ? "bg-foreground text-background font-medium"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            {t.label}
            <span className="ml-1.5 text-xs opacity-60">{t.count}</span>
          </button>
        ))}
      </div>

      {/* Inquiry list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-sm text-muted-foreground">
              No inquiries found.
            </p>
          </Card>
        ) : (
          filtered.map((inq) => {
            const status = getStatusBadge(inq.status);
            const isExpanded = expandedIds.has(inq.id);
            const TRUNCATE_LENGTH = 150;
            const isLong = inq.offerDescription.length > TRUNCATE_LENGTH;

            return (
              <Card key={inq.id} className="p-5 space-y-3">
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="size-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <span className="text-sm font-medium text-muted-foreground">
                        {inq.companyName[0]?.toUpperCase() ?? "?"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {inq.companyName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {inq.contactName} &middot; {inq.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant="outline"
                      className={`text-xs ${status.className}`}
                    >
                      {status.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(inq.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground">
                    <span>Contact: {inq.contactName}</span>
                    <span>Email: {inq.email}</span>
                    {inq.websiteUrl && (
                      <a
                        href={inq.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        Website
                      </a>
                    )}
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Offer
                    </p>
                    <p className="text-foreground break-words">
                      {isLong && !isExpanded
                        ? `${inq.offerDescription.slice(0, TRUNCATE_LENGTH)}...`
                        : inq.offerDescription}
                    </p>
                    {isLong && (
                      <button
                        onClick={() => toggleExpand(inq.id)}
                        className="text-xs text-muted-foreground hover:text-foreground mt-1"
                      >
                        {isExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>

                  {inq.additionalNotes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Notes
                      </p>
                      <p className="text-foreground break-words">{inq.additionalNotes}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {inq.status !== "accepted" && inq.status !== "declined" && (
                  <div className="flex gap-2 pt-1">
                    {inq.status === "pending" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isPending}
                        onClick={() => handleContact(inq.id)}
                      >
                        <Icon name="mail" size="4" />
                        Contact
                      </Button>
                    )}
                    <Button
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleAccept(inq.id)}
                    >
                      <Icon name="check" size="4" />
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDecline(inq.id)}
                    >
                      <Icon name="close" size="4" />
                      Decline
                    </Button>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
