import jwt from 'jsonwebtoken';
import { parse } from 'cookie';
import { NextApiRequest } from 'next';
import { CustomJwtPayload } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'rahasia';

export function getUserFromRequest(req: NextApiRequest): CustomJwtPayload | null {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {};
  if (!cookies.token) return null;

  try {
    const payload = jwt.verify(cookies.token, JWT_SECRET);

    // Pastikan payload bukan string dan memiliki properti yang diharapkan
    if (typeof payload === 'string') return null;
    return payload as CustomJwtPayload;
  } catch {
    return null;
  }
}
