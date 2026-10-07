import { describe, expect, it } from "vitest";
import {
  driftLabel,
  driftTone,
  isDateOnOrBeforeToday,
  sourceLabel,
} from "../src/modules/analytics/sourceLabel.js";

describe("analytics source labels", () => {
  it("W05 labels synthetic training data", () => {
    expect(sourceLabel({ usedSynthetic: true, source: "flask-live" })).toBe(
      "Training used sample data",
    );
  });

  it("W06 labels a live Flask model", () => {
    expect(sourceLabel({ source: "flask-live" })).toBe("Live ML");
  });

  it("W07 labels the Node fallback", () => {
    expect(sourceLabel({ source: "node-live" })).toBe("Live without ML");
  });

  it("W08 labels a missing payload as a dash", () => {
    expect(sourceLabel(null)).toBe("—");
  });

  it("W09 maps drift status to label and badge tone", () => {
    expect(driftLabel("healthy")).toBe("Accuracy steady");
    expect(driftTone("healthy")).toBe("completed");
    expect(driftLabel("watch")).toBe("Watching accuracy");
    expect(driftTone("watch")).toBe("pending");
    expect(driftLabel("degraded")).toBe("Accuracy dropping");
    expect(driftTone("degraded")).toBe("rejected");
  });

  it("shows forecast dates through today and hides later dates", () => {
    const today = new Date(2026, 9, 7);

    expect(isDateOnOrBeforeToday("2026-10-06", today)).toBe(true);
    expect(isDateOnOrBeforeToday("2026-10-07", today)).toBe(true);
    expect(isDateOnOrBeforeToday("2026-10-08", today)).toBe(false);
  });
});
