import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildOrderCountFilter, buildOrderListFilter, escapeRegex } from "../utils/orderFilters.js";

describe("buildOrderListFilter", () => {
  it("returns an empty filter when no query is sent", () => {
    assert.deepEqual(buildOrderListFilter({}), {});
  });

  it("filters delivery orders by status and phone substring", () => {
    assert.deepEqual(
      buildOrderListFilter({
        orderType: "Delivery",
        status: "Pending",
        search: "0300",
      }),
      {
        orderType: "Delivery",
        status: "Pending",
        phone: { $regex: "0300", $options: "i" },
      },
    );
  });

  it("filters dine-in orders by phone and time slot", () => {
    assert.deepEqual(
      buildOrderListFilter({
        orderType: "Dine In",
        status: "Accepted",
        search: "0712",
        time: "19:00",
      }),
      {
        orderType: "Dine In",
        status: "Accepted",
        time: "19:00",
        phone: { $regex: "0712", $options: "i" },
      },
    );
  });

  it("ignores unknown order types and statuses", () => {
    assert.deepEqual(
      buildOrderListFilter({ orderType: "Takeaway", status: "Cancelled", search: "  " }),
      {},
    );
  });

  it("escapes regex characters in the phone search", () => {
    assert.equal(escapeRegex("+44 (0)"), "\\+44 \\(0\\)");
    assert.equal(
      buildOrderListFilter({ search: "+44" }).phone.$regex,
      "\\+44",
    );
  });
});

describe("buildOrderCountFilter", () => {
  it("counts only within the requested order type", () => {
    assert.deepEqual(buildOrderCountFilter({ orderType: "Dine In", search: "0300" }), {
      orderType: "Dine In",
    });
  });
});
