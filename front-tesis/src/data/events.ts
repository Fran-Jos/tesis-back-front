const today = new Date();

today.setHours(0, 0, 0, 0);

const events = [
  {
    id: "1",
    title: "Lifecycle planning workshop",
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(),
  },
  {
    id: "2",
    title: "Platform sync",
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 15, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 16, 0).toISOString(),
  },
  {
    id: "3",
    title: "Finance automation demo",
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 9, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 30).toISOString(),
  },
  {
    id: "4",
    title: "Customer roundtable",
    start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 11, 0).toISOString(),
    end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 4, 12, 0).toISOString(),
  },
];

export default events;
