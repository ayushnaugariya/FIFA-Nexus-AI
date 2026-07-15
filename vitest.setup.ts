import { afterEach, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Without this, DOM trees from earlier tests in the same file persist,
// causing duplicate-landmark false positives in later assertions/axe runs.
afterEach(() => {
  cleanup();
});
