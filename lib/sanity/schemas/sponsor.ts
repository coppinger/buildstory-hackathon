import { defineField, defineType } from "sanity";

export const sponsor = defineType({
  name: "sponsor",
  title: "Sponsor",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "logo",
      title: "Logo",
      type: "image",
      options: { hotspot: true },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "websiteUrl",
      title: "Website URL",
      type: "url",
    }),
    defineField({
      name: "tier",
      title: "Tier",
      type: "string",
      options: {
        list: [
          { title: "Gold", value: "gold" },
          { title: "Silver", value: "silver" },
          { title: "Bronze", value: "bronze" },
          { title: "Community", value: "community" },
        ],
      },
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
