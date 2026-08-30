import React from "react";

const Tabs = ({ tabs, active, onChange }) => {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl bg-elevated p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
            active === tab.value
              ? "bg-red text-white"
              : "text-gray hover:bg-white/5 hover:text-white"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
