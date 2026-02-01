import pool from '../db/pool.js';
import * as boardRepo from '../repositories/boardRepository.js';
import * as cardRepo from '../repositories/cardRepository.js';
import { errorTypes } from '../utils/errors.js';
import { assertOwner, clampPosition } from '../utils/helpers/cardUtils.js';

async function createCard(userId, columnId, data) {
  const column = await boardRepo.findColumnById(columnId);
  if (!column) {
    throw errorTypes.notFound('Column not found');
  }

  const board = await boardRepo.findById(column.boardId);
  if (!board) {
    throw errorTypes.notFound('Board not found');
  }

  assertOwner(board.ownerUserId, userId);

  const card = await cardRepo.createCard(columnId, data);
  const { id, column_id, title, description, position, created_at, updated_at } = card;
  return { id, columnId: column_id, title, description, position, createdAt: created_at, updatedAt: updated_at };
}

async function updateCard(userId, cardId, data) {
  const card = await cardRepo.getCardWithBoard(cardId);
  if (!card) {
    throw errorTypes.notFound('Card not found');
  }

  assertOwner(card.ownerUserId, userId);

  const updated = await cardRepo.updateCard(cardId, data);
  const { id, column_id, title, description, position, created_at, updated_at } = updated;
  return { id, columnId: column_id, title, description, position, createdAt: created_at, updatedAt: updated_at };
}

async function deleteCard(userId, cardId) {
  const card = await cardRepo.getCardWithBoard(cardId);
  if (!card) {
    throw errorTypes.notFound('Card not found');
  }

  assertOwner(card.ownerUserId, userId);

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    await cardRepo.deleteCard(cardId, conn);
    await cardRepo.shiftPositionsUp(card.column_id, card.position, conn);

    await conn.commit();
    return true;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function moveCard(userId, cardId, { newColumnId, newPosition }) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const card = await cardRepo.getCardWithBoard(cardId, conn);
    if (!card) {
      throw errorTypes.notFound('Card not found');
    }

    assertOwner(card.ownerUserId, userId);

    const destColumn = await boardRepo.findColumnById(newColumnId, conn);
    if (!destColumn) {
      throw errorTypes.notFound('Destination column not found');
    }

    if (String(destColumn.boardId) !== String(card.boardId)) {
      throw errorTypes.validation([
        { message: 'Card and column must belong to the same board', path: 'newColumnId' },
      ]);
    }

    const destCount = await cardRepo.countByColumn(newColumnId, conn);
    const endPosition = destCount + 1;

    let targetPosition = clampPosition(newPosition, 1, endPosition, endPosition);

    const sameColumn = String(card.column_id) === String(newColumnId);

    if (sameColumn) {
      if (targetPosition === card.position) {
        await conn.commit();
        const sameCard = await cardRepo.getById(cardId, conn);
        const { id, column_id, title, description, position, created_at, updated_at } = sameCard;
        return { id, columnId: column_id, title, description, position, createdAt: created_at, updatedAt: updated_at };
      }

      await cardRepo.shiftPositionsUp(card.column_id, card.position, conn);

      const countAfterRemoval = await cardRepo.countByColumn(newColumnId, conn);
      const endAfterRemoval = countAfterRemoval + 1;

      targetPosition = clampPosition(targetPosition, 1, endAfterRemoval, endAfterRemoval);

      await cardRepo.shiftPositionsDown(newColumnId, targetPosition, conn);

      await cardRepo.updateCardColumnAndPosition(cardId, newColumnId, targetPosition, conn);
    } else {
      await cardRepo.shiftPositionsUp(card.column_id, card.position, conn);

      await cardRepo.shiftPositionsDown(newColumnId, targetPosition, conn);

      await cardRepo.updateCardColumnAndPosition(cardId, newColumnId, targetPosition, conn);
    }

    await conn.commit();

    const moved = await cardRepo.getById(cardId, conn);
    const { id, column_id, title, description, position, created_at, updated_at } = moved;
    return { id, columnId: column_id, title, description, position, createdAt: created_at, updatedAt: updated_at };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

export {
  createCard,
  deleteCard,
  moveCard,
  updateCard
};
