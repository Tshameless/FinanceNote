import { randomBytes, randomUUID } from 'crypto';
import { Request, Response, NextFunction } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const CSRF_COOKIE = 'fn_csrf_token';

/** Adds request correlation and validates the double-submit CSRF token. */
export function securityMiddleware(req: Request, res: Response, next: NextFunction): void {
  const requestId = req.header('x-request-id') || randomUUID();
  res.setHeader('X-Request-Id', requestId);
  (req as Request & { requestId?: string }).requestId = requestId;

  let csrf = req.cookies?.[CSRF_COOKIE];
  if (!csrf) {
    csrf = randomBytes(32).toString('hex');
    res.cookie(CSRF_COOKIE, csrf, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  const publicPath = req.path === '/api/auth/login' || req.path === '/api/auth/register' || req.path === '/health';
  if (!SAFE_METHODS.has(req.method) && !publicPath) {
    const headerToken = req.header('x-csrf-token');
    if (!headerToken || headerToken !== csrf) {
      res.status(403).json({ code: 403, message: 'CSRF token 无效', data: null, path: req.url });
      return;
    }
  }
  next();
}
