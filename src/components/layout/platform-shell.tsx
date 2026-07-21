"use client";

import Link from "next/link";
import { logout } from "@/app/login/actions";
import { ThemeToggle } from "@/components/theme-provider";
import { RoseLogo } from "@/components/rose-logo";

interface PlatformShellProps {
  user: {
    id: string;
    email: string;
    displayName: string;
    avatarUrl: string | null;
  };
  children: React.ReactNode;
}

export function PlatformShell({ user, children }: PlatformShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      {/* Top platform header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Rose home button (desktop returns to launcher) */}
          <Link href="/" className="flex items-center gap-2" title="Rose home">
            <RoseLogo />
            <h1 className="text-base font-bold tracking-tight hidden sm:block">Rose</h1>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="h-5 w-px bg-border" />
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="h-7 w-7 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">
                  {user.displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="hidden text-sm font-medium sm:inline">
              {user.displayName}
            </span>
            <form action={logout}>
              <button
                type="submit"
                title="Sign out"
                className="ml-1 rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content — each context (launcher / app) controls its own padding */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
