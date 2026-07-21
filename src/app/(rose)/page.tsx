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
    <div className="relative min-h-[calc(100vh-3.5rem)] overflow-hidden">
      {/* Ambient wallpaper */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/5 via-background to-background" />
      <div className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />

      <div className="px-5 pt-14 pb-14 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-4xl space-y-12">
          <div className="text-center">
            <h1
              className="text-4xl font-bold tracking-tight"
              style={{ fontFamily: "var(--font-brand)" }}
            >
              RoseHome
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Tap an app to get started
            </p>
          </div>

          <div className="mx-auto max-w-2xl sm:rounded-[2rem] sm:border sm:border-border/60 sm:bg-card/40 sm:p-12 sm:shadow-xl sm:backdrop-blur-sm">
            <div className="grid grid-cols-3 gap-x-6 gap-y-8 sm:grid-cols-4 sm:gap-x-10 sm:gap-y-10">
              {ROSE_APPS.map((app) => {
                const Icon = app.icon;
                return <AppTile key={app.id} href={app.href} label={app.name} color={app.color} icon={<Icon className="relative h-9 w-9" />} />;
              })}

              {/* General RoseHome settings */}
              <AppTile
                href="/settings"
                label="Settings"
                color="from-slate-400 to-slate-600"
                icon={<IconSettings className="relative h-9 w-9" />}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AppTile({
  href,
  label,
  color,
  icon,
}: {
  href: string;
  label: string;
  color: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-2.5">
      <div
        className={`relative flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-[1.4rem] bg-gradient-to-br ${color} text-white shadow-lg ring-1 ring-white/10 transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-xl group-active:scale-95 sm:h-20 sm:w-20`}
      >
        {/* Glossy highlight */}
        <div className="absolute inset-0 rounded-[1.4rem] bg-gradient-to-b from-white/25 to-transparent opacity-60" />
        {icon}
      </div>
      <span className="text-xs font-medium text-foreground/90 sm:text-sm">
        {label}
      </span>
    </Link>
  );
}
