import React from "react";
import { Link } from "react-router-dom";
import { Utensils, Truck, Armchair, Table2, MessageSquare, User, BarChart3, ArrowUpRight } from "lucide-react";

const modules = [
  {
    name: "Users",
    href: "/Users",
    icon: User,
    description: "Manage user accounts, roles, and permissions.",
  },
  {
    name: "Menu",
    href: "/Menu",
    icon: Utensils,
    description: "Add, edit, and remove food items, sizes, and prices.",
  },
  {
    name: "Delivery",
    href: "/Delivery",
    icon: Truck,
    description: "Track delivery orders through pending, accepted, and completed.",
  },
  {
    name: "Dine-In",
    href: "/DineIn",
    icon: Armchair,
    description: "Manage dine-in orders by time slot.",
  },
  {
    name: "Manage",
    href: "/Manage",
    icon: Table2,
    description: "Manage tables, time slots, and reservations.",
  },
  {
    name: "Reviews",
    href: "/Reviews",
    icon: MessageSquare,
    description: "Read customer feedback and reply to open reviews.",
  },
  {
    name: "Analytics",
    href: "/Analytics",
    icon: BarChart3,
    description: "View busy hours and best-selling dishes.",
  },
];

const Home = () => {
  return (
    <div className="min-h-full px-4 py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-red">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white lg:text-4xl">
          Welcome back to Skyplate
        </h1>
        <p className="mt-3 max-w-xl text-gray">
          Pick a module below to get started. Everything here is connected to your live restaurant data.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.name}
                to={mod.href}
                className="group relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-white/8 bg-surface p-6 transition-all duration-300 hover:-translate-y-1 hover:border-red/40 hover:shadow-[0_18px_40px_-24px_rgba(225,29,72,0.55)]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red/12 text-red">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-gray opacity-0 transition group-hover:opacity-100" />
                </div>
                <h2 className="text-lg font-semibold text-white">{mod.name}</h2>
                <p className="text-sm leading-relaxed text-gray">{mod.description}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Home;
