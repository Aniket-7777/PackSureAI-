import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Package,
  ScanLine
} from "lucide-react";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  createInspection,
  getProductByBarcode
} from "../api";

import BarcodeScanner from "../components/barcodescanner";


export default function NewInspection() {
  const navigate = useNavigate();

  const [barcode, setBarcode] =
    useState("");

  const [productName, setProductName] =
    useState("");

  const [category, setCategory] =
    useState("");

  const [location, setLocation] =
    useState("");

  const [batchNumber, setBatchNumber] =
    useState("");

  const [scannerOpen, setScannerOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [productFound, setProductFound] =
    useState(false);


  async function handleBarcode(value) {
    const cleanBarcode =
      String(value || "").trim();

    if (!cleanBarcode) {
      return;
    }

    setBarcode(cleanBarcode);
    setScannerOpen(false);
    setError("");

    try {
      const product =
        await getProductByBarcode(
          cleanBarcode
        );

      if (!product) {
        setProductFound(false);
        return;
      }

      setProductFound(true);

      setProductName(
        product.product_name ||
        product.name ||
        ""
      );

      setCategory(
        product.category ||
        ""
      );

    } catch (err) {
      console.error(
        "Product lookup failed:",
        err
      );

      setError(
        err?.message ||
        "Unable to lookup product."
      );
    }
  }


  async function handleCreateInspection() {
    setError("");

    if (!barcode.trim()) {
      setError(
        "Please scan or enter a barcode."
      );
      return;
    }

    if (!productName.trim()) {
      setError(
        "Please enter the product name."
      );
      return;
    }

    setLoading(true);

    try {
      const response =
        await createInspection({
          barcode: barcode.trim(),
          product_name:
            productName.trim(),
          category:
            category.trim() || null,
          location:
            location.trim() || null,
          batch_number:
            batchNumber.trim() || null
        });

      const inspection =
        response?.data ||
        response;

      const inspectionId =
        inspection?.id ||
        inspection?.inspection_id;

      if (!inspectionId) {
        throw new Error(
          "Inspection created but no inspection ID was returned."
        );
      }

      navigate(
        `/scan?inspection_id=${encodeURIComponent(
          inspectionId
        )}`
      );

    } catch (err) {
      console.error(
        "Inspection creation failed:",
        err
      );

      setError(
        err?.message ||
        "Failed to create inspection."
      );

    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="mx-auto max-w-4xl space-y-6">

      <div>

        <button
          onClick={() =>
            navigate("/dashboard")
          }
          className="mb-4 flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Back to Dashboard
        </button>


        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ScanLine size={21} />
          </div>

          <div>

            <h1 className="text-2xl font-bold text-slate-950">
              New Inspection
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Create an inspection before capturing product evidence.
            </p>

          </div>

        </div>

      </div>


      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}


      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <div className="mb-6 flex items-center gap-3">

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <Package size={19} />
          </div>

          <div>

            <h2 className="font-semibold text-slate-950">
              Product Information
            </h2>

            <p className="text-xs text-slate-400">
              Scan the product barcode and verify its details.
            </p>

          </div>

        </div>


        {/* BARCODE */}

        <div>

          <label className="mb-2 block text-xs font-semibold text-slate-600">
            Barcode
          </label>

          <div className="flex gap-2">

            <input
              value={barcode}
              onChange={(event) =>
                setBarcode(
                  event.target.value
                )
              }
              placeholder="Enter barcode"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <button
              type="button"
              onClick={() =>
                setScannerOpen(true)
              }
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-xs font-bold text-white hover:bg-blue-700"
            >
              <ScanLine size={16} />
              Scan
            </button>

          </div>


          {productFound && (
            <p className="mt-2 text-xs font-semibold text-green-600">
              Product found in database.
            </p>
          )}

        </div>


        {/* PRODUCT */}

        <div className="mt-5 grid gap-5 md:grid-cols-2">

          <div>

            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Product Name
            </label>

            <input
              value={productName}
              onChange={(event) =>
                setProductName(
                  event.target.value
                )
              }
              placeholder="Product name"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>


          <div>

            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Category
            </label>

            <input
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target.value
                )
              }
              placeholder="e.g. Packaged Food"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

          </div>


          <div>

            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Location
            </label>

            <div className="relative">

              <MapPin
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value
                  )
                }
                placeholder="Inspection location"
                className="w-full rounded-xl border border-slate-200 py-3 pl-9 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

            </div>

          </div>


          <div>

            <label className="mb-2 block text-xs font-semibold text-slate-600">
              Batch Number
            </label>

            <input
              value={batchNumber}
              onChange={(event) =>
                setBatchNumber(
                  event.target.value
                )
              }
              placeholder="Optional"
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2  focus:ring-blue-100"
            />

          </div>

        </div>


        {/* ACTION */}

        <div className="mt-8 flex justify-end">

          <button
            type="button"
            disabled={loading}
            onClick={handleCreateInspection}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >

            {loading
              ? "Creating..."
              : "Continue to Evidence Capture"}

            {!loading && (
              <ArrowRight size={17} />
            )}

          </button>

        </div>

      </div>


      {/* SCANNER */}

      {scannerOpen && (
        <BarcodeScanner
          onDetected={handleBarcode}
          onClose={() =>
            setScannerOpen(false)
          }
        />
      )}

    </div>
  );
}