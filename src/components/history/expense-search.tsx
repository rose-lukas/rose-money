"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { searchExpenses } from "@/app/(authenticated)/history/actions";
import { formatCurrency, formatDate } from "@/lib/format";

interface SearchResult {
  id: string;
  date: string;
  amount: number;
  store: string | null;
  description: string | null;
  category_name: string;
  spent_by_name: string;
}

interface Props {
  categories: { id: string; name: string }[];
  profiles: { id: string; display_name: string }[];
}

export function ExpenseSearch({ categories, profiles }: Props) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [spentBy, setSpentBy] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searched, setSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  function doSearch(p: number = 1) {
    startTransition(async () => {
      const res = await searchExpenses({
        query: query || undefined,
        categoryId: categoryId || undefined,
        spentBy: spentBy || undefined,
        page: p,
      });
      setResults(res.expenses as SearchResult[]);
      setTotal(res.total);
      setPage(res.page);
      setTotalPages(res.totalPages);
      setSearched(true);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Search store or notes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm flex-1 min-w-[180px]"
        />
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={spentBy}
          onChange={(e) => setSpentBy(e.target.value)}
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="">All People</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.display_name}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={() => doSearch()} disabled={isPending}>
          {isPending ? "Searching..." : "Search"}
        </Button>
      </div>

      {searched && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {total} result{total === 1 ? "" : "s"} found
          </p>

          {results.length > 0 ? (
            <>
              <div className="rounded-md border divide-y">
                {results.map((e) => (
                  <div key={e.id} className="px-3 py-2 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-medium">{e.store || e.description || "—"}</span>
                        <span className="text-xs rounded-full bg-muted px-2 py-0.5">
                          {e.category_name}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(e.date)} · {e.spent_by_name}
                        {e.description && e.store ? ` · ${e.description}` : ""}
                      </div>
                    </div>
                    <span className="text-sm font-medium tabular-nums shrink-0">
                      {formatCurrency(Number(e.amount))}
                    </span>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page <= 1 || isPending}
                    onClick={() => doSearch(page - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages || isPending}
                    onClick={() => doSearch(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No expenses match your filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
