import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_TTL = process.env.JWT_ACCESS_TTL ?? '1d';

function signAccessToken({ id, email }) {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET is not configured');
  }

  return jwt.sign(
    { email },
    secret,
    {
      expiresIn: ACCESS_TOKEN_TTL,
      subject: String(id),
    }
  );
}

export { ACCESS_TOKEN_TTL, signAccessToken };
