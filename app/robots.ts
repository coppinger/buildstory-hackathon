import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/settings", "/dashboard", "/studio", "/banned", "/invite"],
    },
    sitemap: "https://buildstory.com/sitemap.xml",
  };
}
