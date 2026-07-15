import { describe, expect, it } from 'vitest';
import { classifyDepartureSurge } from '../lib/agents/transportAgent';

describe('classifyDepartureSurge', () => {
  it('classifies final whistle as severe', () => {
    expect(classifyDepartureSurge('final_whistle')).toBe('severe');
  });

  it('classifies halftime as elevated', () => {
    expect(classifyDepartureSurge('halftime')).toBe('elevated');
  });

  it('classifies a goal as normal (no exit surge expected)', () => {
    expect(classifyDepartureSurge('goal_scored')).toBe('normal');
  });

  it('classifies no event as normal', () => {
    expect(classifyDepartureSurge(null)).toBe('normal');
  });
});
