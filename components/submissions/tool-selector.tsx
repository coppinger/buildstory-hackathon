"use client";

import { useState } from "react";
import type { AiTool } from "@/lib/db/schema";

interface ToolSelectorProps {
  tools: AiTool[];
  selectedIds: string[];
  onToggle: (toolId: string) => void;
  onAddCustom: (name: string) => Promise<{ id: string; name: string } | null>;
}

export function ToolSelector({
  tools,
  selectedIds,
  onToggle,
  onAddCustom,
}: ToolSelectorProps) {
  const [otherText, setOtherText] = useState("");
  const [adding, setAdding] = useState(false);

  const grouped = tools.reduce<Record<string, AiTool[]>>((acc, tool) => {
    const cat = tool.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tool);
    return acc;
  }, {});

  const handleAddCustom = async () => {
    const name = otherText.trim();
    if (!name || adding) return;
    setAdding(true);
    try {
      const result = await onAddCustom(name);
      if (result) {
        onToggle(result.id);
      }
      setOtherText("");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      {Object.entries(grouped).map(([category, categoryTools]) => (
        <div key={category}>
          <p className="text-xs uppercase tracking-[0.15em] text-muted-foreground/50 mb-3 font-mono">
            {category}
          </p>
          <div className="flex flex-wrap gap-2">
            {categoryTools.map((tool) => {
              const isSelected = selectedIds.includes(tool.id);
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => onToggle(tool.id)}
                  className={`px-3 py-2 text-xs font-mono border transition-all ${
                    isSelected
                      ? "bg-buildstory-500/15 text-buildstory-500 border-buildstory-500"
                      : "bg-background text-muted-foreground border-border hover:border-muted-foreground/50"
                  }`}
                >
                  {isSelected && "\u2713 "}
                  {tool.name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex gap-2 items-center">
        <input
          type="text"
          placeholder="Other tool not listed..."
          value={otherText}
          onChange={(e) => setOtherText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddCustom();
            }
          }}
          className="flex-1 px-3 py-2 text-xs font-mono bg-background border border-border text-foreground placeholder:text-muted-foreground/40 focus:border-buildstory-500 focus:outline-none transition-colors"
        />
        <span className="text-[10px] font-mono text-muted-foreground/40">
          \u21B5 to add
        </span>
      </div>
    </div>
  );
}
