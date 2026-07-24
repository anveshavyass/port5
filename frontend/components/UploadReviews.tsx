"use client";

import { useState } from "react";

import { uploadReviews, type UploadResult } from "@/lib/api";
import { Button } from "@/components/ui/button";

type Props = {
  /** Called after a successful upload, so a parent dashboard can refetch. */
  onUploaded?: (result: UploadResult) => void;
};

export function UploadReviews({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await uploadReviews(file);
      setResult(res);
      setFile(null);
      onUploaded?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-2 border-t border-border pt-4">
      <p className="text-sm font-medium">Or bulk-upload a CSV / JSON file</p>
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="file"
          accept=".csv,.json"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
            setError(null);
          }}
          className="text-sm text-muted-foreground"
        />
        <Button type="button" disabled={!file || loading} onClick={handleUpload}>
          {loading ? "Uploading..." : "Upload"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Expects columns/keys: Date, Rating, Review. Try the samples in data/demo/.
      </p>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {result && (
        <p className="rounded-md bg-muted px-3 py-2 text-sm text-foreground">
          {result.inserted} inserted, {result.failed} failed, out of {result.total} rows.
        </p>
      )}
    </div>
  );
}
