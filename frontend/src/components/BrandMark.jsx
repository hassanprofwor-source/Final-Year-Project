import React from "react";

const BrandMark = ({ glow = false }) => {
  return (
    <div className="inline-flex items-center gap-2.5">
      <img
        src="/assets/Logo1.jpg"
        alt="Skyplate"
        className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/10"
      />
      <span
        className={`text-xl font-semibold tracking-tight text-white ${glow ? "animate-fadeInGlow" : ""}`}
      >
        Sky<span className="text-red">plate</span>
      </span>
    </div>
  );
};

export default BrandMark;
