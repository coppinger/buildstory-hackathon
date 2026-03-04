import { createLoader, parseAsInteger, parseAsString, parseAsStringLiteral } from "nuqs/server";

export const DEFAULT_PAGE_SIZE = 18;

export const sortOrders = ["newest", "oldest"] as const;
export type SortOrder = (typeof sortOrders)[number];

export const paginationParsers = {
  page: parseAsInteger.withDefault(1),
};

export const searchSortParsers = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(sortOrders).withDefault("newest"),
};

export const loadPaginationParams = createLoader(paginationParsers);
export const loadSearchSortParams = createLoader(searchSortParsers);

export const roadmapSortOrders = ["most_upvoted", "newest"] as const;
export type RoadmapSortOrder = (typeof roadmapSortOrders)[number];

export const roadmapViewModes = ["list", "kanban", "contributors"] as const;
export type RoadmapViewMode = (typeof roadmapViewModes)[number];

export const roadmapParsers = {
  page: parseAsInteger.withDefault(1),
  q: parseAsString.withDefault(""),
  sort: parseAsStringLiteral(roadmapSortOrders).withDefault("most_upvoted"),
  status: parseAsString.withDefault("all"),
  view: parseAsStringLiteral(roadmapViewModes).withDefault("list"),
};

export const loadRoadmapParams = createLoader(roadmapParsers);
