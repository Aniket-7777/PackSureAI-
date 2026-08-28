import {
  Search,
  Plus,
  Eye,
  Trash2,
  RefreshCw,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getInspections,
  deleteInspection
} from "../api";


export default function Inspections() {
  const navigate = useNavigate();

  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);


  async function loadInspections() {
    setLoading(true);
    setError("");

    try {
      const response = await getInspections();

      const data =
        response?.data ??
        response ??
        [];

      setInspections(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (err) {
      console.error(
        "Failed to load inspections:",
        err
      );

      setError(
        err?.message ||
        "Failed to load inspections."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadInspections();
  }, []);


  const filteredInspections = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    return inspections.filter(
      (inspection) => {
        const text = [
          inspection.inspection_number,
          inspection.id,
          inspection.barcode,
          inspection.product_name,
          inspection.status,
          inspection.compliance_status
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query ||
          text.includes(query);

        const status =
          String(
            inspection.status || ""
          ).toLowerCase();

        const matchesStatus =
          statusFilter === "all" ||
          status === statusFilter;

        return (
          matchesSearch &&
          matchesStatus
        );
      }
    );
  }, [
    inspections,
    search,
    statusFilter
  ]);


  async function confirmDelete() {
    if (!deleteTarget?.id) {
      return;
    }

    setDeleting(true);

    try {
      await deleteInspection(
        deleteTarget.id
      );

      setInspections(
        (previous) =>
          previous.filter(
            (item) =>
              item.id !==
              deleteTarget.id
          )
      );

      setDeleteTarget(null);

    } catch (err) {
      setError(
        err?.message ||
        "Unable to delete inspection."
      );

    } finally {
      setDeleting(false);
    }
  }


  function openInspection(inspection) {
    const id =
      inspection.id ||
      inspection.inspection_id;

    if (!id) {
      return;
    }

    const status =
      String(
        inspection.status || ""
      ).toLowerCase();

    if (
      status === "completed" ||
      status === "failed" ||
      status === "review_required"
    ) {
      navigate(
        `/scan-result?inspection_id=${encodeURIComponent(id)}`
      );
      return;
    }

    navigate(
      `/scan?inspection_id=${encodeURIComponent(id)}`
    );
  }


  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <p className="text-sm font-medium text-blue-600">
            Inspection Management
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
            Inspections
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            View, continue and manage packaged commodity inspections.
          </p>

        </div>


        <button
          onClick={() =>
            navigate("/new-inspection")
          }
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
        >
          <Plus size={17} />
          New Inspection
        </button>

      </div>


      {/* ERROR */}

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3">

          <div className="flex items-center gap-2 text-sm font-medium text-red-700">
            <AlertTriangle size={16} />
            {error}
          </div>

          <button
            onClick={() => setError("")}
            className="text-red-500"
          >
            <X size={16} />
          </button>

        </div>
      )}


      {/* SUMMARY */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <Summary
          label="Total"
          value={inspections.length}
          icon={ClipboardList}
        />

        <Summary
          label="Completed"
          value={
            inspections.filter(
              (item) =>
                item.status ===
                "completed"
            ).length
          }
          icon={CheckCircle2}
        />

        <Summary
          label="Processing"
          value={
            inspections.filter(
              (item) =>
                item.status ===
                "processing"
            ).length
          }
          icon={Clock}
        />

        <Summary
          label="Failed"
          value={
            inspections.filter(
              (item) =>
                item.status ===
                "failed"
            ).length
          }
          icon={AlertTriangle}
        />

      </div>


      {/* FILTERS */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        <div className="flex flex-col gap-3 lg:flex-row">

          <div className="relative flex-1">

            <Search
              size={17}
              className="absolute left-3.5 top-3.5 text-slate-400"
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="Search inspection, barcode, product..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
            />

          </div>


          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">
              All Status
            </option>

            <option value="draft">
              Draft
            </option>

            <option value="processing">
              Processing
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="review_required">
              Review Required
            </option>

            <option value="failed">
              Failed
            </option>
          </select>


          <button
            onClick={loadInspections}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
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

        </div>

      </div>


      {/* TABLE */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 px-6 py-5">

          <h2 className="font-semibold text-slate-950">
            Inspection Records
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {filteredInspections.length} record
            {filteredInspections.length !== 1
              ? "s"
              : ""}{" "}
            displayed
          </p>

        </div>


        <div className="overflow-x-auto">

          <table className="w-full min-w-[900px]">

            <thead>

              <tr className="border-b border-slate-100 bg-slate-50/70">

                <Header>
                  Inspection
                </Header>

                <Header>
                  Product
                </Header>

                <Header>
                  Barcode
                </Header>

                <Header>
                  Score
                </Header>

                <Header>
                  Compliance
                </Header>

                <Header>
                  Status
                </Header>

                <Header>
                  Actions
                </Header>

              </tr>

            </thead>


            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-16 text-center"
                  >
                    <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

                    <p className="mt-3 text-sm text-slate-500">
                      Loading inspections...
                    </p>
                  </td>
                </tr>

              ) : filteredInspections.length === 0 ? (

                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-16 text-center"
                  >

                    <ClipboardList
                      size={35}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 font-semibold text-slate-700">
                      No inspections found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      Create a new inspection to get started.
                    </p>

                    <button
                      onClick={() =>
                        navigate("/new-inspection")
                      }
                      className="mt-5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-blue-700"
                    >
                      Create Inspection
                    </button>

                  </td>
                </tr>

              ) : (

                filteredInspections.map(
                  (inspection) => (
                    <InspectionRow
                      key={inspection.id}
                      inspection={inspection}
                      onOpen={() =>
                        openInspection(
                          inspection
                        )
                      }
                      onDelete={() =>
                        setDeleteTarget(
                          inspection
                        )
                      }
                    />
                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* DELETE MODAL */}

      {deleteTarget && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 backdrop-blur-sm">

          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <Trash2 size={20} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-950">
              Delete inspection?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              This will permanently delete the inspection record.
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleting && (
                  <RefreshCw
                    size={15}
                    className="animate-spin"
                  />
                )}

                {deleting
                  ? "Deleting..."
                  : "Delete"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}


/* ---------------------------------------------
   Components
--------------------------------------------- */

function Header({ children }) {
  return (
    <th className="px-6 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {children}
    </th>
  );
}


function Summary({
  label,
  value,
  icon: Icon
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <p className="text-xs font-semibold text-slate-400">
          {label}
        </p>

        <Icon
          size={17}
          className="text-blue-600"
        />

      </div>

      <p className="mt-3 text-2xl font-bold text-slate-950">
        {value}
      </p>

    </div>
  );
}


function InspectionRow({
  inspection,
  onOpen,
  onDelete
}) {
  const score =
    inspection.compliance_score;

  const compliance =
    inspection.compliance_status ||
    "unknown";

  const status =
    inspection.status ||
    "unknown";

  return (
    <tr className="border-b border-slate-50 transition hover:bg-slate-50/70">

      <td className="px-6 py-4">

        <p className="font-mono text-xs font-bold text-slate-800">
          {inspection.inspection_number ||
            inspection.id}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          {formatDate(
            inspection.created_at
          )}
        </p>

      </td>


      <td className="px-6 py-4">

        <p className="text-sm font-semibold text-slate-800">
          {inspection.product_name ||
            "Product"}
        </p>

      </td>


      <td className="px-6 py-4">

        <p className="font-mono text-xs text-slate-600">
          {inspection.barcode ||
            "—"}
        </p>

      </td>


      <td className="px-6 py-4">

        <span className="text-sm font-bold text-slate-800">
          {score !== null &&
          score !== undefined
            ? `${Number(score).toFixed(1)}%`
            : "—"}
        </span>

      </td>


      <td className="px-6 py-4">
        <Status
          value={compliance}
        />
      </td>


      <td className="px-6 py-4">
        <Status
          value={status}
        />
      </td>


      <td className="px-6 py-4">

        <div className="flex items-center gap-2">

          <button
            onClick={onOpen}
            title="Open inspection"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
          >
            <Eye size={16} />
          </button>

          <button
            onClick={onDelete}
            title="Delete inspection"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 size={16} />
          </button>

        </div>

      </td>

    </tr>
  );
}


function Status({ value }) {
  const status =
    String(value || "unknown")
      .toLowerCase();

  const isGood =
    status === "completed" ||
    status === "compliant" ||
    status === "pass";

  const isBad =
    status === "failed" ||
    status === "non_compliant" ||
    status === "fail";

  const className =
    isGood
      ? "bg-green-50 text-green-700"
      : isBad
        ? "bg-red-50 text-red-700"
        : "bg-yellow-50 text-yellow-700";

  return (
    <span
      className={`inline-flex rounded-md px-2.5 py-1 text-[9px] font-bold uppercase ${className}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}


function formatDate(value) {
  if (!value) {
    return "Date unavailable";
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return date.toLocaleString();
}