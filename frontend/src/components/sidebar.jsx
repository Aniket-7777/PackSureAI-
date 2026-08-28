import {
  LayoutDashboard,
  ScanLine,
  ClipboardList,
  Package,
  FileText,
  Scale,
  Users,
  Settings,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { NavLink } from "react-router-dom";

import { useState } from "react";


const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard"
  },
  {
    title: "New Inspection",
    icon: ScanLine,
    path: "/new-inspection"
  },
  {
    title: "Inspections",
    icon: ClipboardList,
    path: "/inspections"
  },
  {
    title: "Products",
    icon: Package,
    path: "/products"
  },
  {
    title: "Reports",
    icon: FileText,
    path: "/reports"
  },
  {
    title: "LMPC Rules",
    icon: Scale,
    path: "/rules"
  },
  {
    title: "Users",
    icon: Users,
    path: "/users"
  }
];

export default function Sidebar() {

  const [collapsed, setCollapsed] = useState(false);


  return (
    <aside
      className={`fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white transition-all duration-300 ${
        collapsed ? "w-[76px]" : "w-[250px]"
      }`}
    >

      {/* BRAND */}

      <div className="flex h-[76px] items-center border-b border-slate-100 px-5">

        <div className="flex min-w-0 items-center gap-3">

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">

            <ShieldCheck size={21} />

          </div>


          {!collapsed && (
            <div className="min-w-0">

              <p className="truncate font-bold text-slate-950">
                PacksureAI
              </p>

              <p className="truncate text-[8px] uppercase tracking-[0.2em] text-slate-400">
                Compliance AI
              </p>

            </div>
          )}

        </div>

      </div>


      {/* NAVIGATION */}

      <div className="flex-1 overflow-y-auto px-3 py-5">

        {!collapsed && (
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Workspace
          </p>
        )}


        <nav className="space-y-1">

          {menuItems.map((item) => {

            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                title={collapsed ? item.title : undefined}
                className={({ isActive }) =>
                  `group flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                  }`
                }
              >

                <Icon
                  size={19}
                  className="shrink-0"
                />

                {!collapsed && (
                  <span>
                    {item.title}
                  </span>
                )}

              </NavLink>
            );

          })}

        </nav>


        {!collapsed && (
          <div className="mt-8">

            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              System
            </p>


            <NavLink
              to="/settings"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-50 hover:text-slate-950"
            >

              <Settings size={19} />

              Settings

            </NavLink>

          </div>
        )}

      </div>


      {/* USER */}

      {!collapsed && (
        <div className="border-t border-slate-100 p-4">

          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              AO
            </div>

            <div className="min-w-0 flex-1">

              <p className="truncate text-xs font-semibold text-slate-800">
                Enforcement Officer
              </p>

              <p className="truncate text-[10px] text-slate-400">
                Officer Account
              </p>

            </div>

          </div>

        </div>
      )}


      {/* COLLAPSE */}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[70px] flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:text-blue-600"
      >

        {collapsed ? (
          <ChevronRight size={14} />
        ) : (
          <ChevronLeft size={14} />
        )}

      </button>

    </aside>
  );
}