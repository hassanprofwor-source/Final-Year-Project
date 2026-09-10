import { HOURS, WEEKDAYS, formatHourLabel, parseOrderDate, toLocalNaive } from "./peakHours.js";

const COUNTED_STATUSES = new Set(["Accepted", "Completed"]);
const WINDOW_DAYS = 30;
const PLACEHOLDER_IMAGE = "/default-food.png";

const flattenOrders = (orders = []) => {
  const rows = [];
  orders.forEach((order) => {
    if (!COUNTED_STATUSES.has(order.status)) return;
    const timestamp = parseOrderDate(order);
    if (!timestamp || Number.isNaN(timestamp.getTime())) return;
    const items = order.cartItems || [];
    if (!items.length) return;
    items.forEach((item) => {
      const name = String(item.name || "").trim();
      const quantity = Number(item.quantity) || 0;
      if (!name || quantity <= 0) return;
      rows.push({
        name,
        image: item.image || "",
        quantity,
        revenue: (Number(item.price) || 0) * quantity,
        timestamp,
        orderId: String(order._id || `${timestamp.getTime()}-${name}`),
      });
    });
  });
  return rows;
};

const summarize = (rows) => {
  const totals = new Map();
  rows.forEach((row) => {
    const current = totals.get(row.name) || {
      name: row.name,
      image: row.image,
      units: 0,
      revenue: 0,
    };
    current.units += row.quantity;
    current.revenue += row.revenue;
    if (!current.image && row.image) current.image = row.image;
    totals.set(row.name, current);
  });

  return [...totals.values()]
    .sort((a, b) => b.units - a.units || b.revenue - a.revenue)
    .map((item) => ({ ...item, revenue: Number(item.revenue.toFixed(2)) }));
};

const rankItems = (ranked, limit) =>
  ranked.slice(0, limit).map((item, index) => ({ ...item, rank: index + 1 }));

const mostCommonHour = (rows) => {
  const counts = {};
  rows.forEach((row) => {
    const hour = row.timestamp.getHours();
    if (!HOURS.includes(hour)) return;
    counts[hour] = (counts[hour] || 0) + row.quantity;
  });
  const hours = Object.keys(counts);
  if (!hours.length) return 19;
  return Number(hours.sort((a, b) => counts[b] - counts[a])[0]);
};

const withImages = (items, catalog) =>
  items.map((item) => ({
    ...item,
    image: item.image || catalog.get(item.name) || PLACEHOLDER_IMAGE,
  }));

const peakPairing = (windowRows, hour, catalog = new Map()) => {
  const items = withImages(
    rankItems(
      summarize(windowRows.filter((row) => row.timestamp.getHours() === hour)),
      3
    ),
    catalog
  );
  const todayName = WEEKDAYS[(toLocalNaive(new Date()).getDay() + 6) % 7];
  const label = formatHourLabel(hour);
  let prepLine = `Not enough item sales at ${label} yet to suggest prep.`;
  if (items.length === 1) {
    prepLine = `At ${label}, ${items[0].name} leads — prep that first.`;
  } else if (items.length === 2) {
    prepLine = `At ${label}, ${items[0].name} and ${items[1].name} lead — prep those first.`;
  } else if (items.length >= 3) {
    prepLine = `At ${label}, ${items[0].name}, ${items[1].name}, and ${items[2].name} lead — prep those first.`;
  }

  return {
    hour,
    label,
    weekday: todayName,
    items,
    prepLine,
  };
};

export const buildMenuInsights = (orders = [], menuItems = []) => {
  const now = toLocalNaive(new Date());
  const rows = flattenOrders(orders);
  const catalog = new Map(
    menuItems
      .filter((item) => item?.name)
      .map((item) => [String(item.name).trim(), item.image?.url || ""])
  );

  const windowStart = new Date(now.getTime() - WINDOW_DAYS * 86400000);
  const windowRows = rows.filter((row) => row.timestamp >= windowStart);
  const ranked = summarize(windowRows);
  const hotSellersAll = withImages(rankItems(ranked, 8), catalog);
  const hotSellers = hotSellersAll.slice(0, 3);
  const topNames = new Set(hotSellers.map((item) => item.name));
  const quietItems = withImages(
    [...ranked]
      .reverse()
      .filter((item) => !topNames.has(item.name))
      .slice(0, 3)
      .map((item) => ({ ...item, rank: null })),
    catalog
  );

  return {
    windowDays: WINDOW_DAYS,
    orderCount: new Set(windowRows.map((row) => row.orderId)).size,
    hotSellers,
    hotSellersAll,
    quietItems,
    peakPairing: peakPairing(windowRows, mostCommonHour(windowRows), catalog),
    demandForecast: { ready: false, items: [], reason: "ML service unavailable." },
    source: "node-live",
    usedSynthetic: false,
    loadError: null,
  };
};
