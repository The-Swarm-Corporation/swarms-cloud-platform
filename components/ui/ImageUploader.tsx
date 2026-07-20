'use client';

import React, { useCallback, useRef, useState } from 'react';
import { ImagePlus, X, AlertCircle, Loader2 } from 'lucide-react';

export type UploadedImage = {
  id: string;
  name: string;
  size: number;
  /** Full data URL - `data:image/png;base64,...` */
  dataUrl: string;
  /** Just the base64 payload, without the `data:...,` prefix. */
  base64: string;
  mime: string;
};

interface ImageUploaderProps {
  value: UploadedImage[];
  onChange: (next: UploadedImage[]) => void;
  /** Max files. Default 8. */
  maxFiles?: number;
  /** Max single-file size in bytes. Default 5 MB. */
  maxBytes?: number;
  label?: string;
  helperText?: string;
  className?: string;
}

const DEFAULT_MAX_FILES = 8;
const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

function fileToImage(file: File): Promise<UploadedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const commaIdx = dataUrl.indexOf(',');
      const base64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
      resolve({
        id:
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random()}`,
        name: file.name,
        size: file.size,
        dataUrl,
        base64,
        mime: file.type || 'image/png',
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageUploader({
  value,
  onChange,
  maxFiles = DEFAULT_MAX_FILES,
  maxBytes = DEFAULT_MAX_BYTES,
  label = 'Images',
  helperText,
  className = '',
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      setError(null);
      const list = Array.from(files);
      if (list.length === 0) return;

      const remaining = maxFiles - value.length;
      if (remaining <= 0) {
        setError(`Maximum ${maxFiles} images.`);
        return;
      }

      const usable = list.slice(0, remaining);
      const rejected: string[] = [];
      const accepted: File[] = [];
      for (const f of usable) {
        if (!f.type.startsWith('image/')) {
          rejected.push(`${f.name} (not an image)`);
          continue;
        }
        if (f.size > maxBytes) {
          rejected.push(`${f.name} (>${formatBytes(maxBytes)})`);
          continue;
        }
        accepted.push(f);
      }

      if (rejected.length) {
        setError(`Skipped: ${rejected.join(', ')}`);
      }

      if (accepted.length === 0) return;

      setLoading(true);
      try {
        const images = await Promise.all(accepted.map(fileToImage));
        onChange([...value, ...images]);
      } catch {
        setError('Failed to read one or more files.');
      } finally {
        setLoading(false);
      }
    },
    [maxFiles, maxBytes, value, onChange]
  );

  const handleRemove = (id: string) => {
    onChange(value.filter((img) => img.id !== id));
    if (error) setError(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length) {
      void handleFiles(e.dataTransfer.files);
    }
  };

  const handlePick = () => inputRef.current?.click();

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </label>
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {value.length}/{maxFiles}
          </span>
        </div>
      )}

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handlePick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handlePick();
          }
        }}
        className={`relative flex items-center justify-center gap-3 min-h-[80px] px-4 py-3 rounded-md border border-dashed cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
          dragOver
            ? 'border-accent bg-accent/5'
            : 'border-border bg-subtle/40 hover:border-border-strong hover:bg-subtle'
        }`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
        ) : (
          <ImagePlus className="w-4 h-4 text-muted-foreground" />
        )}
        <div className="text-xs text-muted-foreground text-center">
          <span className="text-foreground font-medium">Click to upload</span>{' '}
          or drag and drop
          <div className="text-[10px] mt-0.5">
            PNG, JPG, WEBP, GIF · up to {formatBytes(maxBytes)} each
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(e) => {
            if (e.target.files) void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-1.5 text-[11px] text-warning">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {value.length > 0 && (
        <ul className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-1">
          {value.map((img) => (
            <li
              key={img.id}
              className="relative group aspect-square rounded-md overflow-hidden border border-border bg-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.dataUrl}
                alt={img.name}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(img.id);
                }}
                aria-label={`Remove ${img.name}`}
                title="Remove"
                className="absolute top-1 right-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-background/90 border border-border text-muted-foreground hover:text-danger hover:border-danger/40 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <X className="w-3 h-3" />
              </button>
              <div className="absolute bottom-0 inset-x-0 px-1.5 py-1 bg-background/85 text-[10px] text-muted-foreground border-t border-border truncate">
                {formatBytes(img.size)}
              </div>
            </li>
          ))}
        </ul>
      )}

      {helperText && (
        <p className="text-[11px] text-muted-foreground">{helperText}</p>
      )}
    </div>
  );
}
