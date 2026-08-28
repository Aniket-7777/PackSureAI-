import {
  Camera,
  Upload,
  ImagePlus,
  X,
  ScanLine,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Package,
  MapPin,
  Sparkles
} from "lucide-react";

import { motion } from "framer-motion";

import { useRef, useState } from "react";

import {
  createInspection,
  uploadEvidence,
  processOCR,
  runCompliance
} from "../api";

import { useNavigate } from "react-router-dom";

import BarcodeScanner from "../components/barcodescanner";


const imageTypes = [
  {
    id: "front",
    title: "Front Label",
    description: "Main product declaration"
  },
  {
    id: "back",
    title: "Back Label",
    description: "Mandatory declarations"
  },
  {
    id: "side",
    title: "Side / Package",
    description: "Additional information"
  },
  {
    id: "mrp",
    title: "MRP Label",
    description: "MRP and price declaration"
  }
];


export default function ScanProduct() {

  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  const cameraInputRef = useRef(null);


  const [images, setImages] = useState({});

  const [activeType, setActiveType] = useState("front");

  const [productName, setProductName] = useState("");

  const [category, setCategory] = useState("");

  const [location, setLocation] = useState("");

  const [batchNumber, setBatchNumber] = useState("");

  const [barcode, setBarcode] = useState("");

  const [scannerOpen, setScannerOpen] = useState(false);

  const [analyzing, setAnalyzing] = useState(false);


  const handleFiles = (files) => {

    if (!files || files.length === 0) {
      return;
    }

    const file = files[0];

    if (!file.type.startsWith("image/")) {
      return;
    }

    const preview = URL.createObjectURL(file);

    setImages((previous) => ({
      ...previous,
      [activeType]: {
        file,
        preview
      }
    }));

  };


  const handleUpload = (event) => {

    handleFiles(event.target.files);

    event.target.value = "";

  };


  const handleCamera = (event) => {

    handleFiles(event.target.files);

    event.target.value = "";

  };


  const removeImage = (type) => {

    setImages((previous) => {

      const copy = {
        ...previous
      };

      delete copy[type];

      return copy;

    });

  };


  const startAnalysis = async () => {
  if (Object.keys(images).length === 0) {
    return;
  }

  setAnalyzing(true);

  try {
    /*
     * 1. Create inspection
     */

    const inspectionResponse =
      await createInspection({
        barcode: barcode || null,
        product_name: productName || null,
        category: category || null,
        location: location || null,
        batch_number: batchNumber || null
      });

    const inspection =
      inspectionResponse?.data ||
      inspectionResponse;

    const inspectionId =
      inspection?.id ||
      inspection?.inspection_id;

    if (!inspectionId) {
      throw new Error(
        "Inspection was created but no inspection ID was returned."
      );
    }

    /*
     * 2. Upload all captured evidence
     */

    const imageEntries =
      Object.entries(images);

    for (const [imageType, imageData] of imageEntries) {
      if (!imageData?.file) {
        continue;
      }

      await uploadEvidence({
        inspectionId,
        imageType,
        file: imageData.file
      });
    }

    /*
     * 3. Run OCR
     */

    await processOCR(
      inspectionId
    );

    /*
     * 4. Run compliance
     */

    await runCompliance(
      inspectionId
    );

    /*
     * 5. Open result page with the
     *    actual inspection ID.
     */

    navigate(
      `/scan-result?inspection_id=${encodeURIComponent(
        inspectionId
      )}`
    );

  } catch (error) {
    console.error(
      "Inspection processing failed:",
      error
    );

    window.alert(
      error?.message ||
      "Inspection processing failed. Please try again."
    );

  } finally {
    setAnalyzing(false);
  }
};


  const imageCount = Object.keys(images).length;


  return (

    <div className="space-y-7">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

        <div>

          <button
            onClick={() => navigate("/dashboard")}
            className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400 hover:text-blue-600"
          >

            <ArrowLeft size={14} />

            Back to Dashboard

          </button>


          <h1 className="text-3xl font-bold tracking-tight text-slate-950">
            New Inspection
          </h1>


          <p className="mt-2 text-sm text-slate-500">
            Capture package images and start an automated compliance analysis.
          </p>

        </div>


        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2.5">

          <ScanLine
            size={17}
            className="text-blue-600"
          />

          <span className="text-xs font-semibold text-blue-700">
            AI Inspection Ready
          </span>

        </div>

      </div>


      {/* PROGRESS */}

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

        <div className="flex items-center justify-between">

          <Step
            number="1"
            title="Capture Evidence"
            active
          />

          <div className="hidden h-px flex-1 bg-slate-200 mx-5 sm:block" />

          <Step
            number="2"
            title="AI Analysis"
          />

          <div className="hidden h-px flex-1 bg-slate-200 mx-5 sm:block" />

          <Step
            number="3"
            title="Result"
          />

        </div>

      </div>


      <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">


        {/* IMAGE SECTION */}

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          <div className="flex items-start justify-between">

            <div>

              <h2 className="font-semibold text-slate-950">
                Package Evidence
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Add images from different package angles.
              </p>

            </div>


            <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-[10px] font-semibold text-slate-500">

              {imageCount}/4 images

            </div>

          </div>


          {/* IMAGE TABS */}

          <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">

            {imageTypes.map((type) => {

              const selected =
                activeType === type.id;

              const uploaded =
                Boolean(images[type.id]);


              return (

                <button
                  key={type.id}
                  type="button"
                  onClick={() =>
                    setActiveType(type.id)
                  }
                  className={`relative rounded-xl border p-3 text-left transition ${
                    selected
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >

                  {uploaded && (

                    <CheckCircle2
                      size={14}
                      className="absolute right-2 top-2 text-green-500"
                    />

                  )}


                  <p
                    className={`text-xs font-semibold ${
                      selected
                        ? "text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    {type.title}
                  </p>


                  <p className="mt-1 text-[9px] leading-4 text-slate-400">
                    {type.description}
                  </p>

                </button>

              );

            })}

          </div>


          {/* IMAGE AREA */}

          <div className="mt-5">

            {images[activeType] ? (

              <div className="relative overflow-hidden rounded-2xl bg-slate-950">

                <img
                  src={images[activeType].preview}
                  alt={activeType}
                  className="h-[380px] w-full object-contain"
                />


                <div className="absolute left-4 top-4 rounded-lg bg-black/60 px-3 py-2 text-xs font-semibold text-white">
                  {
                    imageTypes.find(
                      (item) =>
                        item.id === activeType
                    )?.title
                  }
                </div>


                <button
                  type="button"
                  onClick={() =>
                    removeImage(activeType)
                  }
                  className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-xl bg-red-500 text-white"
                >

                  <X size={17} />

                </button>

              </div>

            ) : (

              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-6 py-14 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">

                  <ImagePlus size={28} />

                </div>


                <h3 className="mt-5 font-semibold text-slate-800">

                  Add{" "}

                  {
                    imageTypes.find(
                      (item) =>
                        item.id === activeType
                    )?.title
                  }

                </h3>


                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-slate-400">

                  Upload a clear image of the package.
                  Make sure the declarations are readable.

                </p>


                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">

                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-xs font-semibold text-white"
                  >

                    <Upload size={16} />

                    Upload Image

                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      cameraInputRef.current?.click()
                    }
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-700"
                  >

                    <Camera size={16} />

                    Use Camera

                  </button>

                </div>

              </div>

            )}

          </div>


          {/* FILE INPUTS */}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
          />


          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCamera}
          />


          {/* TIP */}

          <div className="mt-5 rounded-xl bg-blue-50 p-4">

            <div className="flex gap-3">

              <Sparkles
                size={17}
                className="shrink-0 text-blue-600"
              />

              <div>

                <p className="text-xs font-semibold text-blue-800">
                  Better image = better detection
                </p>

                <p className="mt-1 text-[10px] leading-5 text-blue-600/80">
                  Avoid glare and keep mandatory declarations clearly visible.
                </p>

              </div>

            </div>

          </div>

        </div>


        {/* RIGHT PANEL */}

        <div className="space-y-6">


          {/* BARCODE */}

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">

            <div className="flex items-start justify-between gap-4">

              <div>

                <div className="flex items-center gap-2">

                  <ScanLine
                    size={17}
                    className="text-blue-600"
                  />

                  <p className="text-sm font-bold text-blue-800">
                    Product Barcode
                  </p>

                </div>


                <p className="mt-1 text-[10px] leading-5 text-blue-600/70">
                  Scan the product barcode to identify the commodity.
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  setScannerOpen(true)
                }
                className="flex shrink-0 items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-[10px] font-bold text-white"
              >

                <Camera size={14} />

                Scan

              </button>

            </div>


            {barcode && (

              <div className="mt-3 flex items-center justify-between rounded-lg bg-white px-3 py-3">

                <div>

                  <p className="text-[9px] text-slate-400">
                    Detected Barcode
                  </p>

                  <p className="mt-1 font-mono text-xs font-bold text-slate-800">
                    {barcode}
                  </p>

                </div>


                <CheckCircle2
                  size={18}
                  className="text-green-500"
                />

              </div>

            )}

          </div>


          {/* PRODUCT INFO */}

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                <Package size={19} />

              </div>


              <div>

                <h2 className="font-semibold text-slate-950">
                  Product Information
                </h2>

                <p className="text-[10px] text-slate-400">
                  Optional fields
                </p>

              </div>

            </div>


            <div className="mt-6 space-y-4">


              <InputField
                label="Product Name"
                placeholder="e.g. Packaged Food"
                value={productName}
                onChange={setProductName}
              />


              <div>

                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Product Category
                </label>

                <select
                  value={category}
                  onChange={(event) =>
                    setCategory(event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-700 outline-none focus:border-blue-500"
                >

                  <option value="">
                    Select category
                  </option>

                  <option>
                    Food & Beverage
                  </option>

                  <option>
                    Cosmetics
                  </option>

                  <option>
                    Household Products
                  </option>

                  <option>
                    Electronics
                  </option>

                  <option>
                    Garments
                  </option>

                  <option>
                    Other
                  </option>

                </select>

              </div>


              <InputField
                label="Batch / Lot Number"
                placeholder="Optional"
                value={batchNumber}
                onChange={setBatchNumber}
              />


              <div>

                <label className="mb-2 block text-xs font-semibold text-slate-700">
                  Inspection Location
                </label>

                <div className="relative">

                  <MapPin
                    size={16}
                    className="absolute left-3.5 top-3.5 text-slate-400"
                  />

                  <input
                    value={location}
                    onChange={(event) =>
                      setLocation(event.target.value)
                    }
                    placeholder="e.g. Ghaziabad"
                    className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
                  />

                </div>

              </div>

            </div>

          </div>


          {/* ANALYSIS */}

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">

                <Sparkles size={19} />

              </div>


              <div>

                <h3 className="font-semibold text-slate-900">
                  AI Compliance Analysis
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Detect declarations, extract text and validate LMPC requirements.
                </p>

              </div>

            </div>


            <div className="mt-5 space-y-2">

              <AnalysisItem text="Label detection" />

              <AnalysisItem text="OCR declaration extraction" />

              <AnalysisItem text="Mandatory field validation" />

              <AnalysisItem text="LMPC rule verification" />

            </div>


            <button
              type="button"
              disabled={
                imageCount === 0 ||
                analyzing
              }
              onClick={startAnalysis}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >

              {analyzing ? (

                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                  Analyzing Package...

                </>

              ) : (

                <>
                  <ScanLine size={17} />

                  Start AI Inspection

                  <ArrowRight size={16} />

                </>

              )}

            </button>


            {imageCount === 0 && (

              <p className="mt-3 text-center text-[10px] text-slate-400">
                Add at least one package image to continue.
              </p>

            )}

          </div>

        </div>

      </div>


      {/* BARCODE SCANNER */}

      {scannerOpen && (

        <BarcodeScanner
          onDetected={(text) => {
            setBarcode(text);
            setScannerOpen(false);
          }}
          onClose={() => {
            setScannerOpen(false);
          }}
        />

      )}

    </div>

  );
}


function Step({
  number,
  title,
  active = false
}) {

  return (

    <div
      className={`flex items-center gap-3 ${
        active ? "" : "opacity-40"
      }`}
    >

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold ${
          active
            ? "bg-blue-600 text-white"
            : "border border-slate-300 text-slate-500"
        }`}
      >
        {number}
      </div>

      <div className="hidden sm:block">

        <p className="text-sm font-semibold text-slate-700">
          {title}
        </p>

      </div>

    </div>

  );
}


function InputField({
  label,
  placeholder,
  value,
  onChange
}) {

  return (

    <div>

      <label className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500"
      />

    </div>

  );
}


function AnalysisItem({
  text
}) {

  return (

    <div className="flex items-center gap-2.5">

      <CheckCircle2
        size={14}
        className="text-blue-600"
      />

      <span className="text-[11px] font-medium text-slate-600">
        {text}
      </span>

    </div>

  );
}