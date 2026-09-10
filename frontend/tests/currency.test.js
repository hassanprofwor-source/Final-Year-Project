import { describe, expect, it } from "vitest";
import { CURRENCY_CODE, formatMoney } from "../src/lib/currency.js";

describe("currency helpers", () => {
  it("W01 formats null as £0", () => {
    expect(formatMoney(null)).toBe("£0");
  });

  it("W02 formats 0 as £0", () => {
    expect(formatMoney(0)).toBe("£0");
  });

  it("W03 formats 12.5 as £12.5", () => {
    expect(formatMoney(12.5)).toBe("£12.5");
  });

  it("W04 uses gbp as the currency code", () => {
    expect(CURRENCY_CODE).toBe("gbp");
  });
});
