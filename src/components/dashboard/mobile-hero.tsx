"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/format";

interface Props {
  greeting: string;
  firstName: string;
  monthName: string;
  remaining: number;
  totalSpent: number;
  budgetAfterFixed: number;
  spentPercent: number;
  totalIncome: number;
  totalFixed: number;
  totalFixedWithOverdraft: number;
}

export function MobileHero({
  greeting,
  firstName,
  monthName,
  remaining,
  totalSpent,
  budgetAfterFixed,
  spentPercent,
  totalIncome,
  totalFixed,
  totalFixedWithOverdraft,
}: Props) {
  const [phase, setPhase] = useState(0); // 0=hidden, 1=greeting typing, 2=name typing, 3=budget fade, 4=rest fade
  const [greetingText, setGreetingText] = useState("");
  const [nameText, setNameText] = useState("");

  const fullGreeting = `${greeting},`;
  const fullName = firstName;

  useEffect(() => {
    // Phase 1: type greeting
    const startDelay = setTimeout(() => setPhase(1), 200);
    return () => clearTimeout(startDelay);
  }, []);

  useEffect(() => {
    if (phase === 1) {
      if (greetingText.length < fullGreeting.length) {
        const t = setTimeout(
          () => setGreetingText(fullGreeting.slice(0, greetingText.length + 1)),
          45
        );
        return () => clearTimeout(t);
      } else {
        // Done typing greeting, start name
        const t = setTimeout(() => setPhase(2), 150);
        return () => clearTimeout(t);
      }
    }
  }, [phase, greetingText, fullGreeting]);

  useEffect(() => {
    if (phase === 2) {
      if (nameText.length < fullName.length) {
        const t = setTimeout(
          () => setNameText(fullName.slice(0, nameText.length + 1)),
          55
        );
        return () => clearTimeout(t);
      } else {
        // Done typing name, show budget
        const t = setTimeout(() => setPhase(3), 400);
        return () => clearTimeout(t);
      }
    }
  }, [phase, nameText, fullName]);

  useEffect(() => {
    if (phase === 3) {
      const t = setTimeout(() => setPhase(4), 300);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="sm:hidden flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] -mt-2">
      {/* Greeting */}
      <div className="text-center mb-12">
        <p className="text-2xl text-muted-foreground h-8">
          {greetingText}
          {phase === 1 && (
            <span className="inline-block w-[2px] h-5 bg-muted-foreground/60 ml-0.5 animate-pulse align-middle" />
          )}
        </p>
        <h1 className="text-4xl font-bold tracking-tight mt-1 h-12">
          {nameText}
          {phase === 2 && (
            <span className="inline-block w-[2px] h-8 bg-foreground/60 ml-0.5 animate-pulse align-middle" />
          )}
        </h1>
      </div>

      {/* Remaining budget */}
      <div
        className={`text-center space-y-3 transition-all duration-700 ease-out ${
          phase >= 3
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {monthName} Remaining
        </p>
        <p
          className={`text-5xl font-extrabold tracking-tight ${
            remaining >= 0
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {formatCurrency(remaining)}
        </p>

        {budgetAfterFixed > 0 && (
          <div className="mx-auto max-w-[180px]">
            <div className="h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  spentPercent > 90
                    ? "bg-red-500"
                    : spentPercent > 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: phase >= 3 ? `${Math.min(spentPercent, 100)}%` : "0%" }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2">
              {formatCurrency(totalSpent)} of {formatCurrency(budgetAfterFixed)} spent
            </p>
          </div>
        )}
      </div>

      {/* Add expense + stats */}
      <div
        className={`mt-10 w-full space-y-6 transition-all duration-700 ease-out delay-200 ${
          phase >= 4
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-6"
        }`}
      >
        <div className="flex justify-center">
          <Link
            href="/expenses/new"
            className="flex items-center justify-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
            Add Expense
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl border p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Income</p>
            <p className="text-sm font-bold text-green-600 dark:text-green-400 mt-0.5">
              {formatCurrency(totalIncome)}
            </p>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Fixed</p>
            <p className="text-sm font-bold text-muted-foreground mt-0.5">
              {formatCurrency(totalFixedWithOverdraft)}
            </p>
          </div>
          <div className="rounded-xl border p-3 text-center">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Spent</p>
            <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-0.5">
              {formatCurrency(totalSpent)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
