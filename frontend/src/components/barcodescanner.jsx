import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function BarcodeScanner({
  onDetected,
  onClose,
}) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const readerRef = useRef(null);
  const canvasRef = useRef(null);

  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState("");
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, []);

  // ---------------------------------------
  // START CAMERA
  // ---------------------------------------

  async function startCamera() {
    try {
      setError("");
      setCameraReady(false);

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: {
              ideal: "environment",
            },
            width: {
              ideal: 1920,
            },
            height: {
              ideal: 1080,
            },
          },
          audio: false,
        });

      streamRef.current = stream;

      const track =
        stream.getVideoTracks()[0];

      // Check torch support
      if (track) {
        const capabilities =
          track.getCapabilities?.();

        if (capabilities?.torch) {
          setTorchSupported(true);
        }

        // Continuous autofocus
        try {
          if (
            capabilities?.focusMode?.includes(
              "continuous"
            )
          ) {
            await track.applyConstraints({
              advanced: [
                {
                  focusMode: "continuous",
                },
              ],
            });
          }
        } catch (err) {
          console.log(
            "Autofocus not supported:",
            err
          );
        }

        // Continuous exposure
        try {
          if (
            capabilities?.exposureMode?.includes(
              "continuous"
            )
          ) {
            await track.applyConstraints({
              advanced: [
                {
                  exposureMode: "continuous",
                },
              ],
            });
          }
        } catch (err) {
          console.log(
            "Auto exposure not supported:",
            err
          );
        }
      }

      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      video.srcObject = stream;

      await new Promise((resolve) => {
        if (
          video.readyState >= 2 &&
          video.videoWidth > 0
        ) {
          resolve();
          return;
        }

        video.onloadedmetadata = () => {
          resolve();
        };
      });

      try {
        await video.play();
      } catch (err) {
        console.log(
          "Video play:",
          err
        );
      }

      setCameraReady(true);

    } catch (err) {
      console.error(
        "Camera startup error:",
        err
      );

      if (
        err?.name ===
        "NotAllowedError"
      ) {
        setError(
          "Camera permission was denied. Please allow camera access in the browser."
        );
      } else if (
        err?.name ===
        "NotFoundError"
      ) {
        setError(
          "No camera was found on this device."
        );
      } else {
        setError(
          err?.message ||
          "Unable to start camera."
        );
      }
    }
  }

  // ---------------------------------------
  // CAPTURE AND DECODE
  // ---------------------------------------

  async function captureBarcode() {
    if (
      !videoRef.current ||
      !cameraReady ||
      capturing
    ) {
      return;
    }

    setCapturing(true);
    setError("");

    try {
      const video =
        videoRef.current;

      const width =
        video.videoWidth;

      const height =
        video.videoHeight;

      if (!width || !height) {
        throw new Error(
          "Camera image is not ready. Please wait a moment."
        );
      }

      const canvas =
        canvasRef.current ||
        document.createElement(
          "canvas"
        );

      canvasRef.current = canvas;

      /*
       * Capture the complete
       * camera frame.
       */

      canvas.width = width;
      canvas.height = height;

      const ctx =
        canvas.getContext("2d");

      ctx.drawImage(
        video,
        0,
        0,
        width,
        height
      );

      /*
       * Try several regions.
       */

      const regions = [
        {
          x: 0,
          y: 0,
          width,
          height,
        },

        {
          x: width * 0.05,
          y: height * 0.20,
          width: width * 0.90,
          height: height * 0.60,
        },

        {
          x: width * 0.02,
          y: height * 0.30,
          width: width * 0.96,
          height: height * 0.40,
        },

        {
          x: width * 0.05,
          y: height * 0.05,
          width: width * 0.90,
          height: height * 0.50,
        },

        {
          x: width * 0.05,
          y: height * 0.45,
          width: width * 0.90,
          height: height * 0.50,
        },
      ];

      for (const region of regions) {
        const result =
          await tryDecodeRegion(
            video,
            region
          );

        if (result) {
          handleDetected(result);
          return;
        }
      }

      setError(
        "Barcode could not be read. Move the camera closer, make sure the entire barcode is visible, and keep the package steady."
      );

    } catch (err) {
      console.error(
        "Barcode capture error:",
        err
      );

      setError(
        err?.message ||
        "Unable to read barcode."
      );

    } finally {
      setCapturing(false);
    }
  }

  // ---------------------------------------
  // DECODE REGION
  // ---------------------------------------

  async function tryDecodeRegion(
    video,
    region
  ) {
    const scale = 2;

    const canvas =
      document.createElement(
        "canvas"
      );

    canvas.width =
      Math.floor(
        region.width * scale
      );

    canvas.height =
      Math.floor(
        region.height * scale
      );

    const ctx =
      canvas.getContext(
        "2d",
        {
          willReadFrequently: true,
        }
      );

    ctx.imageSmoothingEnabled =
      false;

    /*
     * -------------------------
     * PASS 1
     * Original image
     * -------------------------
     */

    ctx.drawImage(
      video,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      canvas.width,
      canvas.height
    );

    let result =
      await decodeCanvas(canvas);

    if (result) {
      return result;
    }

    /*
     * -------------------------
     * PASS 2
     * Grayscale + brightness
     * -------------------------
     */

    const imageData =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

    const pixels =
      imageData.data;

    for (
      let i = 0;
      i < pixels.length;
      i += 4
    ) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      let gray =
        0.299 * r +
        0.587 * g +
        0.114 * b;

      // Brightness
      gray =
        gray * 1.25 + 10;

      // Contrast
      gray =
        (gray - 128) * 1.7 + 128;

      gray =
        Math.max(
          0,
          Math.min(
            255,
            gray
          )
        );

      pixels[i] = gray;
      pixels[i + 1] = gray;
      pixels[i + 2] = gray;
    }

    ctx.putImageData(
      imageData,
      0,
      0
    );

    result =
      await decodeCanvas(canvas);

    if (result) {
      return result;
    }

    /*
     * -------------------------
     * PASS 3
     * Threshold
     * -------------------------
     */

    const threshold =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

    const thresholdPixels =
      threshold.data;

    for (
      let i = 0;
      i < thresholdPixels.length;
      i += 4
    ) {
      const value =
        thresholdPixels[i] < 150
          ? 0
          : 255;

      thresholdPixels[i] =
        value;

      thresholdPixels[i + 1] =
        value;

      thresholdPixels[i + 2] =
        value;
    }

    ctx.putImageData(
      threshold,
      0,
      0
    );

    result =
      await decodeCanvas(canvas);

    if (result) {
      return result;
    }

    /*
     * -------------------------
     * PASS 4
     * Inverted threshold
     * -------------------------
     */

    const inverted =
      ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height
      );

    const invertedPixels =
      inverted.data;

    for (
      let i = 0;
      i < invertedPixels.length;
      i += 4
    ) {
      const value =
        invertedPixels[i] < 150
          ? 255
          : 0;

      invertedPixels[i] =
        value;

      invertedPixels[i + 1] =
        value;

      invertedPixels[i + 2] =
        value;
    }

    ctx.putImageData(
      inverted,
      0,
      0
    );

    return decodeCanvas(
      canvas
    );
  }

  // ---------------------------------------
  // ZXING DECODE
  // ---------------------------------------

  async function decodeCanvas(
    canvas
  ) {
    try {
      const image =
        canvas.toDataURL(
          "image/png"
        );

      const reader =
        new BrowserMultiFormatReader();

      const result =
        await reader.decodeFromImageUrl(
          image
        );

      if (result) {
        const text =
          result.getText();

        if (text) {
          console.log(
            "BARCODE FOUND:",
            text
          );

          return text;
        }
      }
    } catch (err) {
      /*
       * Normal decode failure.
       * Do not show an error for every
       * failed attempt.
       */
    }

    return null;
  }

  // ---------------------------------------
  // TORCH
  // ---------------------------------------

  async function toggleTorch() {
    try {
      const stream =
        streamRef.current;

      if (!stream) {
        return;
      }

      const track =
        stream.getVideoTracks()[0];

      if (!track) {
        return;
      }

      const capabilities =
        track.getCapabilities?.();

      if (!capabilities?.torch) {
        setError(
          "Flashlight control is not supported by this camera."
        );

        return;
      }

      const nextState =
        !torchOn;

      await track.applyConstraints({
        advanced: [
          {
            torch: nextState,
          },
        ],
      });

      setTorchOn(
        nextState
      );

    } catch (err) {
      console.error(
        "Torch error:",
        err
      );

      setError(
        "Unable to control the camera light."
      );
    }
  }

  // ---------------------------------------
  // DETECTED
  // ---------------------------------------

  function handleDetected(
    value
  ) {
    if (!value) {
      return;
    }

    console.log(
      "PacksureAI barcode:",
      value
    );

    stopCamera();

    if (onDetected) {
      onDetected(value);
    }
  }

  // ---------------------------------------
  // STOP CAMERA
  // ---------------------------------------

  function stopCamera() {
    try {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            }
          );

        streamRef.current =
          null;
      }
    } catch (err) {
      console.error(err);
    }

    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch {}

      videoRef.current.srcObject =
        null;
    }

    setCameraReady(false);
    setTorchOn(false);
  }

  // ---------------------------------------
  // CLOSE
  // ---------------------------------------

  function handleClose() {
    stopCamera();

    if (onClose) {
      onClose();
    }
  }

  // ---------------------------------------
  // UI
  // ---------------------------------------

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 sm:p-6">

      <div className="w-full max-w-4xl overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* HEADER */}

        <div className="flex items-center justify-between border-b px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-xl text-white">
              ▦
            </div>

            <div>

              <h2 className="text-lg font-bold text-slate-900">
                PacksureAI Barcode Scanner
              </h2>

              <p className="text-xs text-slate-500">
                Capture any supported product barcode
              </p>

            </div>

          </div>

          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100"
          >
            ×
          </button>

        </div>


        {/* CAMERA */}

        <div className="relative overflow-hidden bg-black">

          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="block aspect-video w-full object-cover"
          />

          {/* SCANNING AREA */}

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">

            <div className="relative h-48 w-[92%] max-w-3xl rounded-2xl border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.28)]">

              {/* RED LINE */}

              <div className="absolute left-3 right-3 top-1/2 h-0.5 bg-red-500 shadow-lg" />

              {/* CORNERS */}

              <div className="absolute -left-1 -top-1 h-10 w-10 rounded-tl-2xl border-l-4 border-t-4 border-blue-400" />

              <div className="absolute -right-1 -top-1 h-10 w-10 rounded-tr-2xl border-r-4 border-t-4 border-blue-400" />

              <div className="absolute -bottom-1 -left-1 h-10 w-10 rounded-bl-2xl border-b-4 border-l-4 border-blue-400" />

              <div className="absolute -bottom-1 -right-1 h-10 w-10 rounded-br-2xl border-b-4 border-r-4 border-blue-400" />

            </div>

          </div>


          {/* STATUS */}

          <div className="absolute left-1/2 top-4 -translate-x-1/2">

            <div className="flex items-center gap-2 rounded-full bg-black/70 px-4 py-2 text-xs font-semibold text-white backdrop-blur">

              <span
                className={`h-2 w-2 rounded-full ${
                  cameraReady
                    ? "animate-pulse bg-green-400"
                    : "bg-yellow-400"
                }`}
              />

              {cameraReady
                ? "Camera ready"
                : "Starting camera..."}

            </div>

          </div>


          {/* FLASHLIGHT */}

          {torchSupported && (

            <button
              onClick={toggleTorch}
              className={`absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-xl ${
                torchOn
                  ? "bg-yellow-400 text-black"
                  : "bg-black/70 text-white"
              }`}
              title="Toggle flashlight"
            >
              {torchOn
                ? "☀"
                : "☼"}
            </button>

          )}

        </div>


        {/* INSTRUCTIONS */}

        <div className="px-5 pt-5">

          <div className="rounded-2xl bg-blue-50 p-4">

            <p className="text-center text-sm font-bold text-blue-900">
              Position the complete barcode inside the frame
            </p>

            <p className="mt-1 text-center text-xs text-blue-700">
              Keep the package steady and press Capture once
            </p>

          </div>

        </div>


        {/* ERROR */}

        {error && (

          <div className="mx-5 mt-4 rounded-2xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-bold text-red-900">
              Scanner message
            </p>

            <p className="mt-1 text-sm leading-6 text-red-700">
              {error}
            </p>

          </div>

        )}


        {/* ACTION BUTTONS */}

        <div className="flex flex-col gap-3 p-5 sm:flex-row sm:justify-end">

          <button
            onClick={handleClose}
            className="rounded-xl border border-slate-300 px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            onClick={captureBarcode}
            disabled={
              !cameraReady ||
              capturing
            }
            className="rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >

            {capturing
              ? "Reading Barcode..."
              : "Capture Barcode"}

          </button>

        </div>


        {/* SUPPORTED FORMATS */}

        <div className="border-t bg-slate-50 px-5 py-4">

          <p className="text-center text-xs leading-5 text-slate-500">

            Supports common EAN, UPC, Code 128,
            Code 39, Code 93, ITF, Codabar and QR
            formats.

          </p>

        </div>


        <canvas
          ref={canvasRef}
          className="hidden"
        />

      </div>

    </div>
  );
}