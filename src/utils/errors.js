function createError(status, message, details = null, type = 'internal') {
  const err = new Error(message);

  err.status = status;
  err.type = type;

  if (details != null) {
    err.details = details;
  }

  return err;
}

function ensureArrayDetails(details) {
  if (details == null) return null;
  return Array.isArray(details) ? details : [details];
}

const errorTypes = {
  validation: (details, message = 'Validation failed') =>
    createError(422, message, ensureArrayDetails(details), 'validation'),

  unauthorized: (message = 'Unauthorized') =>
    createError(401, message, null, 'unauthorized'),

  forbidden: (message = 'Forbidden') =>
    createError(403, message, null, 'forbidden'),

  notFound: (message = 'Not found') =>
    createError(404, message, null, 'not_found'),

  conflict: (message = 'Conflict') =>
    createError(409, message, null, 'conflict'),

  internal: (message = 'Internal server error', details = null) =>
    createError(500, message, details, 'internal'),
};

export { errorTypes };
