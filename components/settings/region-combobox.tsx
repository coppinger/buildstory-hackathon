"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { getRegionsForCountry, getRegionByCode } from "@/lib/regions";
import { Label } from "@/components/ui/label";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils";

interface RegionComboboxProps {
  countryCode: string;
  value: string;
  onChange: (code: string) => void;
}

export function RegionCombobox({
  countryCode,
  value,
  onChange,
}: RegionComboboxProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allRegions = useMemo(
    () => getRegionsForCountry(countryCode),
    [countryCode]
  );

  const filtered = useMemo(() => {
    if (!query) return allRegions;
    const q = query.toLowerCase();
    return allRegions.filter((r) => r.name.toLowerCase().includes(q));
  }, [query, allRegions]);

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 40,
    overscan: 5,
  });

  // Click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when filter changes
  useEffect(() => {
    setHighlightIndex(0);
  }, [filtered.length]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && highlightIndex >= 0) {
      virtualizer.scrollToIndex(highlightIndex, { align: "auto" });
    }
  }, [highlightIndex, isOpen, virtualizer]);

  // Reset when country changes
  useEffect(() => {
    setQuery("");
    setIsOpen(false);
  }, [countryCode]);

  const selectRegion = useCallback(
    (code: string) => {
      onChange(code);
      setQuery("");
      setIsOpen(false);
    },
    [onChange]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[highlightIndex]) {
        selectRegion(filtered[highlightIndex].code);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  // No regions available for this country
  if (allRegions.length === 0) return null;

  // Selected state
  if (value) {
    const selected = getRegionByCode(value);
    return (
      <div>
        <Label className="text-sm font-medium">
          Region <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <div className="mt-1.5 flex items-center gap-2 border border-input bg-transparent px-3 py-2 rounded-none">
          <span className="flex-1 text-base text-foreground truncate">
            {selected?.name ?? value}
          </span>
          <button
            type="button"
            onClick={() => {
              onChange("");
              setTimeout(() => inputRef.current?.focus(), 0);
            }}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Icon name="close" size="3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Label htmlFor="region" className="text-sm font-medium">
        Region <span className="text-muted-foreground text-xs">(optional)</span>
      </Label>
      <div className="relative mt-1.5">
        <input
          ref={inputRef}
          id="region"
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for your region..."
          autoComplete="off"
          className="flex h-12 w-full rounded-none border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] md:text-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Icon name="search" size="3.5" className="text-muted-foreground" />
        </div>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full max-h-[240px] overflow-auto border border-border bg-popover shadow-md rounded-md"
        >
          {filtered.length === 0 ? (
            <div className="px-3 py-3 text-sm text-muted-foreground">
              No regions found
            </div>
          ) : (
            <div
              style={{
                height: `${virtualizer.getTotalSize()}px`,
                width: "100%",
                position: "relative",
              }}
            >
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const region = filtered[virtualRow.index];
                return (
                  <button
                    key={region.code}
                    type="button"
                    onClick={() => selectRegion(region.code)}
                    onMouseEnter={() =>
                      setHighlightIndex(virtualRow.index)
                    }
                    className={cn(
                      "absolute left-0 w-full px-3 py-2 text-left text-base transition-colors cursor-pointer",
                      virtualRow.index === highlightIndex
                        ? "bg-accent text-accent-foreground"
                        : "text-popover-foreground hover:bg-accent/50"
                    )}
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    <span className="truncate">{region.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
