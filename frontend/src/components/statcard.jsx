import { motion } from "framer-motion";

export default function StatCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  positive = true
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3 }}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </h3>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <Icon size={21} />
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-1 text-[11px] font-semibold ${
            positive
              ? "bg-green-50 text-green-600"
              : "bg-red-50 text-red-600"
          }`}
        >
          {change}
        </span>

        <span className="text-xs text-slate-400">
          {description}
        </span>
      </div>
    </motion.div>
  );
}