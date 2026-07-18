import { VisionUploader } from '@/components/VisionUploader';
import { Card } from '@/components/Card';

export default function VisionPage() {
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-xl">
          👁️
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-chalk">Vision Inspector</h1>
          <p className="text-sm text-mist">
            Gemini multimodal vision · Crowd density · Hazard detection · Accessibility analysis
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card>
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 text-lg">
              📷
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-chalk">Analyze a Venue Photo</h2>
              <p className="text-xs text-mist">Upload any concourse, gate, or crowd image</p>
            </div>
          </div>
          <VisionUploader />
        </Card>

        {/* How it works sidebar */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">🔍 What AI Detects</p>
            <div className="space-y-3">
              {[
                { icon: '👥', label: 'Crowd Density', desc: 'Low / Moderate / High / Critical classification' },
                { icon: '⚠️', label: 'Safety Hazards', desc: 'Obstructions, spills, blocked exits, overcrowding' },
                { icon: '♿', label: 'Accessibility', desc: 'Ramp access, signage clarity, mobility barriers' },
                { icon: '📝', label: 'AI Summary', desc: 'Plain-language description of the scene' },
              ].map((item) => (
                <div key={item.label} className="flex gap-3">
                  <span className="mt-0.5 text-xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-chalk">{item.label}</p>
                    <p className="text-xs text-mist">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-mist">ℹ️ About Vision AI</p>
            <p className="text-xs text-mist leading-relaxed">
              Powered by <span className="text-chalk">Google Gemini&apos;s multimodal vision</span> — the same capability, without needing a separate CCTV pipeline. In production, this integrates directly with venue camera feeds.
            </p>
            <div className="mt-3 rounded-lg border border-floodlight/15 bg-floodlight/8 p-3 text-xs text-mist">
              🔒 Privacy first: The AI describes conditions only — it never identifies or profiles individuals.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
