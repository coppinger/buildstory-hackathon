"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Icon } from "@/components/ui/icon";
import {
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/app/(app)/roadmap/actions";
import type { FeatureBoardCategoryOption } from "@/lib/roadmap/queries";

const DEFAULT_COLORS = [
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#64748b", // slate
];

interface CategoryManagerProps {
  projectId: string;
  categories: FeatureBoardCategoryOption[];
}

export function CategoryManager({
  projectId,
  categories: initialCategories,
}: CategoryManagerProps) {
  const [expanded, setExpanded] = useState(false);
  const [categories, setCategories] =
    useState<FeatureBoardCategoryOption[]>(initialCategories);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    if (!newName.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await createCategory({
        projectId,
        name: newName.trim(),
        color: newColor,
      });
      if (result.success && result.data) {
        setCategories((prev) => [
          ...prev,
          {
            id: result.data!.id,
            name: newName.trim(),
            color: newColor,
            sortOrder: prev.length,
          },
        ]);
        setNewName("");
        // Cycle to next default color
        const idx = DEFAULT_COLORS.indexOf(newColor);
        setNewColor(DEFAULT_COLORS[(idx + 1) % DEFAULT_COLORS.length]);
      } else if (!result.success) {
        setError(result.error);
      }
    });
  }

  function handleStartEdit(cat: FeatureBoardCategoryOption) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setError("");
  }

  function handleSaveEdit() {
    if (!editingId || !editName.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await updateCategory({
        categoryId: editingId!,
        projectId,
        name: editName.trim(),
        color: editColor,
      });
      if (result.success) {
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingId
              ? { ...c, name: editName.trim(), color: editColor }
              : c
          )
        );
        setEditingId(null);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete(categoryId: string) {
    setError("");
    startTransition(async () => {
      const result = await deleteCategory({ categoryId, projectId });
      if (result.success) {
        setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      } else {
        setError(result.error);
      }
    });
  }

  if (!expanded) {
    return (
      <Button
        variant="outline"
        onClick={() => setExpanded(true)}
        className="gap-1.5"
      >
        <Icon name="category" size="4" />
        Manage Categories
      </Button>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Categories</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(false)}
        >
          <Icon name="close" size="4" />
        </Button>
      </div>

      {/* Existing categories */}
      {categories.length > 0 && (
        <div className="space-y-2">
          {categories.map((cat) =>
            editingId === cat.id ? (
              <div key={cat.id} className="flex items-center gap-2">
                <input
                  type="color"
                  value={editColor}
                  onChange={(e) => setEditColor(e.target.value)}
                  className="h-8 w-8 rounded border border-border cursor-pointer"
                />
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-8 flex-1"
                  maxLength={50}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleSaveEdit}
                  disabled={isPending || !editName.trim()}
                >
                  <Icon name="check" size="4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setEditingId(null)}
                  disabled={isPending}
                >
                  <Icon name="close" size="4" />
                </Button>
              </div>
            ) : (
              <div
                key={cat.id}
                className="flex items-center gap-2 group"
              >
                <span
                  className="inline-block h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm flex-1">{cat.name}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleStartEdit(cat)}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Icon name="edit" size="3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(cat.id)}
                    disabled={isPending}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Icon name="delete" size="3.5" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>
      )}

      {/* Add new category */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={newColor}
          onChange={(e) => setNewColor(e.target.value)}
          className="h-8 w-8 rounded border border-border cursor-pointer"
        />
        <Input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name"
          className="h-8 flex-1"
          maxLength={50}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleCreate();
            }
          }}
        />
        <Button
          onClick={handleCreate}
          disabled={isPending || !newName.trim()}
        >
          Add
        </Button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
