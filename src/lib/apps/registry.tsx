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
];
