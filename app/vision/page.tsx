import { VisionUploader } from '@/components/VisionUploader';
import { Card } from '@/components/Card';

export default function VisionPage() {
  return (
    <div>
      <h1 className="font-display text-3xl">Safety Agent — Vision Inspector</h1>
      <p className="mt-1 max-w-2xl text-sm text-mist">
        Upload a concourse or gate photo and the Safety &amp; Emergency Agent reads it for crowd density,
        visible hazards, and accessibility conditions — using Gemini&apos;s native multimodal vision rather
        than a separate camera-vision pipeline.
      </p>

      <div className="mt-6 max-w-xl">
        <Card>
          <VisionUploader />
        </Card>
      </div>
    </div>
  );
}
