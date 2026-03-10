import { DatabaseError, NeonDbError } from "@neondatabase/serverless";

function isDbError(
  error: unknown
): error is DatabaseError | NeonDbError {
  return error instanceof DatabaseError || error instanceof NeonDbError;
}

export function isUniqueViolation(
  error: unknown,
  constraintName: string
): boolean {
  const cause =
    error instanceof Error && isDbError(error.cause)
      ? error.cause
      : isDbError(error)
        ? error
        : null;
  return cause?.code === "23505" && cause?.constraint === constraintName;
}
