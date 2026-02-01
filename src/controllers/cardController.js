import * as cardService from '../services/cardService.js';
import { errorTypes } from '../utils/errors.js';
import {
  cardIdParamSchema,
  columnIdParamSchema,
  createCardSchema,
  moveCardSchema,
  updateCardSchema,
} from '../validators/cardValidator.js';
import { parse } from '../validators/validation.js';

async function createCard(req, res, next) {
  try {
    const paramsValidation = parse(columnIdParamSchema, req.params);
    if (!paramsValidation.success) {
      return next(errorTypes.validation(paramsValidation.error));
    }

    const bodyValidation = parse(createCardSchema, req.body);
    if (!bodyValidation.success) {
      return next(errorTypes.validation(bodyValidation.error));
    }

    const card = await cardService.createCard(
      req.user.id,
      paramsValidation.data.columnId,
      bodyValidation.data
    );

    return res.status(201).json({
      success: true,
      data: card,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function updateCard(req, res, next) {
  try {
    const paramsValidation = parse(cardIdParamSchema, req.params);
    if (!paramsValidation.success) {
      return next(errorTypes.validation(paramsValidation.error));
    }

    const bodyValidation = parse(updateCardSchema, req.body);
    if (!bodyValidation.success) {
      return next(errorTypes.validation(bodyValidation.error));
    }

    const card = await cardService.updateCard(
      req.user.id,
      paramsValidation.data.id,
      bodyValidation.data
    );

    return res.json({
      success: true,
      data: card,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteCard(req, res, next) {
  try {
    const paramsValidation = parse(cardIdParamSchema, req.params);
    if (!paramsValidation.success) {
      return next(errorTypes.validation(paramsValidation.error));
    }

    await cardService.deleteCard(req.user.id, paramsValidation.data.id);

    return res.json({
      success: true,
      data: { deleted: true },
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function moveCard(req, res, next) {
  try {
    const paramsValidation = parse(cardIdParamSchema, req.params);
    if (!paramsValidation.success) {
      return next(errorTypes.validation(paramsValidation.error));
    }

    const bodyValidation = parse(moveCardSchema, req.body);
    if (!bodyValidation.success) {
      return next(errorTypes.validation(bodyValidation.error));
    }

    const card = await cardService.moveCard(
      req.user.id,
      paramsValidation.data.id,
      bodyValidation.data
    );

    return res.json({
      success: true,
      data: card,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

export {
  createCard, deleteCard,
  moveCard, updateCard
};

