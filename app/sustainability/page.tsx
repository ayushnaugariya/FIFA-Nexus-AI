import { SustainabilityCalculator } from '@/components/SustainabilityCalculator';
import { Card } from '@/components/Card';

export default function SustainabilityPage() {
  return (
    <div>
      <h1 className="font-display text-3xl">Sustainability Agent</h1>
      <p className="mt-1 max-w-2xl text-sm text-mist">
        See the carbon footprint of your trip to the match and get one practical tip to lower it
        next time — no guilt, just useful math.
      </p>

      <div className="mt-6 max-w-xl">
        <Card>
          <SustainabilityCalculator />
        </Card>
      </div>
    </div>
  );
}
