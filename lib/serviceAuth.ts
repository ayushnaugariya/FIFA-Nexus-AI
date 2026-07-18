/**
 * serviceAuth.ts
 *
 * Provides an OAuth2 access token from a Google service account JSON file.
 * Used when GEMINI_API_KEY is not available or is in AQ. format.
 * The token is cached and auto-refreshed before expiry.
 */

import { GoogleAuth } from 'google-auth-library';
import path from 'path';
import fs from 'fs';

const SCOPES = ['https://www.googleapis.com/auth/generative-language'];
const SERVICE_ACCOUNT_PATH = path.join(process.cwd(), 'service-account.json');

let auth: GoogleAuth | null = null;

function getAuth(): GoogleAuth {
  if (!auth) {
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
      throw new Error('service-account.json not found in project root.');
    }
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_PATH, 'utf-8'));
    auth = new GoogleAuth({ credentials, scopes: SCOPES });
  }
  return auth;
}

/**
 * Returns a valid Bearer access token for the Generative Language API.
 * The google-auth-library handles caching and refresh automatically.
 */
export async function getServiceAccountToken(): Promise<string> {
  const client = await getAuth().getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) {
    throw new Error('Failed to obtain access token from service account.');
  }
  return tokenResponse.token;
}

export function serviceAccountExists(): boolean {
  return fs.existsSync(SERVICE_ACCOUNT_PATH);
}
