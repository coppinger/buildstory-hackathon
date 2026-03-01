"use server";

import * as Sentry from "@sentry/nextjs";

interface CreateIssueInput {
  title: string;
  description: string;
}

export async function createLinearIssue({ title, description }: CreateIssueInput): Promise<{ success: true; issueId: string } | { success: false; error: string }> {
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

    return { success: true, issueId: data.data.issueCreate.issue.id };
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "linear", action: "createIssue" },
    });
    return { success: false, error: "Failed to submit to Linear" };
  }
}
