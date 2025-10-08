import events from "../data/events";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const formatTime = (isoString: string) => {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoString));
};

const CalendarPage = () => {
  const grouped = dayNames.map((day, index) => {
    const dayEvents = events
      .filter((event) => new Date(event.start as string).getDay() === index)
      .sort((a, b) => new Date(a.start as string).getTime() - new Date(b.start as string).getTime());

    return { day, events: dayEvents };
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500">Schedule</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">Operational rhythm</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-500">
          Coordinate working sessions, demos, and executive syncs across teams. Drag-free blocks keep the week organized and provide context for the moments that matter.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-3">
        {grouped.map(({ day, events: dayEvents }) => (
          <article
            key={day}
            className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">{day}</p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {dayEvents.length > 0 ? `${dayEvents.length} commitments` : "Focus time"}
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                {dayEvents.length > 0 ? "Active" : "Open"}
              </span>
            </div>
            <div className="space-y-3">
              {dayEvents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-400">
                  Block deeper work or downtime to preserve energy.
                </div>
              ) : null}
              {dayEvents.map((event) => (
                <div
                  key={event.id as string}
                  className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 shadow-sm"
                >
                  <p className="text-sm font-semibold text-indigo-700">{event.title}</p>
                  <p className="mt-1 text-xs font-medium text-indigo-500">
                    {formatTime(event.start as string)} – {formatTime(event.end as string)}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
};

export default CalendarPage;
