import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { getClient } from '../config/db';

export const getUsers = async (req: Request, res: Response): Promise<void> => {
  const client = await getClient();
  try {
    const { rows } = await client.query(`
      SELECT id, email, name, role, is_active, created_at 
      FROM USERS 
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  } finally {
    client.release();
  }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { email, name, password, role } = req.body;
  
  if (!email || !name || !password || !role) {
    res.status(400).json({ error: 'All fields are required' });
    return;
  }

  const validRoles = ['Admin', 'Manajemen', 'Staff'];
  if (!validRoles.includes(role)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }

  const client = await getClient();
  try {
    // Check if user exists
    const { rows: existing } = await client.query('SELECT id FROM USERS WHERE email = $1', [email]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already exists' });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Insert user
    const { rows } = await client.query(
      `INSERT INTO USERS (email, name, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, name, role, is_active, created_at`,
      [email, name, passwordHash, role]
    );

    res.status(201).json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  } finally {
    client.release();
  }
};

export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const loggedInUserId = (req as any).user?.id;
  const loggedInUserEmail = (req as any).user?.email;

  if (id === loggedInUserId) {
    res.status(403).json({ error: 'Tindakan ditolak: Anda tidak bisa menonaktifkan akun Anda sendiri.' });
    return;
  }

  const client = await getClient();
  try {
    // Check if it's the super admin
    const { rows: userRows } = await client.query('SELECT email FROM USERS WHERE id = $1', [id]);
    if (userRows.length > 0 && userRows[0].email === 'admin@gmail.com') {
      res.status(403).json({ error: 'Tindakan ditolak: Akun Super Admin (admin@gmail.com) tidak boleh dinonaktifkan.' });
      return;
    }

    const { rows } = await client.query(
      'UPDATE USERS SET is_active = NOT is_active WHERE id = $1 RETURNING id, is_active',
      [id]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User status updated', isActive: rows[0].is_active });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  } finally {
    client.release();
  }
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const loggedInUserId = (req as any).user?.id;

  if (id === loggedInUserId) {
    res.status(403).json({ error: 'Tindakan ditolak: Anda tidak bisa menghapus akun Anda sendiri.' });
    return;
  }

  const client = await getClient();
  try {
    // Check if it's the super admin
    const { rows: userRows } = await client.query('SELECT email FROM USERS WHERE id = $1', [id]);
    if (userRows.length > 0 && userRows[0].email === 'admin@gmail.com') {
      res.status(403).json({ error: 'Tindakan ditolak: Akun Super Admin (admin@gmail.com) tidak boleh dihapus.' });
      return;
    }

    const { rowCount } = await client.query('DELETE FROM USERS WHERE id = $1', [id]);
    if (rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  } finally {
    client.release();
  }
};
