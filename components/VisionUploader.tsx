'use client';

import { useRef, useState } from 'react';
import { Badge } from './Badge';

interface VisionAnalysis {
  crowdDensityEstimate: 'low' | 'moderate' | 'high' | 'critical';
  hazardsDetected: string[];
  accessibilityNotes: string[];
  summary: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const densityConfig = {
  low: { color: 'text-turf border-turf/30 bg-turf/10', icon: '🟢', label: 'Low Density' },
  moderate: { color: 'text-floodlight border-floodlight/30 bg-floodlight/10', icon: '🟡', label: 'Moderate' },
  high: { color: 'text-clay border-clay/30 bg-clay/10', icon: '🟠', label: 'High Density' },
  critical: { color: 'text-clay border-clay/30 bg-clay/20', icon: '🔴', label: 'CRITICAL' },
};

export function VisionUploader() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function processFile(file: File) {
    setError(null);
    setAnalysis(null);

    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Please choose a JPEG, PNG, or WebP image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5 MB.');
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const res = await fetch('/api/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not analyze the image.');
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not analyze the image.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  }

  const density = analysis ? densityConfig[analysis.crowdDensityEstimate] : null;

  return (
    <div className="space-y-5">
      {/* Drop zone */}
      <div
        className={`relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-floodlight bg-floodlight/10'
            : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]'
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-2xl">
          📷
        </div>
        <p className="text-sm font-medium text-chalk">Drop a concourse photo here</p>
        <p className="mt-1 text-xs text-mist">or click to browse — JPEG, PNG, WebP up to 5 MB</p>
        <p className="mt-2 text-[10px] text-mist/60">In production this reads directly from venue camera feeds</p>

        <input
          ref={inputRef}
          id="camera-frame"
          type="file"
          accept={ACCEPTED_TYPES.join(',')}
          onChange={handleFileChange}
          className="sr-only"
        />
      </div>

      {/* Preview */}
      {previewUrl && (
        <div className="relative rounded-2xl overflow-hidden border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Uploaded concourse frame for AI inspection"
            className="max-h-72 w-full object-cover"
          />
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-pitchnight/80 backdrop-blur-sm">
              <div className="h-10 w-10 rounded-full border-2 border-floodlight/30 border-t-floodlight animate-spin" />
              <p className="text-sm font-medium text-chalk">Nexus Vision is analyzing…</p>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-clay/30 bg-clay/10 p-4 text-sm text-clay" role="alert">
          ⚠️ {error}
        </div>
      )}

      {/* Analysis result */}
      {analysis && !isLoading && (
        <div className="animate-fade-in space-y-4 rounded-2xl border border-white/[0.06] bg-pitchnight2 p-5">
          {/* Density badge */}
          <div className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 ${density?.color}`}>
            <span>{density?.icon}</span>
            <span className="text-sm font-bold">{density?.label}</span>
          </div>

          {/* Summary */}
          <p className="text-sm text-chalk leading-relaxed">{analysis.summary}</p>

          {/* Hazards */}
          {analysis.hazardsDetected.length > 0 && (
            <div className="rounded-xl border border-clay/20 bg-clay/5 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-clay">⚠️ Hazards Detected</p>
              <ul className="space-y-1">
                {analysis.hazardsDetected.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-sm text-chalk">
                    <span className="mt-0.5 text-clay">•</span> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Accessibility */}
          {analysis.accessibilityNotes.length > 0 && (
            <div className="rounded-xl border border-floodlight/20 bg-floodlight/5 p-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-floodlight">♿ Accessibility Notes</p>
              <ul className="space-y-1">
                {analysis.accessibilityNotes.map((n) => (
                  <li key={n} className="flex items-start gap-2 text-sm text-chalk">
                    <span className="mt-0.5 text-floodlight">•</span> {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}
