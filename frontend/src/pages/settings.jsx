import {
  Bell,
  Lock,
  Palette,
  Save,
  ShieldCheck,
  User,
  Settings as SettingsIcon,
} from "lucide-react";

import { useState } from "react";

export default function Settings() {
  const [saved, setSaved] = useState(false);

  const [settings, setSettings] = useState({
    name: "Enforcement Officer",
    email: "officer@packsureai.gov.in",
    notifications: true,
    emailAlerts: true,
    autoProcessing: true,
    darkMode: false,
  });

  function updateSetting(key, value) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    setSaved(false);
  }

  function handleSave() {
    localStorage.setItem(
      "packsure_settings",
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(() => {
      setSaved(false);
    }, 2500);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">

      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <SettingsIcon size={21} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Manage your PacksureAI account and application preferences.
            </p>
          </div>
        </div>
      </div>

      {saved && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
          Settings saved successfully.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">

        <div className="space-y-2">
          <SettingNav
            icon={User}
            title="Profile"
            active
          />

          <SettingNav
            icon={Bell}
            title="Notifications"
          />

          <SettingNav
            icon={ShieldCheck}
            title="Security"
          />

          <SettingNav
            icon={Palette}
            title="Appearance"
          />
        </div>

        <div className="space-y-6 lg:col-span-2">

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <User size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Profile
                </h2>

                <p className="text-xs text-slate-400">
                  Your enforcement officer account information.
                </p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">

              <Field
                label="Full Name"
                value={settings.name}
                onChange={(value) =>
                  updateSetting("name", value)
                }
              />

              <Field
                label="Email Address"
                value={settings.email}
                onChange={(value) =>
                  updateSetting("email", value)
                }
              />

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Role
                </label>

                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600">
                  Enforcement Officer
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-slate-600">
                  Account Status
                </label>

                <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  Active
                </div>
              </div>

            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Bell size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Notifications
                </h2>

                <p className="text-xs text-slate-400">
                  Control inspection and compliance notifications.
                </p>
              </div>
            </div>

            <Toggle
              title="Application notifications"
              description="Show compliance and inspection alerts."
              checked={settings.notifications}
              onChange={(value) =>
                updateSetting("notifications", value)
              }
            />

            <Toggle
              title="Email alerts"
              description="Receive important compliance alerts by email."
              checked={settings.emailAlerts}
              onChange={(value) =>
                updateSetting("emailAlerts", value)
              }
            />

            <Toggle
              title="Automatic processing"
              description="Automatically process OCR and compliance after evidence capture."
              checked={settings.autoProcessing}
              onChange={(value) =>
                updateSetting("autoProcessing", value)
              }
            />

          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Lock size={19} />
              </div>

              <div>
                <h2 className="font-semibold text-slate-950">
                  Security
                </h2>

                <p className="text-xs text-slate-400">
                  Security preferences for this workstation.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">

              <div className="flex items-start gap-3">

                <ShieldCheck
                  size={19}
                  className="mt-0.5 text-green-600"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Protected enforcement session
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Compliance records, evidence and reports are stored
                    against the inspection record.
                  </p>
                </div>

              </div>

            </div>

          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
            >
              <Save size={17} />
              Save Settings
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-600">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

function Toggle({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 py-4 first:border-t-0">

      <div className="pr-5">
        <p className="text-sm font-semibold text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked
            ? "bg-blue-600"
            : "bg-slate-300"
        }`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition ${
            checked
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>

    </div>
  );
}

function SettingNav({
  icon: Icon,
  title,
  active = false,
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium ${
        active
          ? "bg-blue-50 text-blue-700"
          : "text-slate-500"
      }`}
    >
      <Icon size={18} />
      {title}
    </div>
  );
}