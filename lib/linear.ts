import "server-only";

import * as Sentry from "@sentry/nextjs";

interface CreateIssueInput {
  title: string;
  description: string;
}

interface CreateRoadmapIssueInput {
  title: string;
  description: string | null;
  authorName: string;
  slug: string;
  upvoteCount: number;
  commentCount: number;
}

type LinearIssueResult =
  | { success: true; issueId: string; issueUrl: string }
  | { success: false; error: string };

export async function createLinearIssue({ title, description }: CreateIssueInput): Promise<LinearIssueResult> {
  const apiKey = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  const projectId = process.env.LINEAR_PROJECT_ID;
  const labelId = process.env.LINEAR_LABEL_ID;

  if (!apiKey || !teamId) {
    return { success: false, error: "Linear integration is not configured" };
  }

  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  const input: Record<string, unknown> = {
    teamId,
    title,
    description,
  };

  if (projectId) {
    input.projectId = projectId;
  }

  if (labelId) {
    input.labelIds = [labelId];
  }

  try {
    const response = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: apiKey,
      },
      body: JSON.stringify({ query: mutation, variables: { input } }),
    });

    if (!response.ok) {
      throw new Error(`Linear API returned ${response.status}`);
    }

    const data = await response.json();

    if (data.errors) {
      throw new Error(data.errors[0]?.message ?? "Unknown Linear API error");
    }

    if (!data.data?.issueCreate?.success) {
      throw new Error("Linear issue creation failed");
    }

    return {
      success: true,
      issueId: data.data.issueCreate.issue.id,
      issueUrl: data.data.issueCreate.issue.url,
    };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "linear", action: "createIssue" },
    });
    return { success: false, error: "Failed to submit to Linear" };
  }
}

export async function createLinearIssueFromRoadmapItem({
  title,
  description,
  authorName,
  slug,
  upvoteCount,
  commentCount,
}: CreateRoadmapIssueInput): Promise<LinearIssueResult> {
  const parts: string[] = [];

  if (description) {
    parts.push(description);
  }

  parts.push("---");
  parts.push(`**Suggested by:** ${authorName}`);
  parts.push(`**Upvotes:** ${upvoteCount}`);
  parts.push(`**Comments:** ${commentCount}`);
  parts.push(`**View on Buildstory:** https://buildstory.ai/roadmap/${slug}`);

  const fullDescription = parts.join("\n");

  return createLinearIssue({ title, description: fullDescription });
}

// ---------------------------------------------------------------------------
// Status Mapping (Linear → Feature Board)
// ---------------------------------------------------------------------------

/**
 * Maps a Linear workflow state name to a feature board status.
 * Returns null if no mapping exists (unknown state — caller should skip update).
 */
export function mapLinearStateToStatus(
  stateName: string
): "exploring" | "next" | "now" | "shipped" | "closed" | null {
  switch (stateName.toLowerCase()) {
    case "backlog":
    case "triage":
      return "exploring";
    case "todo":
    case "planned":
      return "next";
    case "in progress":
    case "started":
      return "now";
    case "done":
    case "completed":
      return "shipped";
    case "canceled":
    case "cancelled":
      return "closed";
    default:
      return null;
  }
}
