import type { ComponentType } from "react";

export interface RoseApp {
  id: string;
  name: string;
  href: string;
  description?: string;
  icon: ComponentType<{ className?: string }>;
  /** Tailwind gradient classes for the launcher tile background */
  color: string;
}

function MoneyIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
      <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
    </svg>
  );
}

function FreezerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 2v20" />
      <path d="m4.93 7 14.14 10" />
      <path d="m19.07 7-14.14 10" />
      <path d="M12 2 9.5 4.5M12 2l2.5 2.5M12 22l-2.5-2.5M12 22l2.5-2.5" />
      <path d="m4.93 7 .5-3.4M4.93 7 1.6 6.9M19.07 17l-.5 3.4M19.07 17l3.33.1M19.07 7l3.33-.1M19.07 7l-.5-3.4M4.93 17l-3.33.1M4.93 17l.5 3.4" />
    </svg>
  );
}

/**
 * Code-defined registry of apps that appear on the Rose launcher.
 * To add a new app: build its routes under src/app/(rose)/<id>/ and append an entry here.
 */
export const ROSE_APPS: RoseApp[] = [
  {
    id: "money",
    name: "Money",
    href: "/money",
    description: "Budgets & expenses",
    icon: MoneyIcon,
    color: "from-emerald-400 to-green-600",
  },
  {
    id: "freezer",
    name: "Freezer",
    href: "/freezer",
    description: "What's in the chest freezer",
    icon: FreezerIcon,
    color: "from-sky-400 to-cyan-600",
  },
];
