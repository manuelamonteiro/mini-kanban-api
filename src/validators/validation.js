function formatPath(pathArr = []) {
  if (!pathArr.length) return undefined;

  return pathArr
    .map((seg) => (typeof seg === 'number' ? `[${seg}]` : seg))
    .join('.')
    .replace('.[', '[');
}

function cleanMessage(msg = '') {
  return msg.replace(/"/g, '');
}

function parse(schema, payload, options = {}) {
  const { error, value } = schema.validate(payload, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
    ...options,
  });

  if (error) {
    const details = error.details.map((detail) => ({
      message: cleanMessage(detail.message),
      path: formatPath(detail.path),
      type: detail.type,
    }));

    return { success: false, data: null, error: details };
  }

  return { success: true, data: value, error: null };
}

export { parse };
