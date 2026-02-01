import pool from '../db/pool.js';
import { errorTypes } from '../utils/errors.js';

function getExecutor(conn) {
  return conn && typeof conn.execute === 'function' ? conn : pool;
}

async function getNextPosition(columnId, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT COALESCE(MAX(position), 0) AS maxPos FROM cards WHERE column_id = ?',
    [columnId]
  );

  return rows[0].maxPos + 1;
}

async function createCard(columnId, { title, description }, conn) {
  const executor = getExecutor(conn);
  const position = await getNextPosition(columnId, executor);

  const [[{ id }]] = await executor.query('SELECT UUID() AS id');

  const [insertResult] = await executor.execute(
    'INSERT INTO cards (id, column_id, title, description, position, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [id, columnId, title, description || '', position]
  );

  if (!insertResult.affectedRows) {
    throw errorTypes.internal('Failed to create card');
  }

  return {
    id,
    column_id: columnId,
    title,
    description: description || '',
    position,
    created_at: new Date(),
    updated_at: new Date()
  };
}

async function updateCard(cardId, { title, description }) {
  const fields = [];
  const params = [];

  if (title !== undefined) {
    fields.push('title = ?');
    params.push(title);
  }

  if (description !== undefined) {
    fields.push('description = ?');
    params.push(description);
  }

  if (!fields.length) {
    return getById(cardId);
  }

  params.push(cardId);

  const sql = `UPDATE cards SET ${fields.join(', ')}, updated_at = NOW() WHERE id = ?`;
  await pool.execute(sql, params);

  return getById(cardId);
}

async function deleteCard(cardId, conn) {
  const executor = getExecutor(conn);
  await executor.execute('DELETE FROM cards WHERE id = ?', [cardId]);
}

async function getById(cardId, conn) {
  const executor = getExecutor(conn);

  const [rows] = await executor.execute(
    'SELECT id, column_id, title, description, position, created_at, updated_at FROM cards WHERE id = ? LIMIT 1',
    [cardId]
  );

  return rows[0] || null;
}

async function getCardWithBoard(cardId, conn) {
  const executor = getExecutor(conn);

  const [rows] = await executor.execute(
    `SELECT
        ca.id,
        ca.column_id,
        ca.title,
        ca.description,
        ca.position,
        ca.created_at,
        ca.updated_at,
        co.board_id AS boardId,
        b.owner_user_id AS ownerUserId
     FROM cards ca
     JOIN columns co ON ca.column_id = co.id
     JOIN boards b ON co.board_id = b.id
     WHERE ca.id = ?
     LIMIT 1`,
    [cardId]
  );

  return rows[0] || null;
}

async function countByColumn(columnId, executor = pool) {
  const [rows] = await executor.execute(
    'SELECT COUNT(*) AS total FROM cards WHERE column_id = ?',
    [columnId]
  );

  return rows[0].total;
}

async function shiftPositionsDown(columnId, fromPosition, executor = pool) {
  await executor.execute(
    'UPDATE cards SET position = position + 1 WHERE column_id = ? AND position >= ?',
    [columnId, fromPosition]
  );
}

async function shiftPositionsUp(columnId, fromPosition, executor = pool) {
  await executor.execute(
    'UPDATE cards SET position = position - 1 WHERE column_id = ? AND position > ?',
    [columnId, fromPosition]
  );
}

async function updateCardColumnAndPosition(cardId, columnId, position, executor = pool) {
  await executor.execute(
    'UPDATE cards SET column_id = ?, position = ?, updated_at = NOW() WHERE id = ?',
    [columnId, position, cardId]
  );
}

export {
  countByColumn,
  createCard,
  deleteCard,
  getById,
  getCardWithBoard,
  getNextPosition,
  shiftPositionsDown,
  shiftPositionsUp,
  updateCard,
  updateCardColumnAndPosition
};
