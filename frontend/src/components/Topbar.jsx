import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import { UserButton } from "@clerk/react";
import { navItems } from "./navItems";
import { useNotifications } from "../modules/notifications/useNotifications";

const formatTime = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleString();
};

const Topbar = ({ onOpenSidebar }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const active = navItems.find(
    (item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`)
  );
  const title = active?.name || "Skyplate";

  useEffect(() => {
    const onClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openNotification = async (notification) => {
    if (!notification.read) {
      await markRead(notification._id);
    }
    setOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

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
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((current) => !current)}
          className="relative rounded-lg p-2 text-white hover:bg-white/5"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-red px-1 text-center text-[10px] font-semibold leading-4 text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
        {open ? (
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-xl border border-white/10 bg-black/95 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/8 px-3 py-2">
              <p className="text-sm font-semibold text-white">Notifications</p>
              {unreadCount > 0 ? (
                <button
                  onClick={markAllRead}
                  className="text-xs text-gray hover:text-white"
                >
                  Mark all read
                </button>
              ) : null}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-3 py-6 text-center text-sm text-gray">No notifications yet.</p>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => openNotification(notification)}
                    className={`block w-full border-b border-white/5 px-3 py-3 text-left hover:bg-white/5 ${
                      notification.read ? "opacity-70" : ""
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{notification.title}</p>
                    <p className="mt-1 text-xs text-gray">{notification.body}</p>
                    <p className="mt-1 text-[11px] text-gray">{formatTime(notification.createdAt)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : null}
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
