const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 11 }, (_, i) => i + 12);
const MIN_REAL_ORDERS = 20;

const parseOrderDate = (order) => {
  if (order.createdAt) return new Date(order.createdAt);
  if (order.date) {
    const [day, month, year] = String(order.date).split("-");
    const [hour, minute] = String(order.time || "12:00").split(":");
    return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute || 0));
  }
  return null;
};

const generateSynthetic = () => {
  const timestamps = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let dayOffset = 0; dayOffset < 60; dayOffset++) {
    const day = new Date(today);
    day.setDate(today.getDate() - dayOffset);
    const lunch = 8 + Math.floor(Math.random() * 11);
    const dinner = 12 + Math.floor(Math.random() * 13);
    for (let i = 0; i < lunch; i++) {
      const hour = [12, 13, 14][Math.floor(Math.random() * 3)];
      timestamps.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(Math.random() * 60)));
    }
    for (let i = 0; i < dinner; i++) {
      const hour = [18, 19, 20, 21][Math.floor(Math.random() * 4)];
      timestamps.push(new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, Math.floor(Math.random() * 60)));
    }
  }
  return timestamps;
};

const bucketCounts = (timestamps) => {
  const buckets = {};
  timestamps.forEach((ts) => {
    if (!ts || Number.isNaN(ts.getTime())) return;
    const key = `${ts.getDay()}-${ts.getHours()}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });
  return buckets;
};

export const buildPeakHoursReport = (orders = []) => {
  let timestamps = orders.map(parseOrderDate).filter(Boolean);
  let usedSynthetic = false;
  if (timestamps.length < MIN_REAL_ORDERS) {
    timestamps = generateSynthetic();
    usedSynthetic = true;
  }

  const buckets = bucketCounts(timestamps);
  const dayCounts = {};
  timestamps.forEach((ts) => {
    const day = ts.getDay();
    dayCounts[day] = (dayCounts[day] || new Set()).add(ts.toDateString());
  });

  const predictions = {};
  WEEKDAYS.forEach((name, mondayIndex) => {
    // JS getDay: 0 Sunday ... convert Monday=0
    const jsDay = mondayIndex === 6 ? 0 : mondayIndex + 1;
    const daysObserved = dayCounts[jsDay]?.size || 1;
    predictions[name] = HOURS.map((hour) => {
      const total = buckets[`${jsDay}-${hour}`] || 0;
      return Number((total / daysObserved).toFixed(2));
    });
  });

  return {
    hours: HOURS,
    weekdays: WEEKDAYS,
    predictions,
    usedSynthetic,
    sampleSize: timestamps.length,
    source: usedSynthetic ? "node-synthetic" : "node-orders",
  };
};
