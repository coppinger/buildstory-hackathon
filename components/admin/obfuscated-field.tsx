"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function obfuscate(value: string): string {
  if (!value || value.length <= 1) return value;
  return value
    .split(" ")
    .map((word) => {
      if (word.length <= 1) return word;
      if (word.length <= 3) return word[0] + "*".repeat(word.length - 1);
      return word[0] + "*".repeat(word.length - 2) + word[word.length - 1];
    })
    .join(" ");
}

function obfuscateEmail(email: string): string {
  if (!email) return email;
  const [local, domain] = email.split("@");
  if (!domain) return obfuscate(email);
  const masked =
    local[0] +
    "*".repeat(Math.max(local.length - 2, 1)) +
    (local.length > 1 ? local[local.length - 1] : "");
  return `${masked}@${domain}`;
}

function obfuscateId(id: string): string {
  if (!id || id.length <= 8) return "*".repeat(id?.length ?? 0);
  return id.slice(0, 5) + "..." + id.slice(-4);
}

interface ObfuscatedFieldProps {
  value: string;
  type?: "text" | "email" | "id";
}

export function ObfuscatedField({
  value,
  type = "text",
}: ObfuscatedFieldProps) {
  const [revealed, setRevealed] = useState(false);

  const masked =
    type === "email"
      ? obfuscateEmail(value)
      : type === "id"
        ? obfuscateId(value)
        : obfuscate(value);

  const display = revealed ? value : masked;

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(value);
  }, [value]);

  return (
    <span className="inline-flex items-center gap-1">
      <span
        className={
          revealed ? "font-mono text-sm" : "font-mono text-sm text-muted-foreground"
        }
      >
        {display}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => setRevealed(!revealed)}
        title={revealed ? "Hide" : "Reveal"}
      >
        <Icon
          name={revealed ? "visibility_off" : "visibility"}
          size="3.5"
        />
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={copyToClipboard}
        title="Copy to clipboard"
      >
        <Icon name="content_copy" size="3.5" />
      </Button>
    </span>
  );
}
