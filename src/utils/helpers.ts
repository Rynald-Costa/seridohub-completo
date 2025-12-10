// src/utils/helpers.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// hash da senha
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// compara senha com hash
export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// payload que vamos colocar no token
export type TokenPayload = {
  id: number;
  email: string;
  tipo: string;
};

// gera JWT
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}
