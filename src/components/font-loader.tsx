"use client";

import { useEffect } from "react";

export function FontLoader() {
  useEffect(() => {
    const font = localStorage.getItem("font");
    if (font && font !== "geist") {
      document.documentElement.classList.add(`font-${font}`);
    }
  }, []);

  return null;
}
