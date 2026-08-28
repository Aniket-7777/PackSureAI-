import { Outlet } from "react-router-dom";

import Sidebar from "../components/sidebar";
import Topbar from "../components/topbar";

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />

      <div className="min-h-screen pl-[250px]">
        <Topbar />

        <main className="p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}