import {
  Bell,
  Info
} from "lucide-react";

export default function Notifications() {
  return (
    <div className="space-y-6">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Bell size={21} />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Notifications
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Inspection alerts and compliance notifications.
          </p>
        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        <div className="flex gap-4">

          <Info className="text-blue-600" />

          <div>
            <p className="font-semibold text-slate-800">
              No new notifications
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Compliance alerts and inspection events will appear here.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}