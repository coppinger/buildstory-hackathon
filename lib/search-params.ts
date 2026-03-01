import { createLoader, parseAsInteger } from "nuqs/server";

export const DEFAULT_PAGE_SIZE = 18;

export const paginationParsers = {
  page: parseAsInteger.withDefault(1),
};

export const loadPaginationParams = createLoader(paginationParsers);
