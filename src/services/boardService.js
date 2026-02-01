import pool from '../db/pool.js';
import * as boardRepo from '../repositories/boardRepository.js';
import { errorTypes } from '../utils/errors.js';
import {
  assertBoardOwnership,
  buildBoardColumns,
} from '../utils/helpers/boardUtils.js';

const DEFAULT_COLUMNS = [
  { name: 'Backlog', position: 1 },
  { name: 'To Do', position: 2 },
  { name: 'In Progress', position: 3 },
  { name: 'Done', position: 4 },
  { name: 'Extra', position: 5 },
];

async function createBoard(ownerId, name) {
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const board = await boardRepo.createBoard(
      { name, ownerUserId: ownerId },
      conn
    );

    await boardRepo.createColumns(board.id, DEFAULT_COLUMNS, conn);

    await conn.commit();
    return board;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function createColumn(ownerId, boardId, { name, position }) {
  const board = await boardRepo.findById(boardId);
  if (!board) {
    throw errorTypes.notFound('Board not found');
  }

  assertBoardOwnership(board, ownerId);

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    let targetPosition = Number(position);

    if (!Number.isFinite(targetPosition) || targetPosition <= 0) {
      targetPosition = await boardRepo.getNextColumnPosition(boardId, conn);
    }

    await boardRepo.shiftColumnsDown(boardId, targetPosition, conn);

    const column = await boardRepo.createColumn(boardId, name, targetPosition, conn);

    await conn.commit();
    return column;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function listBoards(ownerId) {
  return boardRepo.getBoardsByOwner(ownerId);
}

async function getBoardWithDetails(ownerId, boardId) {
  const board = await boardRepo.findById(boardId);
  if (!board) {
    throw errorTypes.notFound('Board not found');
  }

  assertBoardOwnership(board, ownerId);

  const rows = await boardRepo.getBoardColumnsWithCards(boardId);
  const columns = buildBoardColumns(rows);

  return {
    id: board.id,
    name: board.name,
    columns,
  };
}

async function deleteBoard(ownerId, boardId) {
  const board = await boardRepo.findById(boardId);
  if (!board) {
    throw errorTypes.notFound('Board not found');
  }

  assertBoardOwnership(board, ownerId);

  const deleted = await boardRepo.deleteBoard(boardId, ownerId);
  if (!deleted) {
    throw errorTypes.internal('Failed to delete board');
  }

  return true;
}

export {
  createBoard,
  createColumn,
  deleteBoard,
  getBoardWithDetails,
  listBoards
};
