type MetricCardProps = {
  title: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  caption?: string;
};

const MetricCard = ({ title, value, delta, trend, caption }: MetricCardProps) => {
  return (
    <article className="group rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5 transition hover:-translate-y-1 hover:shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
            trend === "up"
              ? "bg-emerald-100 text-emerald-600"
              : "bg-rose-100 text-rose-600"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="size-4"
          >
            {trend === "up" ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 6 6" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25L12 15.75l-6-6" />
            )}
          </svg>
          {delta}
        </span>
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
      {caption ? <p className="mt-2 text-xs text-slate-400">{caption}</p> : null}
    </article>
  );
};

export default MetricCard;
