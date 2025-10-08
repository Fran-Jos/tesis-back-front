import type { ComponentType } from "react";

type IconComponent = ComponentType<{ className?: string }>;

type NavigationLink = {
  name: string;
  to: string;
  icon: IconComponent;
  badge?: string;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: IconComponent;
  badge?: string;
};

const DashboardIcon: IconComponent = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5A3.75 3.75 0 006.75 9.75h10.5A3.75 3.75 0 0021 13.5v6.75H3V13.5z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6.75A3.75 3.75 0 016.75 3h10.5A3.75 3.75 0 0121 6.75V9H3V6.75z" />
  </svg>
);

const ProjectsIcon: IconComponent = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5-4.5m0 0l-1.125-.375a2.25 2.25 0 00-2.25.562L4.91 11.031A3 3 0 004.5 12.9v3.1a3 3 0 003 3h3.1a3 3 0 001.869-.41l5.594-5.964a2.25 2.25 0 00.562-2.25L17.75 9.75m-3.5-4.5l1.669 1.669" />
  </svg>
);

const CalendarIcon: IconComponent = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75v2.25m9-2.25v2.25M4.5 8.25h15M5.25 5.25h13.5a1.5 1.5 0 011.5 1.5v12a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-12a1.5 1.5 0 011.5-1.5z" />
  </svg>
);

const TeamIcon: IconComponent = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 6.75a3 3 0 116 0 3 3 0 01-6 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 19.5a7.5 7.5 0 0114.25-3.5m2.25 3.5v-3.75m0 0h-3.75m3.75 0l-2.25 2.25" />
  </svg>
);

const AutomationIcon: IconComponent = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9V3m0 0a9 9 0 019 9h-6m-3 3v6m0 0a9 9 0 01-9-9h6" />
  </svg>
);

const ReportsIcon: IconComponent = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5h6m-6 3h6M9 10.5h6m-3 3v6m-9 0h18" />
  </svg>
);

const SupportIcon: IconComponent = ({ className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519a3 3 0 014.242 0L21 14.4m-3 3 1.5 1.5M3 18.75V6.375c0-1.242 1.008-2.25 2.25-2.25h13.5c1.242 0 2.25 1.008 2.25 2.25V18.75M3 18.75h18M3 18.75l2.25-2.25m0 0h13.5l2.25 2.25" />
  </svg>
);

const navigationItems: {
  main: NavigationLink[];
  secondary: NavigationItem[];
} = {
  main: [
    { name: "Dashboard", to: "/", icon: DashboardIcon },
    { name: "Projects", to: "/projects", icon: ProjectsIcon, badge: "6" },
    { name: "Calendar", to: "/calendar", icon: CalendarIcon },
    { name: "Team", to: "/team", icon: TeamIcon },
  ],
  secondary: [
    { name: "Automations", href: "#", icon: AutomationIcon },
    { name: "Reports", href: "#", icon: ReportsIcon },
    { name: "Support", href: "#", icon: SupportIcon, badge: "New" },
  ],
};

export default navigationItems;
