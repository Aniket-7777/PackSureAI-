import {
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  FileText,
  Package,
  RefreshCw
} from "lucide-react";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getInspection,
  getInspectionViolations
} from "../api";


export default function ScanResult() {
  const navigate = useNavigate();
  const location = useLocation();

  const [inspection, setInspection] =
    useState(null);

  const [violations, setViolations] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const inspectionId =
    new URLSearchParams(
      location.search
    ).get("inspection_id");


  async function loadResult() {
    if (!inspectionId) {
      setError(
        "No inspection ID was provided."
      );
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const inspectionResponse =
        await getInspection(
          inspectionId
        );

      const inspectionData =
        inspectionResponse?.data ||
        inspectionResponse;

      setInspection(
        inspectionData
      );


      const violationsResponse =
        await getInspectionViolations(
          inspectionId
        );

      const violationData =
        violationsResponse?.data ||
        violationsResponse;

      setViolations(
        Array.isArray(violationData)
          ? violationData
          : []
      );

    } catch (err) {
      console.error(
        "Failed to load inspection result:",
        err
      );

      setError(
        err?.message ||
        "Unable to load inspection result."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadResult();
  }, [inspectionId]);


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading inspection result...
          </p>

        </div>

      </div>
    );
  }


  if (error) {
    return (
      <div className="space-y-5">

        <button
          onClick={() =>
            navigate("/dashboard")
          }
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>


        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <div className="flex items-start gap-3">

            <AlertTriangle
              size={20}
              className="mt-0.5 text-red-600"
            />

            <div>

              <h2 className="font-bold text-red-900">
                Unable to load result
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

            </div>

          </div>


          <button
            onClick={loadResult}
            className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white"
          >
            <RefreshCw size={14} />
            Retry
          </button>

        </div>

      </div>
    );
  }


  const score = Number(
    inspection?.compliance_score ?? 0
  );

  const status =
    inspection?.compliance_status ||
    "unknown";

  const compliant =
    status === "compliant";


  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-600"
          >
            <ArrowLeft size={14} />
            Back to Dashboard
          </button>


          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            Inspection Result
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            AI-powered packaged commodity compliance analysis.
          </p>

        </div>


        <button
          onClick={loadResult}
          className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw size={14} />
          Refresh
        </button>

      </div>


      {/* SCORE */}

      <div className="grid gap-5 md:grid-cols-3">

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:col-span-2">

          <div className="flex items-center gap-4">

            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                compliant
                  ? "bg-green-50 text-green-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {compliant ? (
                <CheckCircle2 size={28} />
              ) : (
                <AlertTriangle size={28} />
              )}
            </div>


            <div>

              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Compliance Status
              </p>

              <h2
                className={`mt-1 text-2xl font-bold ${
                  compliant
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {String(status)
                  .replaceAll(
                    "_",
                    " "
                  )
                  .toUpperCase()}
              </h2>

            </div>

          </div>


          <div className="mt-7">

            <div className="flex items-end justify-between">

              <span className="text-sm font-semibold text-slate-600">
                Compliance Score
              </span>

              <span className="text-3xl font-bold text-slate-950">
                {score.toFixed(2)}%
              </span>

            </div>


            <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">

              <div
                className={`h-full rounded-full ${
                  compliant
                    ? "bg-green-500"
                    : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(
                    Math.max(
                      score,
                      0
                    ),
                    100
                  )}%`
                }}
              />

            </div>

          </div>

        </div>


        {/* INSPECTION */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Package size={19} />
            </div>

            <div>

              <p className="text-xs text-slate-400">
                Inspection
              </p>

              <p className="font-semibold text-slate-900">
                {inspection?.inspection_number ||
                  "Inspection"}
              </p>

            </div>

          </div>


          <div className="mt-6 space-y-3">

            <InfoRow
              label="Product"
              value={
                inspection?.product_name ||
                "Not available"
              }
            />

            <InfoRow
              label="Barcode"
              value={
                inspection?.barcode ||
                "Not available"
              }
            />

            <InfoRow
              label="Status"
              value={
                inspection?.status ||
                "Unknown"
              }
            />

          </div>

        </div>

      </div>


      {/* VIOLATIONS */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 p-6">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <AlertTriangle size={19} />
            </div>

            <div>

              <h2 className="font-semibold text-slate-950">
                Detected Violations
              </h2>

              <p className="text-xs text-slate-400">
                Compliance issues identified during inspection.
              </p>

            </div>

          </div>


          <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">
            {violations.length}
          </span>

        </div>


        {violations.length === 0 ? (

          <div className="p-10 text-center">

            <CheckCircle2
              size={35}
              className="mx-auto text-green-500"
            />

            <p className="mt-3 font-semibold text-slate-800">
              No violations detected
            </p>

          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {violations.map(
              (violation) => (
                <ViolationRow
                  key={
                    violation.id ||
                    violation.violation_code
                  }
                  violation={violation}
                />
              )
            )}

          </div>

        )}

      </div>


      {/* REPORT */}

      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileText size={20} />
            </div>

            <div>

              <h3 className="font-semibold text-slate-900">
                Inspection Report
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                View the complete compliance report.
              </p>

            </div>

          </div>


          <button
            onClick={() =>
              navigate(
                `/report?inspection_id=${encodeURIComponent(
                  inspectionId
                )}`
              )
            }
            className="rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white hover:bg-blue-700"
          >
            View Full Report
          </button>

        </div>

      </div>

    </div>
  );
}


function InfoRow({
  label,
  value
}) {
  return (
    <div className="flex items-center justify-between gap-4">

      <span className="text-xs text-slate-400">
        {label}
      </span>

      <span className="max-w-[65%] truncate text-right text-xs font-semibold text-slate-700">
        {value}
      </span>

    </div>
  );
}


function ViolationRow({
  violation
}) {
  const severity =
    String(
      violation.severity || "medium"
    ).toLowerCase();

  const severityClass =
    severity === "high"
      ? "bg-red-50 text-red-700"
      : severity === "low"
        ? "bg-slate-100 text-slate-600"
        : "bg-yellow-50 text-yellow-700";

  return (
    <div className="p-5">

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

        <div>

          <div className="flex flex-wrap items-center gap-2">

            <span className="font-mono text-[10px] font-bold text-slate-400">
              {violation.violation_code}
            </span>

            <span
              className={`rounded-md px-2 py-1 text-[9px] font-bold uppercase ${severityClass}`}
            >
              {severity}
            </span>

          </div>

          <h3 className="mt-2 text-sm font-semibold text-slate-900">
            {violation.violation_title ||
              "Compliance violation"}
          </h3>

        </div>

      </div>


      <div className="mt-4 grid gap-3 sm:grid-cols-2">

        <div className="rounded-xl bg-slate-50 p-3">

          <p className="text-[9px] font-semibold uppercase text-slate-400">
            Detected Value
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-700">
            {violation.detected_value ??
              "Not detected"}
          </p>

        </div>


        <div className="rounded-xl bg-slate-50 p-3">

          <p className="text-[9px] font-semibold uppercase text-slate-400">
            Expected
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-700">
            {violation.expected_value ??
              "Requirement not available"}
          </p>

        </div>

      </div>

    </div>
  );
}