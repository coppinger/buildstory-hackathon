"use client";

import { useRef, useEffect, useTransition } from "react";
import { useQueryStates } from "nuqs";
import { searchSortParsers } from "@/lib/search-params";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

interface SearchSortBarProps {
  placeholder?: string;
}

export function SearchSortBar({ placeholder = "Search..." }: SearchSortBarProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [params, setParams] = useQueryStates(searchSortParsers, {
    shallow: false,
    startTransition,
  });

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Keep the input value in sync with URL params on initial render
  useEffect(() => {
    if (inputRef.current && params.q !== inputRef.current.value) {
      inputRef.current.value = params.q;
    }
  }, [params.q]);

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setParams({ q: value || null, page: 1 });
    }, 300);
  }

  function handleClear() {
    if (inputRef.current) inputRef.current.value = "";
    setParams({ q: null, page: 1 });
  }

  function handleSortToggle() {
    setParams({
      sort: params.sort === "newest" ? "oldest" : "newest",
      page: 1,
    });
  }

  return (
    <div className="mt-6 flex items-center gap-3">
      <div className="relative flex-1">
        <Icon
          name="search"
          size="4"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          defaultValue={params.q}
          onChange={handleSearchChange}
          className="pl-9 pr-9"
        />
        {params.q && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Icon name="close" size="4" />
          </button>
        )}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSortToggle}
        disabled={isPending}
        className="shrink-0 h-12 px-3 gap-1.5"
      >
        <Icon
          name={params.sort === "newest" ? "arrow_downward" : "arrow_upward"}
          size="4"
        />
        <span className="hidden sm:inline">
          {params.sort === "newest" ? "Newest" : "Oldest"}
        </span>
      </Button>
    </div>
  );
}
