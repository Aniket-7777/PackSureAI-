import {
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  ScanLine,
  FileCheck2,
  BarChart3,
} from "lucide-react";

import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("officer");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleLogin(event) {
    event.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    /*
      Temporary local login.

      Authentication can be connected to Supabase later.
      For now this allows the complete application workflow
      to be tested without blocking the dashboard.
    */

    const user = {
      email: email.trim(),
      role,
      name:
        role === "admin"
          ? "System Administrator"
          : role === "reviewer"
            ? "Compliance Reviewer"
            : "Enforcement Officer",
    };

    localStorage.setItem(
      "packsure_user",
      JSON.stringify(user)
    );

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 300);
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LEFT */}

        <div className="relative hidden overflow-hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-slate-950 to-slate-950" />

          <div className="absolute -right-40 top-20 h-[500px] w-[500px] rounded-full bg-blue-500/20 blur-[120px]" />

          <div className="absolute -bottom-40 left-20 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />

          <div className="relative flex min-h-screen flex-col justify-between p-12 text-white">

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                <ShieldCheck size={23} />
              </div>

              <div>
                <p className="font-bold">
                  PacksureAI
                </p>

                <p className="text-[9px] uppercase tracking-[0.25em] text-blue-200">
                  Compliance Intelligence
                </p>
              </div>
            </div>

            <div className="relative max-w-xl">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-3 py-1.5 text-xs text-blue-300">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                SIH 26034
              </div>

              <h1 className="text-5xl font-bold leading-tight">
                Intelligent inspection for packaged commodities.
              </h1>

              <p className="mt-6 max-w-lg leading-7 text-slate-400">
                Scan product labels, extract mandatory declarations,
                validate Legal Metrology requirements and generate
                evidence-backed compliance reports.
              </p>

              <div className="mt-10 grid grid-cols-3 gap-3">
                <MiniFeature
                  icon={ScanLine}
                  text="Smart Scanning"
                />

                <MiniFeature
                  icon={FileCheck2}
                  text="Rule Validation"
                />

                <MiniFeature
                  icon={BarChart3}
                  text="Analytics"
                />
              </div>
            </div>

            <p className="text-xs text-slate-600">
              PacksureAI • Legal Metrology Compliance Platform
            </p>

          </div>
        </div>

        {/* RIGHT */}

        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">

          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >

            <div className="mb-8 flex items-center gap-3 lg:hidden">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <ShieldCheck size={22} />
              </div>

              <div>
                <p className="font-bold text-slate-950">
                  PacksureAI
                </p>

                <p className="text-[9px] uppercase tracking-[0.2em] text-slate-500">
                  Compliance Intelligence
                </p>
              </div>

            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">

              <div className="mb-8">

                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <ShieldCheck size={23} />
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-slate-950">
                  Welcome back
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Sign in to access your enforcement dashboard.
                </p>

              </div>

              {error && (
                <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="space-y-5"
              >

                {/* EMAIL */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email address
                  </label>

                  <div className="relative">

                    <Mail
                      size={18}
                      className="absolute left-3.5 top-3.5 text-slate-400"
                    />

                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(event) =>
                        setEmail(event.target.value)
                      }
                      placeholder="officer@example.com"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                  </div>
                </div>

                {/* PASSWORD */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>

                  <div className="relative">

                    <Lock
                      size={18}
                      className="absolute left-3.5 top-3.5 text-slate-400"
                    />

                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                    />

                  </div>
                </div>

                {/* ROLE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Login role
                  </label>

                  <select
                    value={role}
                    onChange={(event) =>
                      setRole(event.target.value)
                    }
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10"
                  >
                    <option value="officer">
                      Enforcement Officer
                    </option>

                    <option value="reviewer">
                      Compliance Reviewer
                    </option>

                    <option value="admin">
                      Administrator
                    </option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Signing in..."
                    : "Sign in"}

                  {!loading && (
                    <ArrowRight size={17} />
                  )}
                </button>

              </form>

              <div className="mt-7 rounded-xl bg-slate-50 p-4">

                <div className="flex gap-3">

                  <ShieldCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <div>
                    <p className="text-xs font-semibold text-slate-700">
                      Secure enforcement access
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-slate-500">
                      Role-based access is enabled for
                      enforcement, review and administration.
                    </p>
                  </div>

                </div>

              </div>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="mt-6 w-full text-center text-xs font-medium text-slate-500 transition hover:text-blue-600"
              >
                ← Back to home
              </button>

            </div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}

function MiniFeature({ icon: Icon, text }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <Icon size={17} className="text-blue-300" />

      <p className="mt-2 text-[11px] font-medium text-slate-300">
        {text}
      </p>
    </div>
  );
}