import { Users as UsersIcon } from "lucide-react";

export default function Users() {
  return (
    <div className="space-y-6">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <UsersIcon size={21} />
        </div>

        <div>
          <h1 className="text-3xl font-bold text-slate-950">
            Users
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage enforcement users and permissions.
          </p>
        </div>

      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">

        <p className="text-sm font-semibold text-slate-800">
          User Management
        </p>

        <p className="mt-2 text-sm text-slate-500">
          Role-based user management can be connected to
          the profiles and user_permissions tables.
        </p>

      </div>

    </div>
  );
}