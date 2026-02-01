import Joi from 'joi';

const createBoardSchema = Joi.object({
  name: Joi.string().min(2).required().messages({
    'string.min': 'Name must be at least 2 characters long',
    'string.empty': 'Name is required',
  }),
});

const boardIdParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID must be a valid UUID',
    'string.empty': 'ID is required',
  }),
});

const createColumnSchema = Joi.object({
  name: Joi.string().min(1).required().messages({
    'string.min': 'Name must be at least 1 character long',
    'string.empty': 'Name is required',
  }),
  position: Joi.number().integer().positive().messages({
    'number.integer': 'Position must be an integer',
    'number.positive': 'Position must be positive',
  }),
});

export {
  boardIdParamSchema,
  createBoardSchema,
  createColumnSchema,
};
