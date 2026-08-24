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
