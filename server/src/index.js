import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './db.js';
import { initializeBackgroundJobs } from './services/backgroundJobs.js';
import authRoutes from './routes/auth.js';
import searchRoutes from './routes/search.js';
import savedSearchRoutes from './routes/savedSearches.js';
import savedDealRoutes from './routes/savedDeals.js';
import listingRoutes from './routes/listings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

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

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/saved-searches', savedSearchRoutes);
app.use('/api/saved-deals', savedDealRoutes);
app.use('/api/listings', listingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production
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

// Error handling
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
async function start() {
  try {
    await prisma.$connect();
    console.log('Database connected');

    // Initialize background jobs
    initializeBackgroundJobs();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

      if (!process.env.EBAY_OAUTH_TOKEN) {
        console.log('Note: No eBay API credentials configured. Using sample data for development.');
        console.log('Set EBAY_APP_ID, EBAY_CERT_ID, and EBAY_OAUTH_TOKEN in .env for live data.');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
