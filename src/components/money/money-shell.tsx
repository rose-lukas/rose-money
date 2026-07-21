"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function IconHome() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
  );
}
function IconChart() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9-5 5-4-4-3 3"/></svg>
  );
}
function IconPlus() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
  );
}
function IconList() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><path d="M14 4h7"/><path d="M14 9h7"/><path d="M14 15h7"/><path d="M14 20h7"/></svg>
  );
}
function IconSettings() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}
function IconWallet() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
  );
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  add?: boolean;
}

// Mobile bottom navigation
const mobileNav: NavItem[] = [
  { href: "/money", label: "Home", icon: <IconHome /> },
  { href: "/money/history", label: "History", icon: <IconChart /> },
  { href: "/money/expenses/new", label: "Add", icon: <IconPlus />, add: true },
  { href: "/money/expenses", label: "Expenses", icon: <IconList /> },
  { href: "/money/budget", label: "Budget", icon: <IconWallet /> },
  { href: "/money/settings", label: "Settings", icon: <IconSettings /> },
];

// Desktop sidebar navigation
const sideNav: NavItem[] = [
  { href: "/money", label: "Dashboard", icon: <IconHome /> },
  { href: "/money/expenses", label: "Expenses", icon: <IconList /> },
  { href: "/money/expenses/new", label: "Add Expense", icon: <IconPlus /> },
  { href: "/money/budget", label: "Budget", icon: <IconWallet /> },
  { href: "/money/history", label: "History", icon: <IconChart /> },
  { href: "/money/settings", label: "Settings", icon: <IconSettings /> },
];

function isItemActive(pathname: string, item: NavItem): boolean {
  if (item.href === "/money") return pathname === "/money";
  return pathname.startsWith(item.href);
}

export function MoneyShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname === "/money";

  return (
    <>
      {/* Content */}
      <div
        className={cn(
          "sm:ml-56 px-4 py-5 pb-24 sm:px-6 sm:py-6 sm:pb-6",
          isDashboard && "pb-24 sm:pb-6"
        )}
      >
        {children}
      </div>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-lg sm:hidden safe-bottom">
        <div className="flex items-center justify-around px-1">
          {mobileNav.map((item) => {
            const isActive = isItemActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] transition-colors",
                  item.add && "relative -mt-3",
                  isActive ? "text-primary font-semibold" : "text-muted-foreground"
                )}
              >
                <span
                  className={cn(
                    "flex items-center justify-center",
                    item.add && "h-11 w-11 rounded-full bg-primary text-primary-foreground shadow-lg"
                  )}
                >
                  {item.icon}
                </span>
                <span className={cn(item.add && "mt-1")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop sidebar navigation */}
      <aside className="fixed left-0 top-14 hidden h-[calc(100vh-3.5rem)] w-56 border-r bg-background/50 backdrop-blur-sm p-4 sm:flex sm:flex-col sm:justify-between">
        <div className="space-y-4">
          <nav className="space-y-1">
            {sideNav.map((item) => {
              const isActive = isItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
