import * as authService from '../services/authService.js';
import { errorTypes } from '../utils/errors.js';
import { loginSchema, registerSchema } from '../validators/authValidator.js';
import { parse } from '../validators/validation.js';

async function register(req, res, next) {
  try {
    const validationResult = parse(registerSchema, req.body);

    if (!validationResult.success) {
      return next(errorTypes.validation(validationResult.error));
    }

    const createdUser = await authService.register(validationResult.data);

    return res.status(201).json({
      success: true,
      data: createdUser,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function login(req, res, next) {
  try {
    const validationResult = parse(loginSchema, req.body);

    if (!validationResult.success) {
      return next(errorTypes.validation(validationResult.error));
    }

    const authResult = await authService.login(validationResult.data);

    return res.json({
      success: true,
      data: authResult,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

export { login, register };

