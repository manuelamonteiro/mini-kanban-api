import pool from '../db/pool.js';
import { errorTypes } from '../utils/errors.js';

async function createUser({ name, email, passwordHash }) {
  const [[{ id }]] = await pool.query('SELECT UUID() AS id');

  const [insertResult] = await pool.execute(
    'INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, NOW())',
    [id, name, email, passwordHash]
  );

  if (!insertResult.affectedRows) {
    throw errorTypes.internal('Failed to create user');
  }

  return { id, name, email };
}

async function findByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT id, name, email, password_hash FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.execute(
    'SELECT id, name, email FROM users WHERE id = ? LIMIT 1',
    [id]
  );

  return rows[0] || null;
}

export {
  createUser,
  findByEmail,
  findById
};
