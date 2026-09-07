import { AppError } from '../utils/AppError.js';

// Factory — not applied to any route yet. A future route calls this with its
// own Zod schema, e.g. validate(loginSchema).
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const error = new AppError('Invalid input.', 422, 'VALIDATION_ERROR');
      error.details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(error);
    }

    req.body = result.data;
    next();
  };
}

/**
 * The same, for the query string.
 *
 * The parsed result goes on `req.validatedQuery` rather than replacing
 * `req.query`. Express 4 allows the reassignment, but in Express 5 `req.query`
 * is a getter and assigning to it throws — so a future upgrade would break
 * every route using this, at runtime and not at build time.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const error = new AppError('Invalid input.', 422, 'VALIDATION_ERROR');
      error.details = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return next(error);
    }

    req.validatedQuery = result.data;
    next();
  };
}
