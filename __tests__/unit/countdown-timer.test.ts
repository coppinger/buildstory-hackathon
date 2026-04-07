import { describe, it, expect } from "vitest";
import { computeCountdownState } from "@/components/countdown-timer";

const STARTS_AT = new Date("2026-05-03T19:00:00Z").getTime();
const ENDS_AT = new Date("2026-05-10T19:00:00Z").getTime();

describe("computeCountdownState", () => {
  describe("phase: before", () => {
    it("returns 'before' phase when now is before startsAt", () => {
      const now = new Date("2026-05-01T12:00:00Z").getTime();
      const state = computeCountdownState(now, STARTS_AT, ENDS_AT);
      expect(state.phase).toBe("before");
    });

    it("computes time remaining until start", () => {
      // Exactly 2 days, 7 hours before start
      const now = STARTS_AT - (2 * 24 * 60 * 60 * 1000) - (7 * 60 * 60 * 1000);
      const state = computeCountdownState(now, STARTS_AT, ENDS_AT);
      expect(state.phase).toBe("before");
      expect(state.days).toBe(2);
      expect(state.hours).toBe(7);
      expect(state.minutes).toBe(0);
      expect(state.seconds).toBe(0);
    });

    it("handles fractional remainder for minutes and seconds", () => {
      const now = STARTS_AT - (1 * 60 * 60 * 1000) - (23 * 60 * 1000) - (45 * 1000);
      const state = computeCountdownState(now, STARTS_AT, ENDS_AT);
      expect(state.phase).toBe("before");
      expect(state.days).toBe(0);
      expect(state.hours).toBe(1);
      expect(state.minutes).toBe(23);
      expect(state.seconds).toBe(45);
    });
  });

  describe("phase: live", () => {
    it("returns 'live' phase when now is between startsAt and endsAt", () => {
      const now = new Date("2026-05-06T12:00:00Z").getTime();
      const state = computeCountdownState(now, STARTS_AT, ENDS_AT);
      expect(state.phase).toBe("live");
    });

    it("returns 'live' at the exact start moment", () => {
      const state = computeCountdownState(STARTS_AT, STARTS_AT, ENDS_AT);
      expect(state.phase).toBe("live");
    });

    it("counts down to the end during live phase", () => {
      // Exactly 1 day before end
      const now = ENDS_AT - (1 * 24 * 60 * 60 * 1000);
      const state = computeCountdownState(now, STARTS_AT, ENDS_AT);
      expect(state.phase).toBe("live");
      expect(state.days).toBe(1);
      expect(state.hours).toBe(0);
    });
  });

  describe("phase: ended", () => {
    it("returns 'ended' phase when now is at or after endsAt", () => {
      const state = computeCountdownState(ENDS_AT, STARTS_AT, ENDS_AT);
      expect(state.phase).toBe("ended");
      expect(state.days).toBe(0);
      expect(state.hours).toBe(0);
      expect(state.minutes).toBe(0);
      expect(state.seconds).toBe(0);
    });

    it("returns zeros for all segments after endsAt", () => {
      const now = new Date("2026-06-01T00:00:00Z").getTime();
      const state = computeCountdownState(now, STARTS_AT, ENDS_AT);
      expect(state.phase).toBe("ended");
      expect(state.days).toBe(0);
      expect(state.hours).toBe(0);
      expect(state.minutes).toBe(0);
      expect(state.seconds).toBe(0);
    });
  });

  describe("phase boundary transitions", () => {
    it("transitions from before → live one millisecond before/after start", () => {
      const justBefore = computeCountdownState(STARTS_AT - 1, STARTS_AT, ENDS_AT);
      const atStart = computeCountdownState(STARTS_AT, STARTS_AT, ENDS_AT);
      expect(justBefore.phase).toBe("before");
      expect(atStart.phase).toBe("live");
    });

    it("transitions from live → ended one millisecond before/after end", () => {
      const justBefore = computeCountdownState(ENDS_AT - 1, STARTS_AT, ENDS_AT);
      const atEnd = computeCountdownState(ENDS_AT, STARTS_AT, ENDS_AT);
      expect(justBefore.phase).toBe("live");
      expect(atEnd.phase).toBe("ended");
    });
  });
});
