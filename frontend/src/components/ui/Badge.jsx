import React from "react";

const toneClasses = {
  pending: "bg-yellow/15 text-yellow",
  accepted: "bg-orange/15 text-orange",
  completed: "bg-green/15 text-green",
  rejected: "bg-red/15 text-red",
  available: "border border-white/20 text-white",
  booked: "bg-red/15 text-red",
  selected: "bg-green/15 text-green",
  neutral: "bg-white/8 text-gray",
};

const Badge = ({ tone = "neutral", children }) => {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
        toneClasses[tone] || toneClasses.neutral
      }`}
    >
      {children}
    </span>
  );
};

export default Badge;
