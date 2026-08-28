import {
  ArrowRight,
  ScanLine,
  ShieldCheck,
  BrainCircuit,
  FileCheck2,
  Camera,
  Database,
  BarChart3,
  CheckCircle2,
  ChevronRight
} from "lucide-react";

import { motion } from "framer-motion";

import { useNavigate } from "react-router-dom";


const features = [
  {
    icon: ScanLine,
    title: "Smart Package Scanning",
    description:
      "Capture package images from multiple angles including front, back and declaration labels."
  },
  {
    icon: BrainCircuit,
    title: "AI-Powered Detection",
    description:
      "Use computer vision and OCR to identify and extract mandatory package declarations."
  },
  {
    icon: ShieldCheck,
    title: "LMPC Rule Validation",
    description:
      "Automatically validate extracted declarations against applicable Legal Metrology rules."
  },
  {
    icon: FileCheck2,
    title: "Compliance Reports",
    description:
      "Generate structured inspection reports with violations, evidence and compliance scores."
  }
];


const workflow = [
  {
    number: "01",
    title: "Capture",
    description:
      "Upload or capture package images."
  },
  {
    number: "02",
    title: "Detect",
    description:
      "Locate labels and declaration regions."
  },
  {
    number: "03",
    title: "Extract",
    description:
      "Extract text using OCR and AI."
  },
  {
    number: "04",
    title: "Validate",
    description:
      "Apply LMPC compliance rules."
  },
  {
    number: "05",
    title: "Report",
    description:
      "Generate evidence-backed results."
  }
];


