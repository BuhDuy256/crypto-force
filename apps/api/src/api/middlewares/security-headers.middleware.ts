import type { RequestHandler } from 'express';

/** Security headers on every API response (docs/architecture/23-security.md, security headers). */
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
};
