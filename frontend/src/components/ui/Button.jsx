import React from "react";
import { Link } from "react-router-dom";

const variants = {
  primary: "bg-red text-white shadow-[0_8px_20px_-10px_rgba(225,29,72,0.8)] hover:bg-red/90",
  secondary: "bg-elevated text-white hover:bg-white/10",
  outline: "border border-white/15 text-white hover:border-white/30 hover:bg-white/5",
};

const Button = ({ as = "button", to, variant = "primary", className = "", children, ...props }) => {
  const classes = `inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
    variants[variant] || variants.primary
  } ${className}`;

  if (as === "link" && to) {
    return (
      <Link to={to} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;
