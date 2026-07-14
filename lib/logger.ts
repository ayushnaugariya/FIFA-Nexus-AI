type LogFields = Record<string, unknown>;

const SENSITIVE_KEYS = new Set(['apikey', 'api_key', 'token', 'authorization', 'password']);

function redact(fields: LogFields): LogFields {
  const safe: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    safe[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? '[redacted]' : value;
  }
  return safe;
}

function write(level: 'info' | 'warn' | 'error', event: string, fields: LogFields = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    event,
    ...redact(fields),
  };
  // eslint-disable-next-line no-console
  console[level === 'info' ? 'log' : level](JSON.stringify(entry));
}

export const logger = {
  info: (event: string, fields?: LogFields) => write('info', event, fields),
  warn: (event: string, fields?: LogFields) => write('warn', event, fields),
  error: (event: string, fields?: LogFields) => write('error', event, fields),
};
