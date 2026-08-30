import React from "react";

const StatCard = ({ label, value, icon: Icon }) => {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-white/8 bg-surface p-4">
      {Icon && (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red/12">
          <Icon className="h-5 w-5 text-red" />
        </div>
      )}
      <div>
        <p className="text-xs text-gray">{label}</p>
        <p className="text-xl font-semibold text-white">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
