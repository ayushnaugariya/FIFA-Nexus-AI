import { z } from 'zod';

export const SUPPORTED_LANGUAGE_CODES = [
  'en',
  'es',
  'fr',
  'pt',
  'ar',
  'hi',
  'zh',
  'ja',
  'ko',
  'de',
] as const;

export const conciergeRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty').max(1000),
  languageCode: z.enum(SUPPORTED_LANGUAGE_CODES).default('en'),
  stadiumId: z.string().trim().min(1).max(50),
});
export type ConciergeRequest = z.infer<typeof conciergeRequestSchema>;

export const incidentSchema = z.object({
  stadiumId: z.string().trim().min(1).max(50),
  zone: z.string().trim().min(1).max(50),
  reporterRole: z.enum(['volunteer', 'steward', 'medical', 'security', 'ops-manager']),
  description: z.string().trim().min(3).max(500),
});
export type IncidentInput = z.infer<typeof incidentSchema>;

export const transportRequestSchema = z.object({
  stadiumId: z.string().trim().min(1).max(50),
  originDescription: z.string().trim().min(1).max(200),
  kickoffMinutesFromNow: z.number().int().min(-180).max(600),
  mobilityNeeds: z.boolean().default(false),
});
export type TransportRequest = z.infer<typeof transportRequestSchema>;

export const sustainabilityRequestSchema = z.object({
  travelMode: z.enum(['walk', 'bike', 'public-transit', 'rideshare-shared', 'rideshare-solo', 'personal-car', 'flight']),
  distanceKm: z.number().min(0).max(20000),
  partySize: z.number().int().min(1).max(20).default(1),
});
export type SustainabilityRequest = z.infer<typeof sustainabilityRequestSchema>;

export const copilotRequestSchema = z.object({
  stadiumId: z.string().trim().min(1).max(50),
  operatorQuestion: z.string().trim().max(500).optional(),
});
export type CopilotRequest = z.infer<typeof copilotRequestSchema>;

export const visionRequestSchema = z.object({
  imageBase64: z.string().min(1).max(7_000_000), // ~5MB image as base64, plus headroom
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
});
export type VisionRequest = z.infer<typeof visionRequestSchema>;

export const eventRequestSchema = z.object({
  stadiumId: z.string().trim().min(1).max(50),
  eventType: z.enum(['goal_scored', 'halftime', 'final_whistle']),
});
export type EventRequest = z.infer<typeof eventRequestSchema>;

/**
 * Parses a request body against a schema and returns a discriminated result
 * instead of throwing, so every API route can handle validation failures
 * uniformly with a 400 and a client-safe error message.
 */
export function safeParseBody<S extends z.ZodTypeAny>(
  schema: S,
  body: unknown,
): { success: true; data: z.infer<S> } | { success: false; error: string } {
  const result = schema.safeParse(body);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const firstIssue = result.error.issues[0];
  return {
    success: false,
    error: firstIssue ? `${firstIssue.path.join('.')}: ${firstIssue.message}` : 'Invalid request body',
  };
}
