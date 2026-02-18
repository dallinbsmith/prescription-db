import { query, queryOne } from '../config/database.js';
import { v4 as uuid } from 'uuid';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  role: 'ADMIN' | 'USER';
  created_at: Date;
}

export const UserModel = {
  findById: async (id: string): Promise<User | null> => {
    return queryOne<User>('SELECT * FROM users WHERE id = $1', [id]);
  },

  findByEmail: async (email: string): Promise<User | null> => {
    return queryOne<User>('SELECT * FROM users WHERE email = $1', [email]);
  },

  findAll: async (): Promise<User[]> => {
    return query<User>('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC');
  },

  create: async (data: { email: string; name: string; password: string; role?: 'ADMIN' | 'USER' }): Promise<User> => {
    const id = uuid();
    const password_hash = await bcrypt.hash(data.password, 10);

    const result = await queryOne<User>(
      `INSERT INTO users (id, email, name, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role, created_at`,
      [id, data.email, data.name, password_hash, data.role || 'USER']
    );
    return result!;
  },

  update: async (id: string, updates: { name?: string; role?: 'ADMIN' | 'USER' }): Promise<User | null> => {
    const fields: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (updates.name) {
      fields.push(`name = $${paramIndex}`);
      values.push(updates.name);
      paramIndex++;
    }

    if (updates.role) {
      fields.push(`role = $${paramIndex}`);
      values.push(updates.role);
      paramIndex++;
    }

    if (fields.length === 0) return UserModel.findById(id);

    values.push(id);
    return queryOne<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex}
       RETURNING id, email, name, role, created_at`,
      values
    );
  },

  updatePassword: async (id: string, newPassword: string): Promise<boolean> => {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const result = await queryOne<User>(
      'UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id',
      [password_hash, id]
    );
    return result !== null;
  },

  verifyPassword: async (user: User, password: string): Promise<boolean> => {
    return bcrypt.compare(password, user.password_hash);
  },

  delete: async (id: string): Promise<boolean> => {
    const result = await queryOne<{ id: string }>('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    return result !== null;
  },
};
