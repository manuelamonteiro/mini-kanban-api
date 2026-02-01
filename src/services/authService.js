import bcrypt from 'bcrypt';
import * as usersRepo from '../repositories/usersRepository.js';
import { errorTypes } from '../utils/errors.js';
import { toPublicUser } from '../utils/helpers/authUtils.js';
import { signAccessToken } from '../utils/jwt.js';

async function register({ name, email, password }) {
  const existingUser = await usersRepo.findByEmail(email);
  if (existingUser) {
    throw errorTypes.conflict('Email already registered');
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);
  const passwordHash = await bcrypt.hash(password, saltRounds);

  const createdUser = await usersRepo.createUser({ name, email, passwordHash });
  const publicUser = toPublicUser(createdUser);

  const accessToken = signAccessToken({
    id: publicUser.id,
    email: publicUser.email,
  });

  return { user: publicUser, accessToken };
}

async function login({ email, password }) {
  const user = await usersRepo.findByEmail(email);
  if (!user) {
    throw errorTypes.unauthorized('Invalid credentials');
  }

  const passwordOk = await bcrypt.compare(password, user.password_hash);
  if (!passwordOk) {
    throw errorTypes.unauthorized('Invalid credentials');
  }

  const publicUser = toPublicUser(user);

  const accessToken = signAccessToken({
    id: publicUser.id,
    email: publicUser.email,
  });

  return { user: publicUser, accessToken };
}

export {
  login,
  register
};
