import { describe, expect, it } from 'vitest';
import { readJsonBody, PayloadTooLargeError } from '../lib/requestGuard';

function makeRequest(body: string, headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/test', {
    method: 'POST',
    headers,
    body,
  });
}

describe('readJsonBody', () => {
  it('parses a well-formed, small JSON body', async () => {
    const request = makeRequest(JSON.stringify({ message: 'hello' }));
    const result = await readJsonBody(request, 1024);
    expect(result).toEqual({ message: 'hello' });
  });

  it('rejects a body that exceeds maxBytes, even without a declared Content-Length', async () => {
    // Deliberately omit content-length so this exercises the streamed
    // byte-count enforcement path, not just the header fast-path.
    const hugeJson = JSON.stringify({ message: 'a'.repeat(5000) });
    const request = makeRequest(hugeJson);
    await expect(readJsonBody(request, 100)).rejects.toThrow(PayloadTooLargeError);
  });

  it('rejects up-front when the Content-Length header alone already exceeds the cap', async () => {
    const request = makeRequest('{}', { 'content-length': '999999' });
    await expect(readJsonBody(request, 1000)).rejects.toThrow(PayloadTooLargeError);
  });

  it('accepts a body right at the boundary', async () => {
    const payload = JSON.stringify({ a: 'x'.repeat(50) });
    const request = makeRequest(payload);
    const byteLength = new TextEncoder().encode(payload).byteLength;
    const result = await readJsonBody(request, byteLength);
    expect(result).toEqual({ a: 'x'.repeat(50) });
  });

  it('propagates a JSON syntax error for malformed (but small) bodies', async () => {
    const request = makeRequest('{not valid json');
    await expect(readJsonBody(request, 1024)).rejects.toThrow();
  });
});
