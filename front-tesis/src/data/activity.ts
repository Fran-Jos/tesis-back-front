const activityTimeline = [
  {
    id: "1",
    title: "Weekly executive sync",
    description: "Summarized customer health metrics for leadership in under 12 minutes.",
    timestamp: "09:20",
    type: "meeting",
  },
  {
    id: "2",
    title: "Automation published",
    description: "Finance automation tags invoices over 14 days overdue and alerts owners.",
    timestamp: "11:05",
    type: "automation",
  },
  {
    id: "3",
    title: "Customer feedback",
    description: "Net promoter score trended upward for the third consecutive week.",
    timestamp: "14:32",
    type: "insight",
  },
];

export type Activity = typeof activityTimeline[number];

export default activityTimeline;
