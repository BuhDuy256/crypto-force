import { fromNodeHeaders } from 'better-auth/node';
import type { RequestHandler } from 'express';
import type { Auth } from '../../configs/auth';
import { AppError } from '../../errors/app-error';

export function requireSession(auth: Auth): RequestHandler {
  return async (req, _res, next) => {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) throw new AppError(401, 'UNAUTHENTICATED', 'The session is not valid.');
    next();
  };
}
