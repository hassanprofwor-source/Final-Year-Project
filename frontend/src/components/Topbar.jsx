import React from "react";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { UserButton } from "@clerk/react";
import { navItems } from "./navItems";

const Topbar = ({ onOpenSidebar }) => {
  const location = useLocation();
  const active = navItems.find(
    (item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
  );
  const title = active?.name || "Skyplate";

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/8 bg-black/70 px-4 py-3.5 backdrop-blur-xl lg:px-8">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-1 text-white hover:bg-white/5 lg:hidden"
      >
        <Menu className="h-6 w-6" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray">Admin</p>
        <h1 className="truncate text-lg font-semibold text-white">{title}</h1>
      </div>
      <UserButton
        appearance={{
          elements: {
            avatarBox: "h-8 w-8",
          },
        }}
      />
    </header>
  );
};

export default Topbar;
