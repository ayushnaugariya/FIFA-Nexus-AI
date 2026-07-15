/**
 * Every API route reads its body through this instead of `request.json()`
 * directly. Next.js route handlers impose no default body-size limit on
 * `request.json()` — an attacker could send a multi-hundred-MB payload and
 * force it fully into memory before zod ever gets a chance to reject an
 * oversized field. This enforces a hard cap up front instead.
 */

export class PayloadTooLargeError extends Error {
  constructor(message = 'Request body is too large.') {
    super(message);
    this.name = 'PayloadTooLargeError';
  }
}

const DEFAULT_MAX_BYTES = 100 * 1024; // 100KB — generous for every text endpoint's zod limits combined
export const VISION_MAX_BYTES = 7 * 1024 * 1024; // ~5MB image as base64 + JSON overhead

/**
 * Reads and JSON-parses a request body, enforcing `maxBytes` regardless of
 * whether a (spoofable, sometimes absent) Content-Length header is present —
 * the stream is read incrementally and aborted the moment the cap is
 * exceeded, so a chunked-encoding request without Content-Length can't
 * bypass the limit.
 */
export async function readJsonBody(request: Request, maxBytes: number = DEFAULT_MAX_BYTES): Promise<unknown> {
  const contentLengthHeader = request.headers.get('content-length');
  if (contentLengthHeader && Number(contentLengthHeader) > maxBytes) {
    throw new PayloadTooLargeError();
  }

  if (!request.body) {
    return request.json();
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new PayloadTooLargeError();
    }
    chunks.push(value);
  }

  const combined = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    combined.set(chunk, offset);
    offset += chunk.length;
  }

  const text = new TextDecoder().decode(combined);
  return text.length ? JSON.parse(text) : undefined;
}
