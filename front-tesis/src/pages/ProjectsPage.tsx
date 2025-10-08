import projects from "../data/projects";

const statusColors: Record<string, string> = {
  "In progress": "bg-indigo-100 text-indigo-600",
  Planning: "bg-amber-100 text-amber-600",
  "In review": "bg-emerald-100 text-emerald-600",
  Blocked: "bg-rose-100 text-rose-600",
};

const ProjectsPage = () => {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Projects</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Delivery portfolio health</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Monitor progress, unblock teams, and keep initiatives aligned with strategic outcomes. This view refreshes every 15 minutes.
        </p>
      </header>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white/95 shadow-lg shadow-slate-900/5">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Project</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Owner</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Progress</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Updated</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {projects.map((project) => (
              <tr key={project.id} className="bg-white/80 transition hover:bg-slate-50/80">
                <td className="px-6 py-5 text-sm font-semibold text-slate-900">{project.name}</td>
                <td className="px-6 py-5 text-sm text-slate-600">{project.owner}</td>
                <td className="px-6 py-5">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[project.status]}`}>
                    {project.status}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="relative h-2 flex-1 rounded-full bg-slate-200">
                      <div
                        className="absolute inset-y-0 left-0 rounded-full bg-indigo-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-slate-600">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-6 py-5 text-sm text-slate-500">{project.updatedAt}</td>
                <td className="px-6 py-5 text-right">
                  <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600">
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProjectsPage;
