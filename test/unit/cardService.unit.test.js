import { jest } from '@jest/globals';

const cardRepoMock = {
  getCardWithBoard: jest.fn(),
  countByColumn: jest.fn(),
  shiftPositionsUp: jest.fn(),
  shiftPositionsDown: jest.fn(),
  updateCardColumnAndPosition: jest.fn(),
  getById: jest.fn(),
};

const boardRepoMock = {
  findColumnById: jest.fn(),
};

const mockConn = {
  beginTransaction: jest.fn(),
  commit: jest.fn(),
  rollback: jest.fn(),
  release: jest.fn(),
};

const poolMock = {
  getConnection: jest.fn(),
};

await jest.unstable_mockModule('../../src/repositories/cardRepository.js', () => ({
  __esModule: true,
  ...cardRepoMock,
}));

await jest.unstable_mockModule('../../src/repositories/boardRepository.js', () => ({
  __esModule: true,
  ...boardRepoMock,
}));

await jest.unstable_mockModule('../../src/db/pool.js', () => ({
  __esModule: true,
  default: poolMock,
}));

const { moveCard } = await import('../../src/services/cardService.js');

const cardBase = {
  id: 'card-1',
  column_id: 'col-a',
  boardId: 'board-1',
  ownerUserId: 'owner-1',
  position: 2,
  title: 'Task',
  description: 'desc',
  created_at: 'now',
  updated_at: 'now',
};

function resetMocks() {
  Object.values(cardRepoMock).forEach((fn) => fn.mockReset());
  Object.values(boardRepoMock).forEach((fn) => fn.mockReset());
  Object.values(mockConn).forEach((fn) => fn.mockReset());
  poolMock.getConnection.mockReset();
}

function givenTransactionReady() {
  mockConn.beginTransaction.mockResolvedValue();
  mockConn.commit.mockResolvedValue();
  mockConn.rollback.mockResolvedValue();
  mockConn.release.mockResolvedValue();
  poolMock.getConnection.mockResolvedValue(mockConn);
}

function givenHappyPath({
  card = { ...cardBase },
  destColumn = { id: 'col-b', boardId: 'board-1' },
  destCount = 3,
  finalCard = { ...cardBase, column_id: destColumn.id, position: 1 },
} = {}) {
  cardRepoMock.getCardWithBoard.mockResolvedValue(card);
  boardRepoMock.findColumnById.mockResolvedValue(destColumn);

  cardRepoMock.countByColumn.mockResolvedValue(destCount);
  cardRepoMock.shiftPositionsUp.mockResolvedValue();
  cardRepoMock.shiftPositionsDown.mockResolvedValue();
  cardRepoMock.updateCardColumnAndPosition.mockResolvedValue();

  cardRepoMock.getById.mockResolvedValue(finalCard);
}

async function whenMoveCard(userId, cardId, payload) {
  return moveCard(userId, cardId, payload);
}

function thenCommitted() {
  expect(mockConn.commit).toHaveBeenCalled();
  expect(mockConn.rollback).not.toHaveBeenCalled();
}

function thenRolledBack() {
  expect(mockConn.rollback).toHaveBeenCalled();
  expect(mockConn.commit).not.toHaveBeenCalled();
}

describe('cardService.moveCard', () => {
  beforeEach(() => {
    resetMocks();
    givenTransactionReady();
    givenHappyPath();
  });

  it('reorders within the same column (move up)', async () => {
    // Given
    givenHappyPath({
      destColumn: { id: 'col-a', boardId: 'board-1' },
      finalCard: { ...cardBase, column_id: 'col-a', position: 1 },
    });

    // When
    const result = await whenMoveCard('owner-1', cardBase.id, {
      newColumnId: 'col-a',
      newPosition: 1,
    });

    // Then
    expect(cardRepoMock.shiftPositionsUp).toHaveBeenCalledWith('col-a', 2, mockConn);
    expect(cardRepoMock.shiftPositionsDown).toHaveBeenCalledWith('col-a', 1, mockConn);
    expect(cardRepoMock.updateCardColumnAndPosition).toHaveBeenCalledWith('card-1', 'col-a', 1, mockConn);

    thenCommitted();
    expect(result).toMatchObject({ columnId: 'col-a', position: 1 });
  });

  it('move to another column: shift up on source and shift down on destination', async () => {
    // Given
    givenHappyPath({
      destColumn: { id: 'col-b', boardId: 'board-1' },
      finalCard: { ...cardBase, column_id: 'col-b', position: 2 },
    });

    // When
    const result = await whenMoveCard('owner-1', cardBase.id, {
      newColumnId: 'col-b',
      newPosition: 2,
    });

    // Then
    expect(cardRepoMock.shiftPositionsUp).toHaveBeenCalledWith('col-a', 2, mockConn);
    expect(cardRepoMock.shiftPositionsDown).toHaveBeenCalledWith('col-b', 2, mockConn);
    expect(cardRepoMock.updateCardColumnAndPosition).toHaveBeenCalledWith('card-1', 'col-b', 2, mockConn);

    thenCommitted();
    expect(result).toMatchObject({ columnId: 'col-b', position: 2 });
  });

  it('when destination is empty (count=0) and no position is sent: falls to 1', async () => {
    // Given
    givenHappyPath({
      destCount: 0,
      destColumn: { id: 'col-b', boardId: 'board-1' },
      finalCard: { ...cardBase, column_id: 'col-b', position: 1 },
    });

    // When
    const result = await whenMoveCard('owner-1', cardBase.id, { newColumnId: 'col-b' });

    // Then
    expect(cardRepoMock.shiftPositionsDown).toHaveBeenCalledWith('col-b', 1, mockConn);
    expect(cardRepoMock.updateCardColumnAndPosition).toHaveBeenCalledWith('card-1', 'col-b', 1, mockConn);

    thenCommitted();
    expect(result).toMatchObject({ columnId: 'col-b', position: 1 });
  });

  it('returns 404 when destination column does not exist and makes rollback', async () => {
    // Given
    boardRepoMock.findColumnById.mockResolvedValueOnce(null);

    // When/Then
    await expect(
      whenMoveCard('owner-1', cardBase.id, { newColumnId: 'missing', newPosition: 1 })
    ).rejects.toMatchObject({ status: 404, type: 'not_found' });

    thenRolledBack();
  });

  it('blocks when user is not owner (403) and makes rollback', async () => {
    // Given
    cardRepoMock.getCardWithBoard.mockResolvedValueOnce({ ...cardBase, ownerUserId: 'other' });

    // When/Then
    await expect(
      whenMoveCard('owner-1', cardBase.id, { newColumnId: 'col-b', newPosition: 1 })
    ).rejects.toMatchObject({ status: 403, type: 'forbidden' });

    thenRolledBack();
  });

  it('makes rollback + release when an unexpected error occurs', async () => {
    // Given
    cardRepoMock.getCardWithBoard.mockRejectedValueOnce(new Error('db is down'));

    // When/Then
    await expect(
      whenMoveCard('owner-1', cardBase.id, { newColumnId: 'col-b', newPosition: 1 })
    ).rejects.toThrow('db is down');

    expect(mockConn.rollback).toHaveBeenCalled();
    expect(mockConn.release).toHaveBeenCalled();
  });
});
