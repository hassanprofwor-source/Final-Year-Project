import React from "react";

const sizeClasses = {
  sm: "h-5 w-5 border-2",
  md: "h-8 w-8 border-2",
  lg: "h-12 w-12 border-[3px]",
};

const Loader = ({ size = "md", fullScreen = false, label }) => {
  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-red border-t-transparent`}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && <p className="text-sm text-gray">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return <div className="flex min-h-screen items-center justify-center bg-black">{spinner}</div>;
  }

  return <div className="flex items-center justify-center py-16">{spinner}</div>;
};

export default Loader;
