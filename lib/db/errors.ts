import { NeonDbError } from "@neondatabase/serverless";

export function isUniqueViolation(
  error: unknown,
  constraintName: string
): boolean {
  const cause =
    error instanceof Error && error.cause instanceof NeonDbError
      ? error.cause
      : error instanceof NeonDbError
        ? error
        : null;
  return cause?.code === "23505" && cause?.constraint === constraintName;
}
