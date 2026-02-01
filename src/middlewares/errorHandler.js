import Joi from 'joi';

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let status =
    err.status && Number.isInteger(err.status) ? err.status : 500;

  if (err instanceof Joi.ValidationError) {
    status = 422;
    err.type = err.type ?? 'VALIDATION_ERROR';
    err.details = err.details?.map((d) => ({
      message: (d.message || '').replace(/"/g, ''),
      path: Array.isArray(d.path)
        ? d.path.map((seg) => (typeof seg === 'number' ? `[${seg}]` : seg))
          .join('.')
          .replace('.[', '[')
        : undefined,
      joiType: d.type,
    }));
    err.message = err.message || 'Validation error';
  }

  const body = {
    success: false,
    data: null,
    error: {
      message: err.message || 'Internal server error',
      type: err.type || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR'),
    },
  };

  if (err.details) {
    body.error.details = err.details;
  }

  res.status(status).json(body);
}

export default errorHandler;