export default function Home() {

  const navigate = useNavigate();


  return (

    <div className="min-h-screen overflow-hidden bg-slate-950 text-white">

      {/* NAVBAR */}

      <nav className="relative z-50 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-600/30">

              <ShieldCheck size={23} />

            </div>

            <div>

              <p className="font-bold tracking-tight">
                PacksureAI
              </p>

              <p className="text-[9px] uppercase tracking-[0.25em] text-slate-500">
                Compliance Intelligence
              </p>

            </div>

          </div>


          <div className="hidden items-center gap-8 md:flex">

            <a
              href="#features"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Features
            </a>

            <a
              href="#workflow"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Workflow
            </a>

            <a
              href="#technology"
              className="text-sm text-slate-400 transition hover:text-white"
            >
              Technology
            </a>

          </div>


          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
          >
            Officer Login
          </button>

        </div>

      </nav>


      {/* HERO */}

      <section className="relative">

        <div className="absolute left-1/2 top-[-100px] h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-600/20 blur-[140px]" />

        <div className="absolute right-[-100px] top-[250px] h-[400px] w-[400px] rounded-full bg-indigo-600/10 blur-[120px]" />


        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:py-32">


          {/* HERO TEXT */}

          <motion.div
            initial={{
              opacity: 0,
              y: 30
            }}
            animate={{
              opacity: 1,
              y: 0
            }}
            transition={{
              duration: 0.7
            }}
          >

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/10 px-4 py-2 text-xs font-medium text-blue-300">

              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-400" />

              SIH 26034 • LEGAL METROLOGY

            </div>


            <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] tracking-tight md:text-7xl">

              Intelligent

              <span className="block text-blue-500">
                Package Compliance.
              </span>

            </h1>


            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-400">

              PacksureAI helps enforcement officers
              scan packaged commodities, extract
              mandatory declarations, validate
              compliance and generate inspection
              reports using AI.

            </p>


            <div className="mt-9 flex flex-col gap-3 sm:flex-row">

              <button
                onClick={() => navigate("/login")}
                className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold shadow-xl shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-blue-500"
              >

                Start Inspection

                <ArrowRight size={18} />

              </button>


              <a
                href="#workflow"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-6 py-3.5 font-semibold text-slate-300 transition hover:bg-white/5"
              >

                Explore Workflow

                <ChevronRight size={17} />

              </a>

            </div>


            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-slate-500">

              <div className="flex items-center gap-2">

                <CheckCircle2
                  size={16}
                  className="text-green-500"
                />

                OCR Analysis

              </div>


              <div className="flex items-center gap-2">

                <CheckCircle2
                  size={16}
                  className="text-green-500"
                />

                Rule Validation

              </div>


              <div className="flex items-center gap-2">

                <CheckCircle2
                  size={16}
                  className="text-green-500"
                />

                Evidence Reports

              </div>

            </div>

          </motion.div>


          {/* HERO DASHBOARD MOCKUP */}

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            transition={{
              duration: 0.8
            }}
            className="relative"
          >

            <div className="absolute -inset-8 rounded-[3rem] bg-blue-600/10 blur-3xl" />


            <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.06] p-3 shadow-2xl backdrop-blur-xl">


              {/* WINDOW */}

              <div className="overflow-hidden rounded-[1.5rem] bg-slate-900">


                {/* WINDOW HEADER */}

                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">

                  <div className="flex gap-1.5">

                    <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />

                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/80" />

                    <span className="h-2.5 w-2.5 rounded-full bg-green-400/80" />

                  </div>


                  <p className="text-[10px] text-slate-500">
                    PACKSUREAI / INSPECTION
                  </p>

                </div>


                <div className="p-5">


                  {/* STATUS */}

                  <div className="mb-5 flex items-center justify-between">

                    <div>

                      <p className="text-[10px] uppercase tracking-wider text-slate-500">
                        Live Inspection
                      </p>

                      <p className="mt-1 font-semibold">
                        Package Analysis
                      </p>

                    </div>


                    <div className="flex items-center gap-2 rounded-full bg-green-500/10 px-3 py-1.5 text-[10px] font-semibold text-green-400">

                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />

                      ANALYZING

                    </div>

                  </div>


                  {/* PACKAGE */}

                  <div className="relative flex h-64 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900">


                    <div className="absolute inset-8 rounded-xl border border-blue-400/20" />

                    <div className="absolute inset-14 rounded-xl border border-dashed border-blue-400/20" />


                    {/* SCANNING LINE */}

                    <motion.div
                      animate={{
                        y: [
                          -80,
                          80,
                          -80
                        ]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute h-px w-64 bg-blue-400 shadow-lg shadow-blue-400"
                    />


                    {/* PACKAGE */}

                    <div className="relative flex h-40 w-32 flex-col items-center justify-center rounded-xl bg-gradient-to-b from-white to-slate-200 text-slate-900 shadow-2xl">


                      <div className="h-8 w-20 rounded-lg border border-slate-300 bg-slate-100">

                        <div className="mx-auto mt-2 h-1 w-12 rounded bg-blue-600" />

                        <div className="mx-auto mt-2 h-1 w-8 rounded bg-slate-300" />

                      </div>


                      <p className="mt-5 text-[9px] font-bold">
                        PRODUCT
                      </p>

                      <p className="text-[7px] text-slate-500">
                        NET QTY • MRP
                      </p>

                    </div>


                    {/* LABEL */}

                    <div className="absolute left-5 top-5 rounded-lg bg-blue-600/90 px-2.5 py-1.5 text-[9px] font-semibold shadow-lg">
                      LABEL DETECTED
                    </div>


                    {/* OCR */}

                    <div className="absolute bottom-5 right-5 rounded-lg bg-green-600/90 px-2.5 py-1.5 text-[9px] font-semibold shadow-lg">
                      OCR 96%
                    </div>

                  </div>


                  {/* METRICS */}

                  <div className="mt-4 grid grid-cols-3 gap-2">

                    <Metric
                      title="FIELDS"
                      value="12/14"
                    />

                    <Metric
                      title="RULES"
                      value="18"
                    />

                    <Metric
                      title="SCORE"
                      value="91%"
                    />

                  </div>


                  {/* RESULT */}

                  <div className="mt-3 flex items-center justify-between rounded-xl bg-green-500/10 p-3">

                    <div className="flex items-center gap-2">

                      <ShieldCheck
                        size={16}
                        className="text-green-400"
                      />

                      <span className="text-xs font-medium text-green-300">
                        Compliance Status
                      </span>

                    </div>

                    <span className="text-xs font-bold text-green-400">
                      PASS
                    </span>

                  </div>

                </div>

              </div>

            </div>

          </motion.div>

        </div>

      </section>


      {/* FEATURES */}

      <section
        id="features"
        className="bg-slate-50 py-24 text-slate-900"
      >

        <div className="mx-auto max-w-7xl px-6">


          <div className="max-w-2xl">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Core Capabilities
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">

              From package image
              to compliance decision.

            </h2>

            <p className="mt-5 leading-7 text-slate-500">

              A complete inspection workflow combining
              computer vision, OCR and rule-based validation.

            </p>

          </div>


          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">

            {features.map(
              (feature, index) => {

                const Icon =
                  feature.icon;

                return (

                  <motion.div
                    key={feature.title}
                    initial={{
                      opacity: 0,
                      y: 25
                    }}
                    whileInView={{
                      opacity: 1,
                      y: 0
                    }}
                    viewport={{
                      once: true
                    }}
                    transition={{
                      delay:
                        index * 0.08
                    }}
                    whileHover={{
                      y: -6
                    }}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-xl"
                  >

                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">

                      <Icon size={22} />

                    </div>

                    <h3 className="font-semibold">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {feature.description}
                    </p>

                  </motion.div>

                );

              }
            )}

          </div>

        </div>

      </section>


      {/* WORKFLOW */}

      <section
        id="workflow"
        className="bg-white py-24 text-slate-900"
      >

        <div className="mx-auto max-w-7xl px-6">


          <div className="text-center">

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-600">
              Inspection Workflow
            </p>

            <h2 className="mt-3 text-4xl font-bold tracking-tight">
              Five steps. One compliance decision.
            </h2>

          </div>


          <div className="mt-16 grid gap-4 md:grid-cols-5">

            {workflow.map(
              (item, index) => (

                <motion.div
                  key={item.number}
                  initial={{
                    opacity: 0,
                    y: 20
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0
                  }}
                  viewport={{
                    once: true
                  }}
                  transition={{
                    delay:
                      index * 0.08
                  }}
                  className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >

                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">

                    {item.number}

                  </div>

                  <h3 className="mt-5 font-semibold">
                    {item.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {item.description}
                  </p>

                </motion.div>

              )
            )}

          </div>

        </div>

      </section>


      {/* TECHNOLOGY */}

      <section
        id="technology"
        className="bg-slate-950 py-24"
      >

        <div className="mx-auto max-w-7xl px-6">


          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">


            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-400">
                Technology Stack
              </p>

              <h2 className="mt-3 text-4xl font-bold tracking-tight">

                Evidence-first
                compliance intelligence.

              </h2>

              <p className="mt-5 max-w-xl leading-7 text-slate-400">

                Every automated decision can be traced to
                package evidence, extracted declarations,
                applicable rules and validation results.

              </p>

            </div>


            <div className="grid grid-cols-2 gap-4">

              <TechnologyCard
                icon={Camera}
                title="Computer Vision"
              />

              <TechnologyCard
                icon={BrainCircuit}
                title="OCR & AI"
              />

              <TechnologyCard
                icon={Database}
                title="Secure Repository"
              />

              <TechnologyCard
                icon={BarChart3}
                title="Analytics"
              />

            </div>

          </div>

        </div>

      </section>


      {/* FOOTER */}

      <footer className="border-t border-white/10 bg-slate-950 py-8">

        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 px-6 text-xs text-slate-500 md:flex-row">

          <p>
            PacksureAI • SIH 26034
          </p>

          <p>
            Legal Metrology Compliance Intelligence
          </p>

        </div>

      </footer>

    </div>
  );
}


function Metric({
  title,
  value
}) {

  return (

    <div className="rounded-xl bg-white/5 p-3">

      <p className="text-[8px] font-medium tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-sm font-bold">
        {value}
      </p>

    </div>

  );
}


function TechnologyCard({
  icon: Icon,
  title
}) {

  return (

    <motion.div
      whileHover={{
        y: -4
      }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-6"
    >

      <Icon
        size={23}
        className="text-blue-400"
      />

      <p className="mt-5 font-semibold">
        {title}
      </p>

    </motion.div>

  );
}