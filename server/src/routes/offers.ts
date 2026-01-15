import { Router } from 'express';
import { getActiveOffers, getOffersByCategory, searchOffers, getOfferStats } from '../database/offers.js';
import { scrapeAllOffers } from '../scrapers/index.js';
import type { Store } from '../../../shared/types.js';

const router = Router();

// Get all active offers
router.get('/', (req, res) => {
  try {
    const store = req.query.store as Store | undefined;
    const offers = getActiveOffers(store);
    res.json({ success: true, data: offers });
  } catch (error) {
    console.error('Error fetching offers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch offers' });
  }
});

// Get offers by category
router.get('/category/:category', (req, res) => {
  try {
    const offers = getOffersByCategory(req.params.category);
    res.json({ success: true, data: offers });
  } catch (error) {
    console.error('Error fetching offers by category:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch offers' });
  }
});

// Search offers
router.get('/search', (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }
    const offers = searchOffers(query);
    res.json({ success: true, data: offers });
  } catch (error) {
    console.error('Error searching offers:', error);
    res.status(500).json({ success: false, error: 'Failed to search offers' });
  }
});

// Get offer statistics
router.get('/stats', (req, res) => {
  try {
    const stats = getOfferStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error fetching offer stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Trigger offer refresh (admin endpoint)
router.post('/refresh', async (req, res) => {
  try {
    const useSample = req.query.sample === 'true';
    const result = await scrapeAllOffers(useSample);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error refreshing offers:', error);
    res.status(500).json({ success: false, error: 'Failed to refresh offers' });
  }
});

export default router;
