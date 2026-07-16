// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { IncidentForm } from '../components/IncidentForm';

const ZONES = [
  { id: 'north', name: 'North Concourse' },
  { id: 'south', name: 'South Concourse' },
];

describe('IncidentForm accessibility', () => {
  it('has no detectable axe violations', async () => {
    const { container } = render(<IncidentForm stadiumId="metlife-nj" zones={ZONES} onCreated={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('every form field has an associated accessible label', () => {
    const { getByLabelText } = render(<IncidentForm stadiumId="metlife-nj" zones={ZONES} onCreated={() => {}} />);
    expect(getByLabelText(/zone/i)).toBeTruthy();
    expect(getByLabelText(/your role/i)).toBeTruthy();
    expect(getByLabelText(/what's happening/i)).toBeTruthy();
  });

  it('the zone field is a dropdown of real zones, not free text (keeps volunteer need-scoring in sync)', () => {
    const { getByLabelText } = render(<IncidentForm stadiumId="metlife-nj" zones={ZONES} onCreated={() => {}} />);
    const zoneField = getByLabelText(/zone/i) as HTMLSelectElement;
    expect(zoneField.tagName).toBe('SELECT');
    expect(Array.from(zoneField.options).map((o) => o.value)).toEqual(['North Concourse', 'South Concourse']);
  });
});
