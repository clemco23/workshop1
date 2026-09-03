import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import authService from '../src/services/authService.js';

const { generateToken, getUserFromToken } = authService;

describe('authService', () => {
  const user = {
    id: 'user-123',
    email: 'test@editly.fr',
  };

  describe('generateToken', () => {
    it('creates a valid JWT containing the user id and email', () => {
      const token = generateToken(user);
      const payload = jwt.decode(token);

      expect(typeof token).toBe('string');
      expect(payload).toMatchObject({
        userId: user.id,
        email: user.email,
      });
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });
  });

  describe('getUserFromToken', () => {
    it('returns null when the Authorization header is missing', async () => {
      await expect(getUserFromToken()).resolves.toBeNull();
    });

    it('returns null when the token is invalid', async () => {
      await expect(getUserFromToken('Bearer invalid-token')).resolves.toBeNull();
    });
  });
});
