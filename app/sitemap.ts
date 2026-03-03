import type { MetadataRoute } from "next";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://buildstory.com";

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/projects`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/members`, changeFrequency: "daily", priority: 0.8 },
  ];

  try {
    const { getHackathonProjects, getHackathonProfiles } = await import(
      "@/lib/queries"
    );

    const [projectsResult, profilesResult] = await Promise.all([
      getHackathonProjects({ page: 1, pageSize: 1000 }),
      getHackathonProfiles({ page: 1, pageSize: 1000 }),
    ]);

    const projectRoutes: MetadataRoute.Sitemap =
      "items" in projectsResult
        ? projectsResult.items
            .filter((p) => p.slug)
            .map((p) => ({
              url: `${base}/projects/${p.slug}`,
              changeFrequency: "weekly" as const,
              priority: 0.6,
            }))
        : [];

    const profileRoutes: MetadataRoute.Sitemap =
      "items" in profilesResult
        ? profilesResult.items
            .filter((e) => e.profile.username)
            .map((e) => ({
              url: `${base}/members/${e.profile.username}`,
              changeFrequency: "weekly" as const,
              priority: 0.6,
            }))
        : [];

    return [...staticRoutes, ...projectRoutes, ...profileRoutes];
  } catch {
    return staticRoutes;
  }
}
