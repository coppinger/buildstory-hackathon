import type { MetadataRoute } from "next";

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

    const projectRoutes: MetadataRoute.Sitemap = [];
    let projectPage = 1;
    let projectTotalPages = 1;
    do {
      const result = await getHackathonProjects({ page: projectPage, pageSize: 500 });
      if (!("items" in result)) break;
      for (const p of result.items) {
        if (p.slug) {
          projectRoutes.push({
            url: `${base}/projects/${p.slug}`,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
      projectTotalPages = result.totalPages;
      projectPage++;
    } while (projectPage <= projectTotalPages);

    const profileRoutes: MetadataRoute.Sitemap = [];
    let profilePage = 1;
    let profileTotalPages = 1;
    do {
      const result = await getHackathonProfiles({ page: profilePage, pageSize: 500 });
      if (!("items" in result)) break;
      for (const e of result.items) {
        if (e.profile.username) {
          profileRoutes.push({
            url: `${base}/members/${e.profile.username}`,
            changeFrequency: "weekly",
            priority: 0.6,
          });
        }
      }
      profileTotalPages = result.totalPages;
      profilePage++;
    } while (profilePage <= profileTotalPages);

    return [...staticRoutes, ...projectRoutes, ...profileRoutes];
  } catch (error) {
    console.error("Sitemap generation failed, returning static routes only:", error);
    return staticRoutes;
  }
}
