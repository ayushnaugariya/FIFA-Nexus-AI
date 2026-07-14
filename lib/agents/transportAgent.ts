import { askGemini } from '../gemini';
import { summarizeStadiumForPrompt, type Stadium } from '../stadiumData';
import type { MatchEventType } from '../eventSimulator';

export async function recommendTransport(input: {
  stadium: Stadium;
  originDescription: string;
  kickoffMinutesFromNow: number;
  mobilityNeeds: boolean;
}): Promise<string> {
  const systemInstruction = [
    'You are the Transport Intelligence Agent of FIFA Nexus AI, planning fan travel for the FIFA World Cup 2026.',
    'Recommend the single best transport option and one backup, using only the venue facts given.',
    'If mobilityNeeds is true, prioritize step-free, accessible options and say so explicitly.',
    'Answer in 3-4 short sentences, plain language, no invented schedules or prices.',
    '--- VENUE FACTS ---',
    summarizeStadiumForPrompt(input.stadium),
  ].join('\n');

  const userContent = JSON.stringify({
    originDescription: input.originDescription,
    kickoffMinutesFromNow: input.kickoffMinutesFromNow,
    mobilityNeeds: input.mobilityNeeds,
  });

  return askGemini({ systemInstruction, userContent, maxOutputTokens: 250 });
}

export type DepartureSurgeLevel = 'normal' | 'elevated' | 'severe';

/**
 * Pure classification the transport authority dashboard can key off of
 * without waiting on an AI call — matches the exit-demand shape encoded in
 * lib/eventSimulator.ts (full-time produces the largest surge).
 */
export function classifyDepartureSurge(eventType: MatchEventType | null): DepartureSurgeLevel {
  if (eventType === 'final_whistle') return 'severe';
  if (eventType === 'halftime') return 'elevated';
  return 'normal';
}
