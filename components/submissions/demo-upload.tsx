"use client";

import { useRef, useState, useCallback } from "react";

interface DemoUploadProps {
  onUploadComplete: (publicUrl: string, mediaType: "image" | "video") => void;
  onRemove: () => void;
  initialUrl?: string | null;
  initialMediaType?: "image" | "video" | null;
}

export function DemoUpload({
  onUploadComplete,
  onRemove,
  initialUrl,
  initialMediaType,
}: DemoUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    initialUrl ?? null
  );
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(
    initialMediaType ?? null
  );
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      setProgress(0);
      setFileName(file.name);

      try {
        // Get presigned URL
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType: file.type }),
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? "Upload failed");
        }

        const { uploadUrl, publicUrl } = await res.json();

        // Upload directly to R2
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadUrl);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        };

        await new Promise<void>((resolve, reject) => {
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              reject(new Error("Upload failed"));
            }
          };
          xhr.onerror = () => reject(new Error("Upload failed"));
          xhr.send(file);
        });

        const type = file.type.startsWith("video/") ? "video" : "image";
        setPreviewUrl(publicUrl);
        setMediaType(type);
        onUploadComplete(publicUrl, type);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
        setFileName(null);
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete]
  );

  const handleFile = useCallback(
    (file: File | undefined) => {
      if (!file) return;
      uploadFile(file);
    },
    [uploadFile]
  );

  const handleRemove = () => {
    setPreviewUrl(null);
    setMediaType(null);
    setFileName(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
    onRemove();
  };

  const hasFile = previewUrl !== null;

  return (
    <div>
      <div
        onClick={() => !hasFile && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={`border transition-all ${
          hasFile
            ? "border-border p-4"
            : dragOver
              ? "border-dashed border-buildstory-500 bg-buildstory-500/5 p-8 cursor-pointer"
              : "border-dashed border-border p-8 cursor-pointer hover:border-muted-foreground/50"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {uploading ? (
          <div className="text-center">
            <p className="text-xs font-mono text-muted-foreground mb-2">
              Uploading {fileName}...
            </p>
            <div className="w-full bg-border h-1">
              <div
                className="bg-buildstory-500 h-1 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : hasFile ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {mediaType === "image" ? (
                <span className="text-sm text-muted-foreground">Image</span>
              ) : (
                <span className="text-sm text-muted-foreground">Video</span>
              )}
              <span className="text-xs font-mono text-muted-foreground truncate">
                {fileName ?? "Uploaded file"}
              </span>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="text-[10px] font-mono text-muted-foreground uppercase tracking-[0.1em] hover:text-foreground transition-colors"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="text-center">
            <p className="text-xs font-mono text-muted-foreground mb-1">
              Drop an image or video, or click to browse
            </p>
            <p className="text-[10px] font-mono text-muted-foreground/40">
              Screenshot, demo recording, etc.
            </p>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs font-mono text-destructive mt-2">{error}</p>
      )}
    </div>
  );
}
