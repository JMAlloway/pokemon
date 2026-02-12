import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../db.js';
import { authenticate } from '../middleware/auth.js';
import { validateRegistration } from '../middleware/validate.js';

const router = Router();
const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] }
    });

    if (existingUser) {
      const field = existingUser.username === username ? 'Username' : 'Email';
      return res.status(409).json({ error: `${field} already taken` });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword }
    });

    const tokens = generateTokens(user.id);

    res.status(201).json({
      user: { id: user.id, username: user.username, email: user.email },
      ...tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const identifier = email.toLowerCase().trim();
    const user = identifier.includes('@')
      ? await prisma.user.findUnique({ where: { email: identifier } })
      : await prisma.user.findUnique({ where: { username: identifier } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last active
    await prisma.user.update({
      where: { id: user.id },
      data: { lastActiveAt: new Date() }
    });

    const tokens = generateTokens(user.id);

    res.json({
      user: { id: user.id, username: user.username, email: user.email },
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const tokens = generateTokens(user.id);
    res.json(tokens);
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { id: true, username: true, email: true, createdAt: true, lastActiveAt: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

export default router;
