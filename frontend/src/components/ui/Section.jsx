import React from "react";

const Section = ({ title, description, children, className = "" }) => {
  return (
    <div className={`rounded-2xl border border-white/8 bg-surface p-6 ${className}`}>
      {title && (
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {description && <p className="mt-1 text-sm text-gray">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
};

export default Section;
