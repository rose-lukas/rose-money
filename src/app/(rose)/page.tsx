import Link from "next/link";
import { ROSE_APPS } from "@/lib/apps/registry";

// NOTE: Minimal functional launcher (Phase 2/3). The polished iOS/Launchpad-style
// home screen is built in Phase 4.
function IconSettings({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
  );
}

export default function LauncherPage() {
  return (
    <div className="px-4 pt-12 pb-10 sm:px-6 sm:pt-20">
      <div className="mx-auto max-w-4xl space-y-10">
        <div className="text-center sm:text-left">
          <h1
            className="text-3xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-brand)" }}
          >
            RoseApp
          </h1>
          <p className="mt-1 text-muted-foreground">Your apps</p>
        </div>

        <div className="sm:rounded-3xl sm:border sm:bg-muted/30 sm:p-12 sm:shadow-sm">
          <div className="grid grid-cols-3 gap-6 sm:grid-cols-5 sm:gap-10">
            {ROSE_APPS.map((app) => {
              const Icon = app.icon;
              return (
                <Link
                  key={app.id}
                  href={app.href}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${app.color} text-white shadow-md transition-transform group-active:scale-95 group-hover:scale-105 sm:h-20 sm:w-20 sm:rounded-3xl`}
                  >
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10" />
                  </div>
                  <span className="text-xs font-medium sm:text-sm">{app.name}</span>
                </Link>
              );
            })}

            {/* General RoseApp settings */}
            <Link href="/settings" className="flex flex-col items-center gap-2 group">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 text-white shadow-md transition-transform group-active:scale-95 group-hover:scale-105 sm:h-20 sm:w-20 sm:rounded-3xl">
                <IconSettings className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              <span className="text-xs font-medium sm:text-sm">Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
