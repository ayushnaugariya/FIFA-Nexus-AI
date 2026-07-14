/**
 * Centralized environment access.
 *
 * Reading `process.env` directly all over the codebase makes it easy to
 * accidentally leak a secret to the client bundle or to typo a variable
 * name and fail silently. Everything funnels through here instead.
 */

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    // Thrown only on the server — never surfaced verbatim to the client.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  /** Server-only. Never import this module from a "use client" component. */
  get geminiApiKey(): string {
    return required('GEMINI_API_KEY');
  },
  get geminiModel(): string {
    return process.env.GEMINI_MODEL?.trim() || 'gemini-1.5-flash';
  },
  get rateLimitPerMinute(): number {
    const parsed = Number(process.env.RATE_LIMIT_PER_MINUTE);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 20;
  },
};
