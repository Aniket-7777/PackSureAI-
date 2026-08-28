import {
  ScanLine,
  CheckCircle2,
  AlertTriangle,
  Package,
  RefreshCw,
  FileText
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  getDashboardOverview,
  getRecentInspections,
  getDashboardViolations
} from "../api";


export default function Dashboard() {
  const navigate = useNavigate();

  const [overview, setOverview] = useState(null);
  const [recentInspections, setRecentInspections] = useState([]);
  const [violations, setViolations] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  useEffect(() => {
    loadDashboard();
  }, []);


  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const results =
        await Promise.allSettled([
          getDashboardOverview(),
          getRecentInspections({ limit: 10 }),
          getDashboardViolations({ limit: 50 })
        ]);


      const overviewResult = results[0];
      const inspectionsResult = results[1];
      const violationsResult = results[2];


      if (
        overviewResult.status === "fulfilled"
      ) {
        setOverview(
          overviewResult.value?.data ??
          overviewResult.value ??
          {}
        );
      } else {
        console.error(
          "Dashboard overview failed:",
          overviewResult.reason
        );
      }


      if (
        inspectionsResult.status === "fulfilled"
      ) {
        setRecentInspections(
          getArray(
            inspectionsResult.value
          )
        );
      } else {
        console.error(
          "Recent inspections failed:",
          inspectionsResult.reason
        );
      }


      if (
        violationsResult.status === "fulfilled"
      ) {
        setViolations(
          getArray(
            violationsResult.value
          )
        );
      } else {
        console.error(
          "Dashboard violations failed:",
          violationsResult.reason
        );
      }


      if (
        results.some(
          (item) =>
            item.status === "rejected"
        )
      ) {
        setError(
          "Some dashboard data could not be loaded."
        );
      }

    } catch (err) {
      console.error(
        "Dashboard error:",
        err
      );

      setError(
        err?.message ||
        "Failed to load dashboard."
      );

    } finally {
      setLoading(false);
    }
  }


  const inspections =
    overview?.inspections || {};

  const compliance =
    overview?.compliance || {};

  const violationStats =
    overview?.violations || {};

  const products =
    overview?.products || {};

  const evidence =
    overview?.evidence || {};


  return (
    <div className="mx-auto max-w-7xl space-y-8">


      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

        <div>

          <p className="text-sm font-semibold text-blue-600">
            Enforcement Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Compliance Intelligence
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Monitor inspections, products, violations and compliance activity.
          </p>

        </div>


        <div className="flex gap-3">

          <button
            type="button"
            onClick={loadDashboard}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >

            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            Refresh

          </button>


          <Link
            to="/new-inspection"
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >

            <ScanLine size={17} />

            New Inspection

          </Link>

        </div>

      </div>


      {/* ERROR */}

      {error && (

        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">

          {error}

        </div>

      )}


      {/* MAIN STAT CARDS */}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">


        <StatCard
          icon={ScanLine}
          title="Total Inspections"
          value={
            loading
              ? "..."
              : inspections.total ?? 0
          }
          description="All inspections"
        />


        <StatCard
          icon={CheckCircle2}
          title="Compliant"
          value={
            loading
              ? "..."
              : compliance.compliant ?? 0
          }
          description="Compliant inspections"
        />


        <StatCard
          icon={AlertTriangle}
          title="Violations"
          value={
            loading
              ? "..."
              : violationStats.total ?? 0
          }
          description={
            `${violationStats.unresolved ?? 0} unresolved`
          }
        />


        <StatCard
          icon={Package}
          title="Products"
          value={
            loading
              ? "..."
              : products.total ?? 0
          }
          description={
            `${evidence.total_images ?? 0} evidence images`
          }
        />

      </div>


      {/* SECONDARY STATS */}

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

        <InfoCard
          title="Completed"
          value={inspections.completed}
        />

        <InfoCard
          title="Draft"
          value={inspections.draft}
        />

        <InfoCard
          title="Processing"
          value={inspections.processing}
        />

        <InfoCard
          title="Review Required"
          value={compliance.review_required}
        />

      </div>


      {/* COMPLIANCE SUMMARY */}

      <div className="grid gap-6 lg:grid-cols-3">


        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-semibold text-slate-950">
                Compliance Overview
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Current compliance status
              </p>

            </div>

            <CheckCircle2
              size={20}
              className="text-green-600"
            />

          </div>


          <div className="mt-6 grid gap-4 sm:grid-cols-3">

            <ComplianceBox
              title="Compliant"
              value={compliance.compliant}
              type="success"
            />

            <ComplianceBox
              title="Non-Compliant"
              value={compliance.non_compliant}
              type="danger"
            />

            <ComplianceBox
              title="Review Required"
              value={compliance.review_required}
              type="warning"
            />

          </div>


          <div className="mt-6 rounded-xl bg-slate-50 p-5">

            <div className="flex items-center justify-between">

              <span className="text-sm font-medium text-slate-600">
                Average Compliance Score
              </span>

              <span className="text-2xl font-bold text-slate-950">
                {Number(
                  compliance.average_score || 0
                ).toFixed(1)}%
              </span>

            </div>


            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">

              <div
                className="h-full rounded-full bg-blue-600 transition-all"
                style={{
                  width: `${Math.min(
                    Math.max(
                      Number(
                        compliance.average_score || 0
                      ),
                      0
                    ),
                    100
                  )}%`
                }}
              />

            </div>

          </div>

        </div>


        {/* VIOLATIONS */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="font-semibold text-slate-950">
                Violations
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Current violation status
              </p>

            </div>

            <AlertTriangle
              size={20}
              className="text-amber-500"
            />

          </div>


          <div className="mt-6 space-y-4">

            <ViolationRow
              label="Total"
              value={violationStats.total}
            />

            <ViolationRow
              label="Unresolved"
              value={violationStats.unresolved}
            />

            <ViolationRow
              label="Resolved"
              value={violationStats.resolved}
            />

          </div>


          <button
            type="button"
            onClick={() =>
              navigate("/inspections")
            }
            className="mt-6 w-full rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50"
          >
            View Inspections
          </button>

        </div>

      </div>


      {/* RECENT INSPECTIONS */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">

          <div>

            <h2 className="font-semibold text-slate-950">
              Recent Inspections
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Latest inspections
            </p>

          </div>


          <button
            type="button"
            onClick={() =>
              navigate("/inspections")
            }
            className="flex items-center gap-2 text-xs font-bold text-blue-600"
          >

            View All

            <FileText size={14} />

          </button>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[700px]">

            <thead>

              <tr className="border-b border-slate-100 bg-slate-50">

                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                  Inspection
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                  Product
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                  Status
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                  Score
                </th>

                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-400">
                  Date
                </th>

              </tr>

            </thead>


            <tbody>

              {recentInspections.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center"
                  >

                    <div className="flex flex-col items-center">

                      <ScanLine
                        size={28}
                        className="text-slate-300"
                      />

                      <p className="mt-3 text-sm font-semibold text-slate-500">
                        No inspections found
                      </p>

                      <Link
                        to="/new-inspection"
                        className="mt-2 text-xs font-semibold text-blue-600"
                      >
                        Create an inspection
                      </Link>

                    </div>

                  </td>

                </tr>

              ) : (

                recentInspections.map(
                  (item, index) => {

                    const id =
                      item.id ||
                      item.inspection_id ||
                      index;


                    return (
                      <tr
                        key={id}
                        className="border-b border-slate-50 hover:bg-slate-50"
                      >

                        <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                          {item.inspection_number ||
                            item.id ||
                            "—"}
                        </td>


                        <td className="px-6 py-4 text-xs text-slate-600">
                          {item.product_name ||
                            item.product ||
                            "—"}
                        </td>


                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${
                              getStatusClass(
                                item
                              )
                            }`}
                          >
                            {getStatusText(
                              item
                            )}
                          </span>

                        </td>


                        <td className="px-6 py-4 text-xs font-bold text-slate-700">
                          {formatScore(
                            item.compliance_score
                          )}
                        </td>


                        <td className="px-6 py-4 text-xs text-slate-400">
                          {formatDate(
                            item.created_at
                          )}
                        </td>

                      </tr>
                    );

                  }
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* QUICK ACTIONS */}

      <div className="grid gap-4 md:grid-cols-3">

        <QuickAction
          to="/new-inspection"
          icon={ScanLine}
          title="Start Inspection"
          text="Create a new product inspection."
        />

        <QuickAction
          to="/products"
          icon={Package}
          title="Products"
          text="View and manage registered products."
        />

        <QuickAction
          to="/reports"
          icon={FileText}
          title="Reports"
          text="View generated compliance reports."
        />

      </div>

    </div>
  );
}


/* =====================================================
   COMPONENTS
===================================================== */


function StatCard({
  icon: Icon,
  title,
  value,
  description
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

          <Icon size={20} />

        </div>

      </div>


      <p className="mt-5 text-xs font-medium text-slate-400">
        {title}
      </p>


      <p className="mt-1 text-3xl font-bold text-slate-950">
        {value}
      </p>


      <p className="mt-1 text-xs text-slate-400">
        {description}
      </p>

    </div>
  );
}


function InfoCard({
  title,
  value
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-xs font-medium text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-950">
        {Number(value || 0).toLocaleString()}
      </p>

    </div>
  );
}


function ComplianceBox({
  title,
  value,
  type
}) {
  const classes = {
    success:
      "bg-green-50 text-green-700",
    danger:
      "bg-red-50 text-red-700",
    warning:
      "bg-amber-50 text-amber-700"
  };


  return (
    <div
      className={`rounded-xl p-5 ${classes[type]}`}
    >

      <p className="text-xs font-semibold">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold">
        {Number(value || 0).toLocaleString()}
      </p>

    </div>
  );
}


function ViolationRow({
  label,
  value
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 pb-3">

      <span className="text-sm text-slate-500">
        {label}
      </span>

      <span className="text-sm font-bold text-slate-900">
        {Number(value || 0).toLocaleString()}
      </span>

    </div>
  );
}


function QuickAction({
  to,
  icon: Icon,
  title,
  text
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
    >

      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

        <Icon size={19} />

      </div>

      <h3 className="mt-4 text-sm font-bold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-400">
        {text}
      </p>

    </Link>
  );
}


/* =====================================================
   HELPERS
===================================================== */


function getArray(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}


function getStatusText(item) {
  const value =
    String(
      item?.compliance_status ||
      item?.status ||
      ""
    ).toLowerCase();


  if (
    value.includes("non") ||
    value.includes("fail")
  ) {
    return "Non-Compliant";
  }


  if (
    value.includes("compliant") ||
    value === "pass"
  ) {
    return "Compliant";
  }


  if (
    value.includes("processing")
  ) {
    return "Processing";
  }


  if (
    value.includes("complete")
  ) {
    return "Completed";
  }


  return "Review";
}


function getStatusClass(item) {
  const text =
    getStatusText(item);


  if (text === "Compliant") {
    return "bg-green-50 text-green-700";
  }


  if (text === "Non-Compliant") {
    return "bg-red-50 text-red-700";
  }


  if (text === "Processing") {
    return "bg-blue-50 text-blue-700";
  }


  return "bg-amber-50 text-amber-700";
}


function formatScore(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }


  const number =
    Number(value);


  if (Number.isNaN(number)) {
    return "—";
  }


  return `${number.toFixed(0)}%`;
}


function formatDate(value) {
  if (!value) {
    return "—";
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "—";
  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }
  );
}