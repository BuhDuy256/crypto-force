import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from '../../errors/app-error';

export const notFoundHandler: RequestHandler = (_req, _res, next) => {
  next(new AppError(404, 'NOT_FOUND', 'Resource not found'));
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
    return;
  }

  req.log.error({ errorType: 'unexpected' }, 'The HTTP request failed.');
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
};
