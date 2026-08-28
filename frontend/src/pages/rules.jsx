import { Scale } from "lucide-react";

export default function Rules() {
  return (
    <Page
      icon={Scale}
      title="LMPC Rules"
      subtitle="Legal Metrology Packaged Commodities compliance rules."
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">
          Compliance rules are managed by the backend rules engine.
        </p>

        <div className="mt-5 rounded-xl bg-slate-50 p-5">
          <p className="text-sm font-semibold text-slate-800">
            Rule Engine
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Active rules, versions, applicability and validation
            configurations are stored in the compliance database.
          </p>
        </div>
      </div>
    </Page>
  );
}


function Page({
  icon: Icon,
  title,
  subtitle,
  children
}) {
  return (
    <div className="space-y-6">

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Icon size={21} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-950">
              {title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {subtitle}
            </p>
          </div>
        </div>
      </div>

      {children}

    </div>
  );
}