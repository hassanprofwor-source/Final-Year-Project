const ORDER_TYPES = new Set(["Delivery", "Dine In"]);
const STATUSES = new Set(["Pending", "Accepted", "Completed"]);

export const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildOrderListFilter = (query = {}) => {
  const filter = {};
  const orderType = typeof query.orderType === "string" ? query.orderType.trim() : "";
  const status = typeof query.status === "string" ? query.status.trim() : "";
  const time = typeof query.time === "string" ? query.time.trim() : "";
  const search = typeof query.search === "string" ? query.search.trim() : "";

  if (ORDER_TYPES.has(orderType)) filter.orderType = orderType;
  if (STATUSES.has(status)) filter.status = status;
  if (time) filter.time = time;
  if (search) {
    filter.phone = { $regex: escapeRegex(search), $options: "i" };
  }

  return filter;
};

export const buildOrderCountFilter = (query = {}) => {
  const orderType = typeof query.orderType === "string" ? query.orderType.trim() : "";
  if (ORDER_TYPES.has(orderType)) return { orderType };
  return {};
};
