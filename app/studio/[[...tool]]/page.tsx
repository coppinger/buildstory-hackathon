"use client";

import { NextStudio } from "next-sanity/studio";
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "@/lib/sanity/schemas";
import { sanityConfig } from "@/lib/sanity/config";

const config = defineConfig({
  basePath: "/studio",
  projectId: sanityConfig.projectId,
  dataset: sanityConfig.dataset,
  schema: {
    types: schemaTypes,
  },
  plugins: [structureTool(), visionTool()],
});

export default function StudioPage() {
  return <NextStudio config={config} />;
}
