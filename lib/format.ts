export function formatDateRange(
  startsAt: Date,
  endsAt: Date,
  monthFormat: "short" | "long" = "short"
): string {
  const formatter = new Intl.DateTimeFormat("en-US", {
    month: monthFormat,
    day: "numeric",
    year: "numeric",
  });
  return `${formatter.format(startsAt)} – ${formatter.format(endsAt)}`;
}
