import React from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, X } from "lucide-react";
import { useClerk } from "@clerk/react";
import BrandMark from "./BrandMark";
import { navItems } from "./navItems";

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { signOut } = useClerk();

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-white/8 bg-surface/95 backdrop-blur-xl transition-transform duration-300 lg:z-30 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link to="/Home" onClick={onClose}>
            <BrandMark />
          </Link>
          <button onClick={onClose} className="rounded-lg p-1 text-white hover:bg-white/5 lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {navItems.map((item) => {
            const active =
              location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-red/15 text-white shadow-[inset_3px_0_0_0_var(--color-red)]"
                    : "text-gray hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? "text-red" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/8 px-3 py-4">
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-gray transition-all hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Log Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
