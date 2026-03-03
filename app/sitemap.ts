import type { MetadataRoute } from "next";

export const revalidate = 3600;

async function collectAllPages(
  fetcher: (params: { page: number; pageSize: number }) => Promise<{ items: { slug?: string | null; profile?: { username: string | null } }[]; totalPages: number } | unknown>,
  toUrl: (item: Record<string, unknown>) => string | null,
): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];
  let page = 1;
  let totalPages = 1;
  do {
    const result = await fetcher({ page, pageSize: 500 });
    if (
      typeof result !== "object" ||
      result === null ||
      !("items" in result) ||
      !("totalPages" in result)
    ) break;
    const { items, totalPages: tp } = result as { items: Record<string, unknown>[]; totalPages: number };
    for (const item of items) {
      const url = toUrl(item);
      if (url) {
        routes.push({ url, changeFrequency: "weekly", priority: 0.6 });
      }
    }
    totalPages = tp;
    page++;
  } while (page <= totalPages);
  return routes;
}

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

    const [projectRoutes, profileRoutes] = await Promise.all([
      collectAllPages(getHackathonProjects, (p) => {
        const slug = p.slug as string | null;
        return slug ? `${base}/projects/${slug}` : null;
      }),
      collectAllPages(getHackathonProfiles, (e) => {
        const profile = e.profile as { username: string | null } | undefined;
        return profile?.username ? `${base}/members/${profile.username}` : null;
      }),
    ]);

    return [...staticRoutes, ...projectRoutes, ...profileRoutes];
  } catch (error) {
    console.error("Sitemap generation failed, returning static routes only:", error);
    return staticRoutes;
  }
}
