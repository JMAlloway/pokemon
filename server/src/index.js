import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './db.js';
import { initializeBackgroundJobs } from './services/backgroundJobs.js';
import ebayNotificationRoutes from './routes/ebayNotifications.js';
import searchRoutes from './routes/search.js';
import savedSearchRoutes from './routes/savedSearches.js';
import savedDealRoutes from './routes/savedDeals.js';
import listingRoutes from './routes/listings.js';
import chaseListRoutes from './routes/chaseLists.js';
import snipeWatchlistRoutes from './routes/snipeWatchlist.js';
import sellerRoutes from './routes/sellers.js';
import marketAlertRoutes from './routes/marketAlerts.js';
import setRoutes from './routes/sets.js';
import snipeAlertRoutes from './routes/snipeAlerts.js';
import portfolioRoutes from './routes/portfolio.js';
import notificationSettingsRoutes from './routes/notificationSettings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Trust first proxy (fixes express-rate-limit X-Forwarded-For warning)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow inline scripts for development
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? false // Same origin in production
    : ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));

// Rate limiting for API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please slow down.' }
});

app.use('/api/', apiLimiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));

// Request logger for API debugging
app.use('/api/', (req, _res, next) => {
  if (!req.path.startsWith('/ebay')) {
    console.log(`[API] ${req.method} /api${req.path} body=${req.body ? JSON.stringify(req.body).substring(0, 100) : 'none'}`);
  }
  next();
});

// eBay Marketplace Account Deletion notifications (must be publicly accessible)
app.use('/api/ebay', ebayNotificationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Ensure a default user exists (single-user app, no login required)
async function ensureDefaultUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    const bcrypt = await import('bcrypt');
    user = await prisma.user.create({
      data: {
        username: 'default',
        email: 'default@pokearb.local',
        password: await bcrypt.default.hash('not-used', 10)
      }
    });
    console.log('Default user created');
  }
  return user;
}

// Start server
async function start() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    // Ensure default user and inject userId into all API requests
    const defaultUser = await ensureDefaultUser();
    app.use('/api/', (req, _res, next) => {
      req.userId = defaultUser.id;
      next();
    });

    // Register API routes (after userId middleware)
    app.use('/api/search', searchRoutes);
    app.use('/api/saved-searches', savedSearchRoutes);
    app.use('/api/saved-deals', savedDealRoutes);
    app.use('/api/listings', listingRoutes);
    app.use('/api/chase-lists', chaseListRoutes);
    app.use('/api/snipe-watchlist', snipeWatchlistRoutes);
    app.use('/api/sellers', sellerRoutes);
    app.use('/api/market-alerts', marketAlertRoutes);
    app.use('/api/sets', setRoutes);
    app.use('/api/snipe-alerts', snipeAlertRoutes);
    app.use('/api/portfolio', portfolioRoutes);
    app.use('/api/notification-settings', notificationSettingsRoutes);

    // Serve static frontend in production (after API routes so they take priority)
    const clientDistPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDistPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
        if (err) {
          res.status(404).json({ error: 'Not found' });
        }
      });
    });

    // Error handling (must be after all routes to catch their errors)
    app.use((err, req, res, _next) => {
      console.error('Unhandled error:', err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // Initialize background jobs
    initializeBackgroundJobs();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

      if (!process.env.EBAY_APP_ID || !process.env.EBAY_CERT_ID) {
        console.log('Note: No eBay API credentials configured. Using sample data for development.');
        console.log('Set EBAY_APP_ID and EBAY_CERT_ID in .env for live eBay data.');
      } else {
        console.log(`eBay API: ${process.env.EBAY_ENVIRONMENT || 'sandbox'} environment`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
