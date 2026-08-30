import React from "react";

const MultiSelectChips = ({ options, value = [], onChange }) => {
  const toggle = (option) => {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
              selected ? "bg-red text-white" : "border border-white/15 text-gray hover:bg-white/5 hover:text-white"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
};

export default MultiSelectChips;
