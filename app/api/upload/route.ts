import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { ensureProfile } from "@/lib/db/ensure-profile";
import { createPresignedUploadUrl, isAllowedContentType, isValidPrefix } from "@/lib/r2";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await ensureProfile(userId);
    if (!profile) {
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    if (!process.env.R2_ACCOUNT_ID) {
      return NextResponse.json(
        { error: "File uploads are not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { contentType, prefix } = body as { contentType?: string; prefix?: string };

    if (!contentType || !isAllowedContentType(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Supported: JPEG, PNG, GIF, WebP, MP4, WebM, MOV" },
        { status: 400 }
      );
    }

    if (prefix && !isValidPrefix(prefix)) {
      return NextResponse.json(
        { error: "Invalid upload prefix" },
        { status: 400 }
      );
    }

    const { uploadUrl, publicUrl } = await createPresignedUploadUrl({
      profileId: profile.id,
      contentType,
      prefix: prefix ?? "submissions",
    });

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    Sentry.captureException(error, {
      tags: { component: "api", action: "upload" },
    });
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
