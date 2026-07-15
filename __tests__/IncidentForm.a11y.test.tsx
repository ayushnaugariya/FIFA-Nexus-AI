// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { IncidentForm } from '../components/IncidentForm';

describe('IncidentForm accessibility', () => {
  it('has no detectable axe violations', async () => {
    const { container } = render(<IncidentForm stadiumId="metlife-nj" onCreated={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('every form field has an associated accessible label', () => {
    const { getByLabelText } = render(<IncidentForm stadiumId="metlife-nj" onCreated={() => {}} />);
    expect(getByLabelText(/zone/i)).toBeTruthy();
    expect(getByLabelText(/your role/i)).toBeTruthy();
    expect(getByLabelText(/what's happening/i)).toBeTruthy();
  });
});
