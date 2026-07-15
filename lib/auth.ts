import { env } from './env';

/**
 * Defense-in-depth for endpoints a real deployment would restrict to staff
 * (filing incidents, triggering the event simulator): if `OPERATOR_API_KEY`
 * is configured, the request must carry a matching
 * `Authorization: Bearer <key>` header. If it's not configured (the
 * default), every request is authorized — this is a genuine access-control
 * gap in the reference build, disclosed rather than hidden (see README §5):
 * there is no user/session/role system here, and adding one is out of
 * scope for a hackathon reference build. This flag is the minimal opt-in
 * mechanism a deployer can turn on immediately without building full auth.
 */
export function isOperatorRequestAuthorized(headers: Headers): boolean {
  const requiredKey = env.operatorApiKey;
  if (!requiredKey) return true;

  const authHeader = headers.get('authorization') ?? '';
  const [scheme, token] = authHeader.split(' ');
  return scheme === 'Bearer' && token === requiredKey;
}
