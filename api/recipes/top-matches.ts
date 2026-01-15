import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeAllOffers, type Offer } from '../_lib/scraper';
import { getAllRecipes } from '../_lib/recipes';
import { findTopMatchingRecipes } from '../_lib/matcher';

// Simple in-memory cache with TTL
let cachedOffers: Offer[] = [];
let cacheTimestamp = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache

async function getOffers(): Promise<Offer[]> {
  const now = Date.now();

  if (cachedOffers.length > 0 && now - cacheTimestamp < CACHE_TTL) {
    return cachedOffers;
  }

  try {
    cachedOffers = await scrapeAllOffers();
    cacheTimestamp = now;
    return cachedOffers;
  } catch (error) {
    console.error('Failed to scrape offers:', error);
    if (cachedOffers.length > 0) {
      return cachedOffers;
    }
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const offers = await getOffers();
    const recipes = getAllRecipes();

    const { limit } = req.query;
    const limitNum = limit && typeof limit === 'string' ? parseInt(limit) : 10;

    const topMatches = findTopMatchingRecipes(recipes, offers, limitNum);

    const data = topMatches.map(match => ({
      ...match.recipe,
      totalMatchingIngredients: match.totalMatchingIngredients,
      estimatedCost: match.estimatedCost,
      estimatedSavings: match.estimatedSavings,
      matchScore: match.matchScore,
    }));

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error fetching top matches:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch top matching recipes',
    });
  }
}
