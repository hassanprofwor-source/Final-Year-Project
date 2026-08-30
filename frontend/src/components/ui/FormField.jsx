import React from "react";

export const inputClass =
  "w-full rounded-xl border border-white/10 bg-elevated px-3 py-2.5 text-sm text-white placeholder:text-gray/70 focus:outline-none focus:ring-2 focus:ring-red/60";

const FormField = ({ label, htmlFor, error, span = 1, children }) => {
  return (
    <div className={span === 2 ? "col-span-2" : "col-span-1"}>
      {label && (
        <label htmlFor={htmlFor} className="mb-1.5 block text-sm text-gray">
          {label}
        </label>
      )}
      {children}
      {error && <p className="mt-1 text-sm text-red">{error}</p>}
    </div>
  );
};

export default FormField;
