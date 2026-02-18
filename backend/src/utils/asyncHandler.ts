import { Request, Response, NextFunction, RequestHandler } from 'express';

export const asyncHandler = <T extends Request>(
  fn: (req: T, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => {
  return (req, res, next) => {
    Promise.resolve(fn(req as T, res, next)).catch(next);
  };
};
