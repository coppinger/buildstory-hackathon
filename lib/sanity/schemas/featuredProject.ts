import { defineField, defineType } from "sanity";

export const featuredProject = defineType({
  name: "featuredProject",
  title: "Featured Project",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Project Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "builderName",
      title: "Builder Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "blurb",
      title: "Blurb",
      type: "text",
      rows: 2,
      description: "One-sentence description (max 140 chars).",
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: "image",
      title: "Cover Image",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "projectSlug",
      title: "Project Slug",
      type: "string",
      description: "Optional. If set, the card links to /projects/{slug}.",
    }),
    defineField({
      name: "eventSlug",
      title: "Event Slug",
      type: "string",
      description:
        "e.g. hackathon-00. Leave blank for evergreen featuring across all events.",
    }),
    defineField({
      name: "displayOrder",
      title: "Display Order",
      type: "number",
    }),
  ],
  orderings: [
    {
      title: "Display Order",
      name: "displayOrder",
      by: [{ field: "displayOrder", direction: "asc" }],
    },
  ],
});
