import AreaTrendChart from "../components/charts/AreaTrendChart";
import GoalRadialChart from "../components/charts/GoalRadialChart";
import MetricCard from "../components/ui/MetricCard";
import activityTimeline from "../data/activity";
import tasks from "../data/tasks";

const DashboardPage = () => {
  return (
    <div className="space-y-10">
      <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Qualified revenue"
          value="$248,900"
          delta="+18.4%"
          trend="up"
          caption="Compared to previous period"
        />
        <MetricCard
          title="Expansion pipeline"
          value="$68,420"
          delta="+9.7%"
          trend="up"
          caption="New upsell opportunities"
        />
        <MetricCard
          title="Cycle time"
          value="12.6 days"
          delta="-1.8 days"
          trend="down"
          caption="Average from initial contact to close"
        />
        <MetricCard
          title="Customer health"
          value="92%"
          delta="+4.2%"
          trend="up"
          caption="Accounts with green health scores"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AreaTrendChart />
        </div>
        <div className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <div>
            <p className="text-sm font-medium text-slate-500">Quarterly goals</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900">Performance snapshot</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <GoalRadialChart label="Revenue" value={78} />
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm">
              <GoalRadialChart label="Retention" value={86} color="#22c55e" />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex size-9 items-center justify-center rounded-2xl bg-indigo-100 text-sm font-semibold text-indigo-600">
                1
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Launch predictive scoring model</p>
                <p className="text-xs text-slate-500">Data science</p>
              </div>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                78% complete
              </span>
            </div>
            <div className="flex items-start gap-3">
              <span className="mt-1 inline-flex size-9 items-center justify-center rounded-2xl bg-emerald-100 text-sm font-semibold text-emerald-600">
                2
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-900">Automate onboarding workflow</p>
                <p className="text-xs text-slate-500">Operations</p>
              </div>
              <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                64% complete
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Team priorities</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Active initiatives</h2>
            </div>
            <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600">
              View all
            </button>
          </div>
          <div className="mt-6 space-y-4">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
                <img src={task.avatar} alt={task.owner} className="size-12 rounded-xl object-cover" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{task.title}</p>
                  <p className="text-xs text-slate-500">{task.owner}</p>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-semibold text-slate-500">{task.due}</span>
                  <span className="mt-1 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-slate-900/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Operational pulse</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">Today\'s activity</h2>
            </div>
            <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-600">Live</span>
          </div>
          <div className="mt-6 space-y-4">
            {activityTimeline.map((activity) => (
              <div key={activity.id} className="flex items-start gap-3">
                <span
                  className={`mt-1 inline-flex size-10 items-center justify-center rounded-2xl text-sm font-semibold ${
                    activity.type === "meeting"
                      ? "bg-indigo-100 text-indigo-600"
                      : activity.type === "automation"
                        ? "bg-emerald-100 text-emerald-600"
                        : "bg-amber-100 text-amber-600"
                  }`}
                >
                  {activity.timestamp}
                </span>
                <div>
                  <p className="text-sm font-semibold text-slate-900">{activity.title}</p>
                  <p className="text-xs text-slate-500">{activity.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
