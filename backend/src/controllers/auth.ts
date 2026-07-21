import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getClient } from '../config/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-for-dev';

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;
  const client = await getClient();

  try {
    const { rows } = await client.query('SELECT * FROM USERS WHERE email = $1 AND is_active = TRUE', [email]);
    if (rows.length === 0) {
      res.status(401).json({ error: 'Invalid credentials or inactive account' });
      return;
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({ token, role: user.role, name: user.name });
  } catch (error: any) {
    res.status(500).json({ error: 'Server error', details: error.message });
  } finally {
    client.release();
  }
};
