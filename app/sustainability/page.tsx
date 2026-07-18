import { SustainabilityCalculator } from '@/components/SustainabilityCalculator';
import { Card } from '@/components/Card';

export default function SustainabilityPage() {
  return (
    <div>
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-turf/20 bg-turf/10 text-xl">
          🌿
        </div>
        <div>
          <h1 className="font-display text-3xl font-bold text-chalk">Sustainability Agent</h1>
          <p className="text-sm text-mist">
            Carbon footprint calculator · Eco travel tips · Venue resource monitoring
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <Card glow="green">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-turf/15 border border-turf/20 text-lg">
              🌍
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-chalk">Carbon Footprint Calculator</h2>
              <p className="text-xs text-mist">Useful math, no guilt</p>
            </div>
          </div>
          <SustainabilityCalculator />
        </Card>

        {/* Side facts */}
        <div className="space-y-4">
          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-turf">🌱 Green Impact</p>
            <div className="space-y-4">
              {[
                { icon: '🚇', stat: '75%', desc: 'lower emissions than a solo car trip if you take public transit' },
                { icon: '👥', stat: '4×', desc: 'fewer emissions per person when 4 people share a rideshare' },
                { icon: '🚶', stat: '0 kg', desc: 'CO₂ emitted when you walk or cycle to the match' },
              ].map((item) => (
                <div key={item.desc} className="flex gap-3">
                  <span className="mt-0.5 text-xl">{item.icon}</span>
                  <div>
                    <span className="font-display text-lg font-bold text-turf">{item.stat}</span>
                    <p className="text-xs text-mist">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-mist">🏟️ Venue Sustainability</p>
            <ul className="space-y-2 text-sm text-mist">
              {[
                '100% renewable energy target',
                'Zero single-use plastics in food courts',
                'Real-time waste sorting stations',
                'Carbon offset for all operations',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="mt-0.5 text-turf">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
