import teamMembers from "../data/team";

const TeamPage = () => {
  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Team</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">People shaping the journey</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Meet the cross-functional leaders orchestrating customer outcomes, operations, and intelligence across the organization.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {teamMembers.map((member) => (
          <article
            key={member.id}
            className="rounded-3xl border border-slate-200 bg-white/95 p-6 text-center shadow-lg shadow-slate-900/5"
          >
            <img
              src={member.avatar}
              alt={member.name}
              className="mx-auto size-24 rounded-3xl object-cover shadow-lg"
            />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{member.name}</h2>
            <p className="text-sm text-slate-500">{member.role}</p>
            <div className="mt-4 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">
              {member.focus}
            </div>
            <p className="mt-3 text-xs text-slate-400">Timezone {member.timezone}</p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <button className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:border-indigo-200 hover:text-indigo-600">
                Message
              </button>
              <button className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-700">
                Schedule sync
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default TeamPage;
