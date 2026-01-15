import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import offersRouter from './routes/offers.js';
import recipesRouter from './routes/recipes.js';
import { scrapeAllOffers } from './scrapers/index.js';
import { getOfferStats } from './database/offers.js';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/offers', offersRouter);
app.use('/api/recipes', recipesRouter);

// Health check
app.get('/api/health', (req, res) => {
  const stats = getOfferStats();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    offers: stats,
  });
});

// Initialize offers on startup if database is empty
async function initializeOffers() {
  const stats = getOfferStats();
  if (stats.totalOffers === 0) {
    console.log('No offers in database, initializing with sample data...');
    await scrapeAllOffers(true); // Use sample data for initial setup
  }
}

// Schedule weekly offer refresh (every Monday at 6:00 AM)
cron.schedule('0 6 * * 1', async () => {
  console.log('Running scheduled offer refresh...');
  try {
    await scrapeAllOffers(false);
    console.log('Scheduled offer refresh complete');
  } catch (error) {
    console.error('Scheduled offer refresh failed:', error);
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  /api/health              - Health check');
  console.log('  GET  /api/offers              - All active offers');
  console.log('  GET  /api/offers/stats        - Offer statistics');
  console.log('  GET  /api/offers/search?q=    - Search offers');
  console.log('  POST /api/offers/refresh      - Refresh offers');
  console.log('  GET  /api/recipes             - All recipes with matching');
  console.log('  GET  /api/recipes/top-matches - Top matching recipes');
  console.log('  GET  /api/recipes/best-deals  - Best deals');
  console.log('  GET  /api/recipes/cheapest    - Cheapest recipes');
  console.log('  GET  /api/recipes/:id         - Single recipe');
  console.log('  POST /api/recipes/shopping-list - Generate shopping list');
  console.log('');

  await initializeOffers();
});
