import {
  ArrowLeft,
  Download,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Package,
  RefreshCw
} from "lucide-react";

import {
  useEffect,
  useState
} from "react";

import {
  useLocation,
  useNavigate
} from "react-router-dom";

import {
  getInspectionReport,
  getInspectionReportPdfUrl
} from "../api";


export default function Report() {
  const navigate = useNavigate();
  const location = useLocation();

  const inspectionId =
    new URLSearchParams(
      location.search
    ).get("inspection_id");

  const [report, setReport] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");


  async function loadReport() {
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
      const response =
        await getInspectionReport(
          inspectionId
        );

      setReport(
        response?.data ||
        response
      );

    } catch (err) {
      console.error(
        "Report loading failed:",
        err
      );

      setError(
        err?.message ||
        "Unable to load inspection report."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    loadReport();
  }, [inspectionId]);


  function downloadPdf() {
    if (!inspectionId) {
      return;
    }

    const url =
      getInspectionReportPdfUrl(
        inspectionId
      );

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }


  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

          <p className="mt-4 text-sm font-semibold text-slate-700">
            Loading inspection report...
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
                Unable to load report
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

            </div>

          </div>


          <button
            onClick={loadReport}
            className="mt-5 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white"
          >
            <RefreshCw size={14} />
            Retry
          </button>

        </div>

      </div>
    );
  }


  const product =
    report?.product ||
    {};

  const compliance =
    report?.compliance ||
    {};

  const results =
    Array.isArray(compliance?.results)
      ? compliance.results
      : [];

  const violations =
    Array.isArray(report?.violations)
      ? report.violations
      : [];

  const ocr =
    report?.ocr ||
    {};

  const extractedFields =
    Array.isArray(
      ocr?.extracted_fields
    )
      ? ocr.extracted_fields
      : [];


  const passed =
    results.filter(
      (item) =>
        String(
          item.status ||
          item.result ||
          ""
        ).toLowerCase()
          .includes("pass")
    ).length;


  const failed =
    results.filter(
      (item) =>
        String(
          item.status ||
          item.result ||
          ""
        ).toLowerCase()
          .includes("fail")
    ).length;


  const review =
    Math.max(
      results.length -
      passed -
      failed,
      0
    );


  const latestRun =
    report?.latest_compliance_run;


  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <button
            onClick={() =>
              navigate(
                `/scan-result?inspection_id=${encodeURIComponent(
                  inspectionId
                )}`
              )
            }
            className="mb-3 flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-600"
          >
            <ArrowLeft size={14} />
            Back to Result
          </button>


          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
              <FileText size={22} />
            </div>

            <div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                Inspection Report
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Complete packaged commodity compliance report.
              </p>

            </div>

          </div>

        </div>


        <button
          onClick={downloadPdf}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-blue-600/20 hover:bg-blue-700"
        >
          <Download size={16} />
          Download PDF
        </button>

      </div>


      {/* PRODUCT */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Package size={19} />
          </div>

          <div>

            <h2 className="font-semibold text-slate-950">
              Product Information
            </h2>

            <p className="text-xs text-slate-400">
              Information detected during inspection.
            </p>

          </div>

        </div>


        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <ReportField
            label="Product Name"
            value={product.product_name}
          />

          <ReportField
            label="Brand"
            value={product.brand_name}
          />

          <ReportField
            label="Barcode"
            value={product.barcode}
          />

          <ReportField
            label="Net Quantity"
            value={
              product.net_quantity
                ? `${product.net_quantity} ${product.unit || ""}`
                : null
            }
          />

          <ReportField
            label="MRP"
            value={product.mrp}
          />

          <ReportField
            label="Manufacturer"
            value={product.manufacturer_name}
          />

          <ReportField
            label="Packer"
            value={product.packer_name}
          />

          <ReportField
            label="Importer"
            value={product.importer_name}
          />

        </div>

      </section>


      {/* COMPLIANCE SUMMARY */}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <SummaryCard
          label="Rules Checked"
          value={results.length}
          icon={FileText}
        />

        <SummaryCard
          label="Passed"
          value={passed}
          icon={CheckCircle2}
        />

        <SummaryCard
          label="Failed"
          value={failed}
          icon={AlertTriangle}
        />

        <SummaryCard
          label="Review"
          value={review}
          icon={RefreshCw}
        />

      </section>


      {/* COMPLIANCE RESULTS */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-6">

          <h2 className="font-semibold text-slate-950">
            Compliance Results
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Rules evaluated during this inspection.
          </p>

        </div>


        {results.length === 0 ? (

          <div className="p-10 text-center text-sm text-slate-400">
            No compliance results available.
          </div>

        ) : (

          <div className="divide-y divide-slate-100">

            {results.map(
              (result, index) => (
                <ComplianceRow
                  key={
                    result.id ||
                    result.rule_id ||
                    index
                  }
                  result={result}
                />
              )
            )}

          </div>

        )}

      </section>


      {/* VIOLATIONS */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-100 p-6">

          <div>

            <h2 className="font-semibold text-slate-950">
              Violations
            </h2>

            <p className="mt-1 text-xs text-slate-400">
              Non-compliance detected during inspection.
            </p>

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
              (violation, index) => (
                <div
                  key={
                    violation.id ||
                    violation.violation_code ||
                    index
                  }
                  className="p-5"
                >

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      {violation.violation_code ||
                        "VIOLATION"}
                    </span>

                    <span className="rounded-md bg-red-50 px-2 py-1 text-[9px] font-bold uppercase text-red-700">
                      {violation.severity ||
                        "medium"}
                    </span>

                  </div>

                  <h3 className="mt-2 text-sm font-semibold text-slate-900">
                    {violation.violation_title ||
                      "Compliance violation"}
                  </h3>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">

                    <ReportField
                      label="Detected Value"
                      value={
                        violation.detected_value
                      }
                    />

                    <ReportField
                      label="Expected"
                      value={
                        violation.expected_value
                      }
                    />

                  </div>

                </div>
              )
            )}

          </div>

        )}

      </section>


      {/* OCR */}

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-100 p-6">

          <h2 className="font-semibold text-slate-950">
            OCR Extracted Fields
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Information extracted from package evidence.
          </p>

        </div>


        {extractedFields.length === 0 ? (

          <div className="p-10 text-center text-sm text-slate-400">
            No OCR fields available.
          </div>

        ) : (

          <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">

            {extractedFields.map(
              (field, index) => {

                const label =
                  field.label ||
                  field.name ||
                  field.key ||
                  `Field ${index + 1}`;

                const value =
                  field.value ??
                  field.text ??
                  field.detected_value ??
                  "Not detected";

                return (
                  <ReportField
                    key={`${label}-${index}`}
                    label={label}
                    value={value}
                  />
                );
              }
            )}

          </div>

        )}

      </section>


      {/* RUN INFO */}

      {latestRun && (

        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Compliance Run
          </p>

          <p className="mt-1 font-mono text-xs text-slate-600">
            {latestRun.id}
          </p>

        </section>

      )}


      {/* DOWNLOAD */}

      <div className="flex justify-end">

        <button
          onClick={downloadPdf}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-bold text-white hover:bg-blue-700"
        >
          <Download size={16} />
          Download Compliance PDF
        </button>

      </div>

    </div>
  );
}


