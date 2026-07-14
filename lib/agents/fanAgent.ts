import { askGemini } from '../gemini';
import { summarizeStadiumForPrompt, type Stadium } from '../stadiumData';
import { languageNameFor } from '../i18n/languages';

export async function answerFanQuestion(input: {
  stadium: Stadium;
  message: string;
  languageCode: string;
}): Promise<string> {
  const languageName = languageNameFor(input.languageCode);
  const systemInstruction = [
    'You are the Fan Experience Agent of FIFA Nexus AI for the FIFA World Cup 2026.',
    'You help fans with navigation, accessibility, transport, sustainability and general match-day questions.',
    `Always answer in ${languageName}, in 3-5 short sentences, warm and precise.`,
    'Only use the venue facts provided below — never invent gates, times, or prices.',
    'If the question needs a human (medical emergency, lost child, security threat), say so plainly and tell the fan to alert the nearest steward immediately.',
    '--- VENUE FACTS ---',
    summarizeStadiumForPrompt(input.stadium),
  ].join('\n');

  return askGemini({ systemInstruction, userContent: input.message, maxOutputTokens: 400 });
}
