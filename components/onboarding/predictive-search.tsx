"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  label: string;
  sublabel?: string;
}

interface PredictiveSearchProps {
  label: string;
  placeholder: string;
  onSearch: (query: string) => Promise<SearchResult[]>;
  onSelect: (result: SearchResult) => void;
  selected: SearchResult | null;
  onClear: () => void;
  className?: string;
}

export function PredictiveSearch({
  label,
  placeholder,
  onSearch,
  onSelect,
  selected,
  onClear,
  className,
}: PredictiveSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const doSearch = useCallback(
    async (q: string) => {
      if (q.length < 2) {
        setResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const data = await onSearch(q);
        setResults(data);
        setIsOpen(data.length > 0);
      } finally {
        setIsSearching(false);
      }
    },
    [onSearch]
  );

  useEffect(() => {
    if (selected) return;
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch, selected]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      onSelect(results[highlightIndex]);
      setIsOpen(false);
      setQuery("");
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  }

  if (selected) {
    return (
      <div className={className}>
        <Label className="text-neutral-400 text-base">{label}</Label>
        <div className="mt-1.5 flex items-center gap-2 border border-neutral-700 bg-neutral-900/50 px-3 py-2">
          <span className="flex-1 text-lg text-white truncate">
            {selected.label}
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
          >
            <Icon name="close" size="3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Label className="text-neutral-400 text-base">{label}</Label>
      <div className="relative mt-1.5">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightIndex(-1);
          }}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-white/5 border-neutral-700 text-white placeholder:text-neutral-600"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Icon
              name="progress_activity"
              size="3.5"
              className="animate-spin text-neutral-500"
            />
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full border border-neutral-700 bg-neutral-900 shadow-lg">
          {results.map((result, i) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                onSelect(result);
                setIsOpen(false);
                setQuery("");
              }}
              className={cn(
                "w-full px-3 py-2 text-left text-lg transition-colors cursor-pointer",
                i === highlightIndex
                  ? "bg-neutral-800 text-white"
                  : "text-neutral-300 hover:bg-neutral-800/50"
              )}
            >
              <span className="block truncate">{result.label}</span>
              {result.sublabel && (
                <span className="block truncate text-base text-neutral-500">
                  {result.sublabel}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
