import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as Sentry from "@sentry/nextjs";
import { getSubmissionByProjectSlug } from "@/lib/queries";

const fontsDir = join(process.cwd(), "lib/og/fonts");

let fontsCachePromise: Promise<{
  dmSans: Buffer;
  instrumentSerif: Buffer;
  dmMono: Buffer;
}> | null = null;

function loadFonts() {
  if (!fontsCachePromise) {
    fontsCachePromise = Promise.all([
      readFile(join(fontsDir, "DMSans-Regular.ttf")),
      readFile(join(fontsDir, "InstrumentSerif-Regular.ttf")),
      readFile(join(fontsDir, "DMMono-Regular.ttf")),
    ]).then(([dmSans, instrumentSerif, dmMono]) => ({
      dmSans,
      instrumentSerif,
      dmMono,
    }));
  }
  return fontsCachePromise;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return new Response("Missing slug", { status: 400 });
  }

  const data = await getSubmissionByProjectSlug(slug);
  if (!data) {
    return new Response("Submission not found", { status: 404 });
  }

  const { dmSans, instrumentSerif, dmMono } = await loadFonts();

  const { projectName, whatBuilt, lessonLearned, tools, country, region } =
    data;

  // Build location string
  let locationText: string | null = null;
  if (country) {
    locationText = region
      ? `Built from ${region}, ${country}`
      : `Built from ${country}`;
  }

  // Limit tools to 5
  const displayTools = tools.slice(0, 5);

  try {
    return new ImageResponse(
      (
        <div
          style={{
            width: 1200,
            height: 675,
            display: "flex",
            padding: 40,
            background: "linear-gradient(135deg, #ff980a 0%, #ff7a00 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              background: "#0e0d0c",
              padding: "48px 56px",
            }}
          >
            {/* Top label */}
            <div
              style={{
                fontFamily: "DM Mono",
                fontSize: 13,
                color: "#6b6560",
                letterSpacing: "0.15em",
              }}
            >
              HACKATHON 00 · MAR 1-8, 2026
            </div>

            {/* Project name */}
            <div
              style={{
                fontFamily: "Instrument Serif",
                fontSize: 42,
                color: "#e8e4de",
                marginTop: 20,
                lineHeight: 1.15,
                maxHeight: 100,
                overflow: "hidden",
              }}
            >
              {projectName}
            </div>

            {/* What I built */}
            <div
              style={{
                fontFamily: "DM Sans",
                fontSize: 18,
                color: "#a09890",
                marginTop: 16,
                lineHeight: 1.5,
                maxHeight: 110,
                overflow: "hidden",
              }}
            >
              {whatBuilt}
            </div>

            {/* Tools pills */}
            {displayTools.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginTop: 20,
                }}
              >
                {displayTools.map((tool) => (
                  <div
                    key={tool}
                    style={{
                      fontFamily: "DM Mono",
                      fontSize: 12,
                      color: "#ff980a",
                      background: "rgba(255, 152, 10, 0.1)",
                      padding: "6px 14px",
                      borderRadius: 4,
                      letterSpacing: "0.05em",
                    }}
                  >
                    {tool}
                  </div>
                ))}
              </div>
            )}

            {/* Spacer to push bottom content down */}
            <div style={{ display: "flex", flexGrow: 1 }} />

            {/* Lesson learned section */}
            {lessonLearned && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  paddingTop: 20,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: 1,
                    background: "#1f1d1b",
                    marginBottom: 16,
                  }}
                />
                <div
                  style={{
                    fontFamily: "DM Mono",
                    fontSize: 11,
                    color: "#6b6560",
                    letterSpacing: "0.15em",
                    marginBottom: 8,
                  }}
                >
                  SOMETHING I LEARNED
                </div>
                <div
                  style={{
                    fontFamily: "DM Sans",
                    fontSize: 15,
                    color: "#a09890",
                    fontStyle: "italic",
                    lineHeight: 1.5,
                    maxHeight: 70,
                    overflow: "hidden",
                  }}
                >
                  {`\u201C${lessonLearned}\u201D`}
                </div>
              </div>
            )}

            {/* Bottom bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingTop: 20,
              }}
            >
              {locationText ? (
                <div
                  style={{
                    fontFamily: "DM Mono",
                    fontSize: 12,
                    color: "#6b6560",
                  }}
                >
                  {locationText}
                </div>
              ) : (
                <div />
              )}
              <div
                style={{
                  fontFamily: "DM Mono",
                  fontSize: 13,
                  color: "#ff980a",
                  letterSpacing: "0.05em",
                }}
              >
                buildstory.ai
              </div>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 675,
        fonts: [
          {
            name: "DM Sans",
            data: dmSans,
            style: "normal" as const,
            weight: 400 as const,
          },
          {
            name: "Instrument Serif",
            data: instrumentSerif,
            style: "normal" as const,
            weight: 400 as const,
          },
          {
            name: "DM Mono",
            data: dmMono,
            style: "normal" as const,
            weight: 400 as const,
          },
        ],
        headers: {
          "Cache-Control": "public, max-age=86400",
        },
      }
    );
  } catch (err) {
    Sentry.captureException(err, {
      tags: { component: "api-route", action: "og-submission" },
      extra: { slug },
    });
    return new Response("Failed to generate image", { status: 500 });
  }
}
