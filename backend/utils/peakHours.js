export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const HOURS = Array.from({ length: 11 }, (_, i) => i + 12);
const MIN_REAL_ORDERS = 20;
const ACTUALS_WINDOW_DAYS = 28;
const ANALYTICS_TZ = process.env.ANALYTICS_TZ || "Europe/London";

const zoneFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: ANALYTICS_TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// Mongo returns UTC instants. Reading .getHours() off them buckets orders by
// the server's timezone, which drifts by an hour whenever BST is in effect.
// Rebuilding the date from the restaurant's wall clock keeps the buckets right.
export const toLocalNaive = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  const parts = {};
  zoneFormatter.formatToParts(date).forEach(({ type, value: part }) => {
    parts[type] = part;
  });

  return new Date(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24,
    Number(parts.minute)
  );
};

export const parseOrderDate = (order) => {
  if (order.createdAt) return toLocalNaive(order.createdAt);
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

export const formatHourLabel = (hour) => {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 === 0 ? 12 : hour % 12;
  return `${display}:00 ${suffix}`;
};

const todayHourCount = (timestamps, hour) => {
  const today = toLocalNaive(new Date());
  return timestamps.filter(
    (ts) =>
      ts.getFullYear() === today.getFullYear() &&
      ts.getMonth() === today.getMonth() &&
      ts.getDate() === today.getDate() &&
      ts.getHours() === hour
  ).length;
};

const busyWindow = (values) => {
  const windowSize = 3;
  if (!values.length) return "12:00–22:00";
  if (values.length < windowSize) {
    return `${String(HOURS[0]).padStart(2, "0")}:00–${String(HOURS[HOURS.length - 1]).padStart(2, "0")}:00`;
  }
  let bestStart = 0;
  let bestSum = -1;
  for (let index = 0; index <= values.length - windowSize; index += 1) {
    const total = values.slice(index, index + windowSize).reduce((sum, value) => sum + value, 0);
    if (total > bestSum) {
      bestSum = total;
      bestStart = index;
    }
  }
  const start = HOURS[bestStart];
  const end = HOURS[bestStart + windowSize - 1];
  return `${String(start).padStart(2, "0")}:00–${String(end).padStart(2, "0")}:00`;
};

export const buildPeakInsights = (actuals, predictions, timestamps = []) => {
  const localNow = toLocalNaive(new Date());
  const todayIndex = (localNow.getDay() + 6) % 7;
  const todayName = WEEKDAYS[todayIndex];
  const predToday = predictions[todayName] || [];
  const actualToday = actuals[todayName] || [];
  const maxPred = predToday.length ? Math.max(...predToday) : 0;
  const peakIndex = predToday.indexOf(maxPred);
  const peakHour = HOURS[peakIndex] ?? 19;
  const peakLabel = formatHourLabel(peakHour);
  const expected = Number(maxPred.toFixed(2));

  let best = { weekday: todayName, hour: peakHour, orders: expected };
  WEEKDAYS.forEach((name) => {
    (predictions[name] || []).forEach((value, index) => {
      if (value > best.orders) {
        best = { weekday: name, hour: HOURS[index], orders: value };
      }
    });
  });

  const nowHour = localNow.getHours();
  const compareValue = timestamps.length
    ? todayHourCount(timestamps, peakHour)
    : actualToday[peakIndex] || 0;

  let vsExpected;
  if (nowHour < peakHour) {
    vsExpected = `Typical peak is still ahead at ${peakLabel} — about ${expected} orders.`;
  } else if (expected <= 0) {
    vsExpected = "Not enough typical data to compare today's peak yet.";
  } else if (compareValue > expected * 1.1) {
    vsExpected = `Today's ${peakLabel} is running above the model's usual level.`;
  } else if (compareValue < expected * 0.9) {
    vsExpected = `Today's ${peakLabel} is quieter than the model usually expects.`;
  } else {
    vsExpected = `Today's ${peakLabel} is in line with the usual pattern.`;
  }

  return {
    headline: `${best.weekday} around ${formatHourLabel(best.hour)} is usually the busiest.`,
    todayPeak: {
      weekday: todayName,
      hour: peakHour,
      label: peakLabel,
      expectedOrders: expected,
      range: null,
    },
    nextBusyWindow: busyWindow(predToday),
    vsExpected,
    why: null,
    drivers: [],
  };
};

export const buildPeakHoursReport = (orders = []) => {
  const realTimestamps = orders.map(parseOrderDate).filter(Boolean);
  const realOrderCount = realTimestamps.length;
  let timestamps = realTimestamps;
  let usedSynthetic = false;
  if (timestamps.length < MIN_REAL_ORDERS) {
    timestamps = generateSynthetic();
    usedSynthetic = true;
  }

  const windowStart = new Date(Date.now() - ACTUALS_WINDOW_DAYS * 86400000);
  const windowed = timestamps.filter((ts) => ts >= windowStart);
  const recent = windowed.length ? windowed : timestamps;

  const buckets = bucketCounts(recent);
  const dayCounts = {};
  recent.forEach((ts) => {
    const day = ts.getDay();
    dayCounts[day] = (dayCounts[day] || new Set()).add(ts.toDateString());
  });

  const actuals = {};
  WEEKDAYS.forEach((name, mondayIndex) => {
    // JS getDay: 0 Sunday ... convert Monday=0
    const jsDay = mondayIndex === 6 ? 0 : mondayIndex + 1;
    const daysObserved = dayCounts[jsDay]?.size || 1;
    actuals[name] = HOURS.map((hour) => {
      const total = buckets[`${jsDay}-${hour}`] || 0;
      return Number((total / daysObserved).toFixed(2));
    });
  });

  const blankWeek = Object.fromEntries(
    WEEKDAYS.map((name) => [name, HOURS.map(() => 0)])
  );

  return {
    hours: HOURS,
    weekdays: WEEKDAYS,
    actuals,
    predictions: actuals,
    // No model on this path, so there is no tree spread to report a band from.
    predictionsLower: blankWeek,
    predictionsUpper: blankWeek,
    predictionDates: {},
    predictionDrivers: {},
    actualsWindowDays: ACTUALS_WINDOW_DAYS,
    usedSynthetic,
    sampleSize: timestamps.length,
    realOrderCount,
    trainedSampleSize: null,
    trainedAt: null,
    metrics: null,
    featureImportances: null,
    hyperparameters: null,
    promotion: null,
    drift: null,
    source: usedSynthetic ? "node-synthetic" : "node-live",
    insights: buildPeakInsights(actuals, actuals, realTimestamps),
  };
};
