import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOffersFromData, type Offer } from '../_lib/prices-data';
import { getRecipeById } from '../_lib/recipes';
import { matchRecipeToOffers } from '../_lib/matcher';

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
    cachedOffers = await getOffersFromData();
    cacheTimestamp = now;
    return cachedOffers;
  } catch (error) {
    console.error('Failed to get offers:', error);
    if (cachedOffers.length > 0) {
      return cachedOffers;
    }
    return [];
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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Recipe ID is required',
    });
  }

  try {
    const recipe = getRecipeById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        error: 'Recipe not found',
      });
    }

    const offers = await getOffers();
    const match = matchRecipeToOffers(recipe, offers);

    return res.status(200).json({
      success: true,
      data: {
        ...recipe,
        ingredientMatches: match.ingredientMatches,
        totalMatchingIngredients: match.totalMatchingIngredients,
        estimatedCost: match.estimatedCost,
        estimatedSavings: match.estimatedSavings,
        matchScore: match.matchScore,
      },
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch recipe',
    });
  }
}
