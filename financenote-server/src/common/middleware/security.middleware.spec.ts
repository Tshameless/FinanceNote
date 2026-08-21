import { securityMiddleware } from './security.middleware';

function mockResponse() {
  return {
    cookie: jest.fn(),
    setHeader: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
  } as any;
}

describe('securityMiddleware', () => {
  it('sets request id and csrf cookie for a new request', () => {
    const req: any = { method: 'GET', path: '/api/health', cookies: {}, header: jest.fn() };
    const res = mockResponse();
    const next = jest.fn();
    securityMiddleware(req, res, next);
    expect(res.setHeader).toHaveBeenCalledWith('X-Request-Id', expect.any(String));
    expect(res.cookie).toHaveBeenCalledWith('fn_csrf_token', expect.any(String), expect.any(Object));
    expect(next).toHaveBeenCalled();
  });

  it('rejects a mutating request with an invalid csrf token', () => {
    const req: any = { method: 'POST', path: '/api/notes', cookies: { fn_csrf_token: 'expected' }, header: jest.fn((name: string) => name === 'x-csrf-token' ? 'wrong' : undefined) };
    const res = mockResponse();
    const next = jest.fn();
    securityMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('allows login without a csrf token', () => {
    const req: any = { method: 'POST', path: '/api/auth/login', cookies: {}, header: jest.fn() };
    const res = mockResponse();
    const next = jest.fn();
    securityMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});