/* ---------------------------------------------
   Components
--------------------------------------------- */

function ReportField({
  label,
  value
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">

      <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-semibold text-slate-700">
        {value !== null &&
        value !== undefined &&
        String(value).trim()
          ? String(value)
          : "Not available"}
      </p>

    </div>
  );
}


function SummaryCard({
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


function ComplianceRow({
  result
}) {
  const raw =
    result.status ||
    result.result ||
    result.compliance_status ||
    "";

  const status =
    String(raw).toLowerCase();

  const passed =
    status.includes("pass") ||
    status.includes("compliant");

  const failed =
    status.includes("fail") ||
    status.includes("non");

  const badge =
    passed
      ? "bg-green-50 text-green-700"
      : failed
        ? "bg-red-50 text-red-700"
        : "bg-yellow-50 text-yellow-700";

  return (
    <div className="p-5">

      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">

        <div>

          <p className="font-mono text-[10px] font-bold text-slate-400">
            {result.rule_code ||
              result.rule_id ||
              "RULE"}
          </p>

          <h3 className="mt-1 text-sm font-semibold text-slate-900">
            {result.rule_title ||
              result.rule_name ||
              result.title ||
              "Compliance Rule"}
          </h3>

        </div>

        <span
          className={`rounded-md px-2.5 py-1.5 text-[9px] font-bold uppercase ${badge}`}
        >
          {raw || "REVIEW"}
        </span>

      </div>


      {(result.detected_value !==
        undefined ||
        result.expected_value !==
        undefined) && (

        <div className="mt-3 grid gap-3 sm:grid-cols-2">

          <ReportField
            label="Detected"
            value={
              result.detected_value
            }
          />

          <ReportField
            label="Expected"
            value={
              result.expected_value
            }
          />

        </div>

      )}

    </div>
  );
}