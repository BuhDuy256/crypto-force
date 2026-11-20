import type { RequestHandler } from 'express';

/** Security headers on every API response (docs/UCs/authentication.md, SEC-08). */
export const securityHeaders: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  next();
};
