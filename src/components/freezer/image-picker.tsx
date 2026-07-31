"use client";

import { useState, useTransition } from "react";
import { searchItemImages } from "@/app/(rose)/freezer/actions";
import type { ImageSearchResult } from "@/lib/image-search";

export function ImagePicker({
  query,
  selectedUrl,
  onSelect,
}: Readonly<{
  query: string;
  selectedUrl: string | null;
  onSelect: (url: string | null) => void;
}>) {
  const [results, setResults] = useState<ImageSearchResult[]>([]);
  const [page, setPage] = useState(0);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(nextPage: number) {
    setError(null);
    start(async () => {
      const r = await searchItemImages(query, nextPage);
      if (r.error) {
        setError(r.error);
        setResults([]);
        setSearched(true);
        return;
      }
      if (r.results.length === 0) {
        // Nothing on this page — fall back to the first page of results.
        if (nextPage > 0) {
          setPage(0);
          run(0);
          return;
        }
        setError("No pictures found. Try different words.");
      }
      setResults(r.results);
      setPage(nextPage);
      setSearched(true);
    });
  }

  const canSearch = query.trim().length > 0 && !pending;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => run(0)}
          disabled={!canSearch}
          className="flex-1 rounded-xl border-2 border-slate-800 py-2 text-sm font-semibold text-slate-800 disabled:opacity-40 dark:text-slate-100"
        >
          {pending && !searched ? "Searching…" : "Find a picture"}
        </button>
        {searched && (
          <button
            type="button"
            onClick={() => run(page + 1)}
            disabled={!canSearch}
            className="rounded-xl border-2 border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40 dark:text-slate-300"
          >
            {pending ? "…" : "Show others"}
          </button>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {results.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-2">
            {results.map((result) => {
              const isSelected = selectedUrl === result.url;
              return (
                <button
                  key={result.url}
                  type="button"
                  onClick={() => onSelect(isSelected ? null : result.url)}
                  aria-pressed={isSelected}
                  className={`overflow-hidden rounded-xl border-4 bg-white transition-transform active:scale-95 ${
                    isSelected
                      ? "border-slate-800 shadow-[3px_3px_0_rgba(15,23,42,0.9)]"
                      : "border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={result.thumbnailUrl}
                    alt={result.title}
                    referrerPolicy="no-referrer"
                    className="h-20 w-full object-contain"
                  />
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedUrl
              ? "Tap the picture again to unpick it and keep the emoji."
              : "Pick one, or skip to use an emoji instead."}
          </p>
        </>
      )}
    </div>
  );
}
