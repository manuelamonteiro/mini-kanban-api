import jwt from 'jsonwebtoken';
import { errorTypes } from '../utils/errors.js';

function authMiddleware(req, res, next) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader?.startsWith('Bearer ')) {
    return next(errorTypes.unauthorized('Missing access token'));
  }

  const accessToken = authorizationHeader.slice('Bearer '.length);
  const accessTokenSecret = process.env.JWT_ACCESS_SECRET;

  if (!accessTokenSecret) {
    return next(errorTypes.internal('JWT access secret not configured'));
  }

  try {
    const decodedToken = jwt.verify(accessToken, accessTokenSecret);

    req.user = {
      id: decodedToken.sub,
      email: decodedToken.email,
    };

    return next();
  } catch (error) {
    return next(errorTypes.unauthorized('Invalid or expired token'));
  }
}

export default authMiddleware;
