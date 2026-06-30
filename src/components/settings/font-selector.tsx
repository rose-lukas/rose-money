"use client";

import { useEffect, useState } from "react";

const FONTS = [
  { id: "geist", label: "Geist", className: "font-[family-name:var(--font-geist-sans)]" },
  { id: "system", label: "System", className: "font-[-apple-system,BlinkMacSystemFont,sans-serif]" },
  { id: "serif", label: "Serif", className: "font-[Georgia,serif]" },
] as const;

type FontId = (typeof FONTS)[number]["id"];

export function FontSelector() {
  const [selected, setSelected] = useState<FontId>("geist");

  useEffect(() => {
    const stored = localStorage.getItem("font") as FontId | null;
    if (stored && FONTS.some((f) => f.id === stored)) {
      setSelected(stored);
    }
  }, []);

  function handleChange(fontId: FontId) {
    setSelected(fontId);
    localStorage.setItem("font", fontId);
    // Apply to document
    const root = document.documentElement;
    FONTS.forEach((f) => root.classList.remove(`font-${f.id}`));
    root.classList.add(`font-${fontId}`);
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div>
        <h3 className="text-base font-semibold">Font Style</h3>
        <p className="text-sm text-muted-foreground">Choose the app font.</p>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {FONTS.map((font) => (
          <button
            key={font.id}
            type="button"
            onClick={() => handleChange(font.id)}
            className={`rounded-lg border p-3 text-center transition-colors ${
              selected === font.id
                ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                : "hover:bg-accent"
            }`}
          >
            <span className={`text-lg ${font.className}`}>Aa</span>
            <p className="mt-1 text-xs text-muted-foreground">{font.label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
