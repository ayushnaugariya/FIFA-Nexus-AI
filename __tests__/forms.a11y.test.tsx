// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { TransportPlanner } from '../components/TransportPlanner';
import { SustainabilityCalculator } from '../components/SustainabilityCalculator';

describe('TransportPlanner accessibility', () => {
  it('has no detectable axe violations', async () => {
    const { container } = render(<TransportPlanner stadiumId="metlife-nj" />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the accessibility-needs checkbox has an accessible label', () => {
    const { getByLabelText } = render(<TransportPlanner stadiumId="metlife-nj" />);
    expect(getByLabelText(/step-free.*accessible transport/i)).toBeTruthy();
  });
});

describe('SustainabilityCalculator accessibility', () => {
  it('has no detectable axe violations', async () => {
    const { container } = render(<SustainabilityCalculator />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
