export const sourceLabel = (payload) => {
  if (!payload) return "—";
  if (payload.usedSynthetic) return "Training used sample data";
  if (String(payload.source || "").startsWith("flask")) return "Live ML";
  if (String(payload.source || "").startsWith("node")) return "Live without ML";
  return "—";
};

export const formatDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { day: "numeric", month: "short" });
};

export const driftTone = (status) => {
  if (status === "degraded") return "rejected";
  if (status === "watch") return "pending";
  if (status === "healthy") return "completed";
  return "neutral";
};

export const driftLabel = (status) => {
  if (status === "degraded") return "Accuracy dropping";
  if (status === "watch") return "Watching accuracy";
  if (status === "healthy") return "Accuracy steady";
  return "Accuracy unknown";
};

export const currentWeekday = (weekdays = []) => {
  const fallback = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const names = weekdays.length ? weekdays : fallback;
  return names[(new Date().getDay() + 6) % 7];
};
