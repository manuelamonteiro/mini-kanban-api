import Joi from 'joi';

const cardIdParamSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.guid': 'ID must be a valid UUID',
    'string.empty': 'ID is required',
  }),
});

const createCardSchema = Joi.object({
  title: Joi.string().min(1).required().messages({
    'string.min': 'Title must be at least 1 character long',
    'string.empty': 'Title is required',
  }),
  description: Joi.string().allow('').default(''),
});

const updateCardSchema = Joi.object({
  title: Joi.string().min(1).messages({
    'string.min': 'Title must be at least 1 character long',
    'string.empty': 'Title is required',
  }),
  description: Joi.string().allow('').default(''),
});

const moveCardSchema = Joi.object({
  newColumnId: Joi.string().uuid().required().messages({
    'string.guid': 'New column ID must be a valid UUID',
    'string.empty': 'New column ID is required',
  }),
  newPosition: Joi.number().integer().positive().messages({
    'number.integer': 'New position must be an integer',
    'number.positive': 'New position must be a positive number',
    'number.empty': 'New position is required',
  }),
});

const columnIdParamSchema = Joi.object({
  columnId: Joi.string().uuid().required().messages({
    'string.guid': 'Column ID must be a valid UUID',
    'string.empty': 'Column ID is required',
  }),
});

export {
  cardIdParamSchema,
  createCardSchema,
  moveCardSchema,
  updateCardSchema,
  columnIdParamSchema,
};
