import * as boardService from '../services/boardService.js';
import { errorTypes } from '../utils/errors.js';
import {
  boardIdParamSchema,
  createBoardSchema,
  createColumnSchema,
} from '../validators/boardValidator.js';
import { parse } from '../validators/validation.js';

async function createBoard(req, res, next) {
  try {
    const bodyValidation = parse(createBoardSchema, req.body);

    if (!bodyValidation.success) {
      return next(errorTypes.validation(bodyValidation.error));
    }

    const board = await boardService.createBoard(req.user.id, bodyValidation.data.name);

    return res.status(201).json({
      success: true,
      data: board,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function listBoards(req, res, next) {
  try {
    const boards = await boardService.listBoards(req.user.id);

    return res.json({
      success: true,
      data: boards,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function getBoard(req, res, next) {
  try {
    const paramsValidation = parse(boardIdParamSchema, req.params);

    if (!paramsValidation.success) {
      return next(errorTypes.validation(paramsValidation.error));
    }

    const board = await boardService.getBoardWithDetails(req.user.id, paramsValidation.data.id);

    return res.json({
      success: true,
      data: board,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function deleteBoard(req, res, next) {
  try {
    const paramsValidation = parse(boardIdParamSchema, req.params);

    if (!paramsValidation.success) {
      return next(errorTypes.validation(paramsValidation.error));
    }

    await boardService.deleteBoard(req.user.id, paramsValidation.data.id);

    return res.json({
      success: true,
      data: { deleted: true },
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

async function createColumn(req, res, next) {
  try {
    const paramsValidation = parse(boardIdParamSchema, req.params);
    if (!paramsValidation.success) {
      return next(errorTypes.validation(paramsValidation.error));
    }

    const bodyValidation = parse(createColumnSchema, req.body);
    if (!bodyValidation.success) {
      return next(errorTypes.validation(bodyValidation.error));
    }

    const column = await boardService.createColumn(
      req.user.id,
      paramsValidation.data.id,
      bodyValidation.data
    );

    return res.status(201).json({
      success: true,
      data: column,
      error: null,
    });
  } catch (error) {
    return next(error);
  }
}

export {
  createBoard, createColumn, deleteBoard, getBoard, listBoards
};

