import { jest } from '@jest/globals';
import { TEST_USER } from './testUser.js';

const boardServiceMock = {
  createBoard: jest.fn(),
  listBoards: jest.fn(),
  getBoardWithDetails: jest.fn(),
  deleteBoard: jest.fn(),
  createColumn: jest.fn(),
};

const cardServiceMock = {
  createCard: jest.fn(),
  updateCard: jest.fn(),
  deleteCard: jest.fn(),
  moveCard: jest.fn(),
};

async function buildTestApp() {
  await jest.unstable_mockModule('../../src/middlewares/authMiddleware.js', () => ({
    __esModule: true,
    default: (req, _res, next) => {
      req.user = TEST_USER;
      return next();
    },
  }));

  await jest.unstable_mockModule('../../src/services/boardService.js', () => ({
    __esModule: true,
    ...boardServiceMock,
  }));

  await jest.unstable_mockModule('../../src/services/cardService.js', () => ({
    __esModule: true,
    ...cardServiceMock,
  }));

  const { default: app } = await import('../../src/app.js');
  return app;
}

export {
  boardServiceMock,
  buildTestApp,
  cardServiceMock
};

