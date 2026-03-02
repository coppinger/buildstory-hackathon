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
