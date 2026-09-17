import { describe, expect, it } from "vitest";
import { orderListParams } from "../src/modules/orders/orderListParams.js";

describe("orderListParams", () => {
  it("sends delivery phone search to the backend", () => {
    expect(
      orderListParams({
        orderType: "Delivery",
        status: "Pending",
        search: "0300",
      }),
    ).toEqual({
      orderType: "Delivery",
      status: "Pending",
      search: "0300",
    });
  });

  it("sends dine-in phone search and time slot to the backend", () => {
    expect(
      orderListParams({
        orderType: "Dine In",
        status: "Accepted",
        search: "0712",
        time: "19:00",
      }),
    ).toEqual({
      orderType: "Dine In",
      status: "Accepted",
      search: "0712",
      time: "19:00",
    });
  });

  it("omits empty search and time values", () => {
    expect(orderListParams({ orderType: "Dine In", status: "Pending", search: "", time: "" })).toEqual({
      orderType: "Dine In",
      status: "Pending",
    });
  });
});
