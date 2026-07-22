"use client";

import { useState } from "react";
import { login, register } from "./actions";
import { Button } from "@/components/ui/button";
import { RoseLogo } from "@/components/rose-logo";
import { ThemeToggle } from "@/components/theme-provider";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");

  async function handleLogin(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  async function handleRegister(formData: FormData) {
    setError(null);
    setLoading(true);
    const result = await register(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-full flex-1 flex-col items-center justify-center overflow-hidden px-6 py-12">
      {/* Theme toggle */}
      <div className="absolute right-4 top-4 z-20">
        <ThemeToggle />
      </div>

      {/* Animated ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-rose-400/30 blur-3xl animate-rh-blob dark:bg-rose-500/20" />
        <div className="absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-pink-400/25 blur-3xl animate-rh-blob dark:bg-pink-500/15" style={{ animationDelay: "-7s" }} />
        <div className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-fuchsia-400/20 blur-3xl animate-rh-blob dark:bg-fuchsia-500/10" style={{ animationDelay: "-14s" }} />
      </div>

      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative animate-rh-fade-up">
            <div className="absolute inset-0 -z-10 rounded-full bg-primary/25 blur-2xl animate-rh-glow" />
            <RoseLogo className="h-24 w-24 animate-rh-float drop-shadow-xl" />
          </div>
          <h1
            className="mt-5 text-4xl font-bold tracking-tight animate-rh-fade-up"
            style={{ fontFamily: "var(--font-brand)", animationDelay: "90ms" }}
          >
            RoseHome
          </h1>
          <p
            className="mt-2 text-sm text-muted-foreground animate-rh-fade-up"
            style={{ animationDelay: "170ms" }}
          >
            {mode === "login" ? "Welcome back" : "Create your household"}
          </p>
        </div>

        {/* Card */}
        <div
          className="space-y-5 rounded-2xl border bg-card/70 p-6 shadow-xl backdrop-blur-xl animate-rh-fade-up"
          style={{ animationDelay: "250ms" }}
        >
          {/* Sliding toggle */}
          <div className="relative flex rounded-xl border bg-background/50 p-1">
            <span
              className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-primary shadow-sm transition-transform duration-300 ease-out ${
                mode === "register" ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); }}
              className={`relative z-10 flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "login" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`relative z-10 flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                mode === "register" ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Register
            </button>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive animate-rh-fade-up">
              {error}
            </div>
          )}

          {mode === "login" ? (
            <form key="login" action={handleLogin} className="space-y-4 animate-rh-fade-up">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium leading-none">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="flex h-11 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium leading-none">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="flex h-11 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full transition-transform active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Signing in…
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          ) : (
            <form key="register" action={handleRegister} className="space-y-4 animate-rh-fade-up">
              <div className="space-y-2">
                <label htmlFor="reg-display-name" className="text-sm font-medium leading-none">
                  Your Name
                </label>
                <input
                  id="reg-display-name"
                  name="display_name"
                  type="text"
                  required
                  className="flex h-11 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  placeholder="Jane Doe"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-account-name" className="text-sm font-medium leading-none">
                  Household Name
                </label>
                <input
                  id="reg-account-name"
                  name="account_name"
                  type="text"
                  required
                  className="flex h-11 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  placeholder="The Smith Family"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-email" className="text-sm font-medium leading-none">
                  Email
                </label>
                <input
                  id="reg-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="flex h-11 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="reg-password" className="text-sm font-medium leading-none">
                  Password
                </label>
                <input
                  id="reg-password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  className="flex h-11 w-full rounded-md border border-input bg-background/60 px-3 py-2 text-sm ring-offset-background transition-all placeholder:text-muted-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  placeholder="••••••••"
                />
              </div>

              <Button
                type="submit"
                className="w-full transition-transform active:scale-[0.98]"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Spinner /> Creating account…
                  </span>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
