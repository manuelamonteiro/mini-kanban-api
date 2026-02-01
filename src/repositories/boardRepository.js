import pool from '../db/pool.js';
import { errorTypes } from '../utils/errors.js';

function getExecutor(conn) {
  return conn && typeof conn.execute === 'function' ? conn : pool;
}

async function createBoard({ name, ownerUserId }, conn) {
  const executor = getExecutor(conn);

  const [[{ id }]] = await executor.query('SELECT UUID() AS id');

  const [insertResult] = await executor.execute(
    'INSERT INTO boards (id, name, owner_user_id, created_at) VALUES (?, ?, ?, NOW())',
    [id, name, ownerUserId]
  );

  if (!insertResult.affectedRows) {
    throw errorTypes.internal('Failed to create board');
  }

  return { id, name };
}

async function getBoardsByOwner(ownerUserId) {
  const [rows] = await pool.execute(
    'SELECT id, name, created_at AS createdAt FROM boards WHERE owner_user_id = ? ORDER BY created_at DESC',
    [ownerUserId]
  );

  return rows;
}

async function findById(boardId) {
  const [rows] = await pool.execute(
    'SELECT id, name, owner_user_id AS ownerUserId, created_at AS createdAt FROM boards WHERE id = ? LIMIT 1',
    [boardId]
  );

  return rows[0] || null;
}

async function deleteBoard(boardId, ownerUserId) {
  const [result] = await pool.execute(
    'DELETE FROM boards WHERE id = ? AND owner_user_id = ?',
    [boardId, ownerUserId]
  );

  return result.affectedRows > 0;
}

async function getBoardColumnsWithCards(boardId) {
  const [rows] = await pool.execute(
    `SELECT
        c.id AS columnId,
        c.name AS columnName,
        c.position AS columnPosition,
        ca.id AS cardId,
        ca.title AS cardTitle,
        ca.description AS cardDescription,
        ca.position AS cardPosition,
        ca.created_at AS cardCreatedAt,
        ca.updated_at AS cardUpdatedAt
     FROM columns c
     LEFT JOIN cards ca ON ca.column_id = c.id
     WHERE c.board_id = ?
     ORDER BY c.position ASC, ca.position ASC`,
    [boardId]
  );

  return rows;
}

async function createColumns(boardId, columns, conn) {
  const executor = getExecutor(conn);

  const now = new Date();
  const values = columns.map(({ name, position }) => [boardId, name, position, now]);

  const [result] = await executor.query(
    'INSERT INTO columns (board_id, name, position, created_at) VALUES ?',
    [values]
  );

  if (!result?.affectedRows) {
    throw errorTypes.internal('Failed to create default columns');
  }
}

async function createColumn(boardId, name, position, conn) {
  const executor = getExecutor(conn);

  const [[{ id }]] = await executor.query('SELECT UUID() AS id');

  const [insertResult] = await executor.execute(
    'INSERT INTO columns (id, board_id, name, position, created_at) VALUES (?, ?, ?, ?, NOW())',
    [id, boardId, name, position]
  );

  if (!insertResult.affectedRows) {
    throw errorTypes.internal('Failed to create column');
  }

  return { id, name, position };
}

async function findColumnById(columnId, conn) {
  const executor = getExecutor(conn);

  const [rows] = await executor.execute(
    'SELECT id, board_id AS boardId, name, position FROM columns WHERE id = ? LIMIT 1',
    [columnId]
  );

  return rows[0] || null;
}

async function getNextColumnPosition(boardId, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT COALESCE(MAX(position), 0) AS maxPos FROM columns WHERE board_id = ?',
    [boardId]
  );

  return rows[0].maxPos + 1;
}

async function shiftColumnsDown(boardId, fromPosition, executor = pool) {
  await executor.execute(
    'UPDATE columns SET position = position + 1 WHERE board_id = ? AND position >= ?',
    [boardId, fromPosition]
  );
}

export {
  createBoard,
  createColumn,
  createColumns,
  deleteBoard,
  findById,
  findColumnById,
  getBoardColumnsWithCards,
  getBoardsByOwner,
  getNextColumnPosition,
  shiftColumnsDown
};
