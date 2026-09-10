import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildMenuInsights } from "../utils/menuInsights.js";
import { buildPeakHoursReport, toLocalNaive } from "../utils/peakHours.js";

const DAY = 86400000;
const now = Date.now();

const order = (name, when, quantity = 1) => ({
  _id: `${name}-${when}`,
  status: "Completed",
  createdAt: new Date(when),
  cartItems: [{ name, image: "", price: 10, quantity, size: "R" }],
});

// Place `units` orders inside each trailing 7-day window, oldest window first.
const weekly = (name, weeklyUnits, weeks = 6) => {
  const rows = [];
  weeklyUnits.forEach((units, position) => {
    const start = now - (weeks - position) * 7 * DAY;
    for (let index = 0; index < units; index += 1) {
      rows.push(order(name, start + index * 3600000));
    }
  });
  return rows;
};

const sampleOrders = () => [
  ...weekly("Anchor Dish", [10, 10, 10, 10, 10, 10]),
  ...weekly("Faded Dish", [5, 5, 5, 5, 5, 0]),
  ...weekly("Debut Dish", [0, 0, 0, 0, 0, 20]),
  ...weekly("Rare Dish", [1, 0, 1, 0, 1, 0]),
  ...weekly("Rising Dish", [2, 3, 5, 7, 9, 11]),
];

const menuItems = [{ name: "Faded Dish", image: { url: "https://cdn/faded.png" } }];
const insights = () => buildMenuInsights(sampleOrders(), menuItems);
const ranked = (name) => insights().hotSellersAll.find((item) => item.name === name);

describe("menu insights fallback images", () => {
  it("falls back to the menu catalog image", () => {
    assert.equal(ranked("Faded Dish").image, "https://cdn/faded.png");
  });

  it("never leaves a ranked item without an image", () => {
    for (const item of insights().hotSellersAll) {
      assert.ok(item.image, `${item.name} has no image`);
    }
  });
});

describe("timezone handling", () => {
  it("reads a summer UTC instant as British Summer Time", () => {
    assert.equal(toLocalNaive(new Date("2026-07-01T12:00:00Z")).getHours(), 13);
  });

  it("reads a winter UTC instant as GMT", () => {
    assert.equal(toLocalNaive(new Date("2026-01-15T12:00:00Z")).getHours(), 12);
  });

  it("rolls a late-evening UTC instant into the next local day", () => {
    const local = toLocalNaive(new Date("2026-07-01T23:30:00Z"));
    assert.equal(local.getDate(), 2);
    assert.equal(local.getHours(), 0);
  });

  it("returns null for an unparseable value", () => {
    assert.equal(toLocalNaive("not a date"), null);
  });
});

describe("peak hours fallback payload", () => {
  it("exposes the fields the admin chart reads", () => {
    const report = buildPeakHoursReport(sampleOrders());
    for (const key of [
      "hours",
      "weekdays",
      "actuals",
      "predictions",
      "predictionsLower",
      "predictionsUpper",
      "actualsWindowDays",
      "insights",
    ]) {
      assert.ok(key in report, `missing ${key}`);
    }
    assert.equal(report.insights.todayPeak.range, null);
    assert.equal(report.source, "node-live");
  });

  it("keeps every weekday row the same width as the hour axis", () => {
    const report = buildPeakHoursReport(sampleOrders());
    for (const day of report.weekdays) {
      assert.equal(report.actuals[day].length, report.hours.length);
      assert.equal(report.predictionsLower[day].length, report.hours.length);
    }
  });
});
