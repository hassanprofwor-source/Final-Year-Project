import React from "react";
import { NavLink } from "react-router-dom";

const linkClass = ({ isActive }) =>
  `rounded-lg px-4 py-2 text-sm font-semibold transition ${
    isActive ? "bg-red text-white" : "text-gray hover:bg-white/5 hover:text-white"
  }`;

const ManageSubNav = () => {
  return (
    <div className="inline-flex gap-1 rounded-xl bg-elevated p-1">
      <NavLink to="/Manage/Tables" className={linkClass}>
        Tables
      </NavLink>
      <NavLink to="/Manage/TimeSlots" className={linkClass}>
        Time slots
      </NavLink>
    </div>
  );
};

export default ManageSubNav;
