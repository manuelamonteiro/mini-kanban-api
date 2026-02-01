import { errorTypes } from '../errors.js';

function assertOwner(ownerUserId, userId) {
  if (String(ownerUserId) !== String(userId)) {
    throw errorTypes.forbidden();
  }
}

function clampPosition(rawPosition, min, max, fallback) {
  const n = Number(rawPosition);

  if (!Number.isFinite(n) || n <= 0) return fallback;

  if (n < min) return min;
  if (n > max) return max;

  return n;
}

export {
  assertOwner,
  clampPosition
};
