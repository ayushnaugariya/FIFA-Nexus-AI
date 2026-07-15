// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { CrowdHeatmap } from '../components/CrowdHeatmap';
import type { ZoneSnapshot } from '../lib/crowdSim';

const zones: ZoneSnapshot[] = [
  { zoneId: 'north', zoneName: 'North Concourse', occupancyPercent: 92, level: 'high', trend: 'rising' },
  { zoneId: 'south', zoneName: 'South Concourse', occupancyPercent: 40, level: 'low', trend: 'steady' },
];

describe('CrowdHeatmap accessibility', () => {
  it('has no detectable axe violations', async () => {
    const { container } = render(<CrowdHeatmap zones={zones} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('exposes occupancy data as an accessible table, not color alone', () => {
    const { getByRole } = render(<CrowdHeatmap zones={zones} />);
    const table = getByRole('table');
    expect(table).toBeTruthy();
    expect(table.textContent).toContain('North Concourse');
    expect(table.textContent).toContain('92%');
    expect(table.textContent).toContain('high');
  });
});
