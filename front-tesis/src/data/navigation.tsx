import type { ComponentType } from "react";
import { entityConfigs } from "../config/entities";

type IconComponent = ComponentType<{ className?: string }>;

type NavigationLink = {
  name: string;
  to: string;
  icon: IconComponent;
};

type NavigationItem = {
  name: string;
  href: string;
  icon: IconComponent;
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

const FleetIcon: IconComponent = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a2.25 2.25 0 012.25-2.25h15a2.25 2.25 0 012.25 2.25v1.5A2.25 2.25 0 0119.5 18.75h-15A2.25 2.25 0 012.25 16.5V15z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5L5.25 6.75A2.25 2.25 0 017.39 5.25h9.22A2.25 2.25 0 0118.75 6.75L21 13.5M5.25 18.75h.008v.008H5.25v-.008zM18.75 18.75h.008v.008h-.008v-.008z" />
  </svg>
);

const UsersIcon: IconComponent = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6.75a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.501 20.118a7.5 7.5 0 0114.998 0" />
  </svg>
);

const ClipboardIcon: IconComponent = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H7.5A2.25 2.25 0 005.25 6v12A2.25 2.25 0 007.5 20.25h9A2.25 2.25 0 0018.75 18V6A2.25 2.25 0 0016.5 3.75H15" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75h6v.75A1.5 1.5 0 0113.5 6h-3A1.5 1.5 0 019 4.5v-.75z" />
  </svg>
);

const AlertIcon: IconComponent = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0 3.5 2.113 6.5 5.25 7.712l.75.288A8.999 8.999 0 0012 21a8.999 8.999 0 003.75-.75l.75-.288A8.251 8.251 0 0021.75 12a8.251 8.251 0 00-5.25-7.712l-.75-.288a9.002 9.002 0 00-6 0l-.75.288A8.251 8.251 0 002.25 12z" />
  </svg>
);

const GearIcon: IconComponent = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.343 3.94c.09-.542.56-.94 1.11-.94h1.094c.55 0 1.02.398 1.11.94l.149.894c.07.424.384.764.78.93l.892.363c.511.208.767.78.558 1.29l-.375.918a1.125 1.125 0 000 .854l.375.918c.209.51-.047 1.082-.558 1.29l-.892.363a1.125 1.125 0 00-.78.93l-.149.894c-.09.542-.56.94-1.11.94h-1.094c-.55 0-1.02-.398-1.11-.94l-.149-.894a1.125 1.125 0 00-.78-.93l-.892-.363c-.511-.208-.767-.78-.558-1.29l.375-.918a1.125 1.125 0 000-.854l-.375-.918c-.209-.51.047-1.082.558-1.29l.892-.363c.396-.166.71-.506.78-.93l.149-.894z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const BookIcon: IconComponent = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 6.75V18A2.25 2.25 0 006.75 20.25H18" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 3.75H8.25A1.5 1.5 0 006.75 5.25v13.5M12 6.75h4.5" />
  </svg>
);

const ChartIcon: IconComponent = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12 9 3.75l6 6 6.75-9" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V3.75" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 21v-11.25" />
  </svg>
);

const entityIconMap: Record<string, IconComponent> = {
  vehiculos: FleetIcon,
  usuarios: UsersIcon,
  planes: GearIcon,
  ordenes: ClipboardIcon,
  tareas: BookIcon,
  "repuestos-usados": GearIcon,
  registrokm: DashboardIcon,
  alertas: AlertIcon,
};

const mainNavigation: NavigationLink[] = [
  { name: "Dashboard", to: "/app/dashboard", icon: DashboardIcon },
  { name: "Reportes", to: "/app/reportes/detallado", icon: ChartIcon },
  ...entityConfigs.map((entity) => ({
    name: entity.label,
    to: `/app/${entity.key}`,
    icon: entityIconMap[entity.key] ?? DashboardIcon,
  })),
];

const navigationItems: {
  main: NavigationLink[];
  secondary: NavigationItem[];
} = {
  main: mainNavigation,
  secondary: [],
};

export default navigationItems;
