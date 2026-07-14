'use client';

import { useState } from 'react';
import { Badge } from './Badge';
import { LoadingSpinner } from './LoadingSpinner';

interface VisionAnalysis {
  crowdDensityEstimate: 'low' | 'moderate' | 'high' | 'critical';
  hazardsDetected: string[];
  accessibilityNotes: string[];
  summary: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export function VisionUploader() {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<VisionAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
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

  return (
    <div>
      <label htmlFor="camera-frame" className="mb-1 block text-sm font-medium text-mist">
        Upload a concourse or gate photo
      </label>
      <input
        id="camera-frame"
        type="file"
        accept={ACCEPTED_TYPES.join(',')}
        onChange={handleFileChange}
        className="block w-full text-sm text-chalk file:mr-3 file:rounded-card file:border-0 file:bg-floodlight file:px-3 file:py-2 file:text-sm file:font-semibold file:text-pitchnight"
      />
      <p className="mt-1 text-xs text-mist">
        JPEG, PNG, or WebP, up to 5 MB. In production this would read directly from a venue camera feed.
      </p>

      {previewUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={previewUrl} alt="Uploaded concourse frame for AI inspection" className="mt-4 max-h-64 rounded-card border border-white/10" />
      )}

      <div className="mt-4" aria-live="polite">
        {isLoading && <LoadingSpinner label="Nexus vision is analyzing the frame…" />}
        {error && <p role="alert" className="text-sm text-clay">{error}</p>}
        {analysis && !isLoading && (
          <div className="space-y-2 rounded-card border border-white/10 bg-pitchnight2 p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-mist">Crowd density:</span>
              <Badge level={analysis.crowdDensityEstimate}>{analysis.crowdDensityEstimate}</Badge>
            </div>
            <p className="text-sm text-chalk">{analysis.summary}</p>
            {analysis.hazardsDetected.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-clay">Hazards</p>
                <ul className="list-inside list-disc text-sm text-chalk">
                  {analysis.hazardsDetected.map((h) => (
                    <li key={h}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
            {analysis.accessibilityNotes.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-floodlight">Accessibility notes</p>
                <ul className="list-inside list-disc text-sm text-chalk">
                  {analysis.accessibilityNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/jpeg;base64," prefix — the API wants raw base64.
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.readAsDataURL(file);
  });
}
