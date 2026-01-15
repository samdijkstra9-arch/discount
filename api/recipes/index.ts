import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeAllOffers, type Offer } from '../_lib/scraper';
import { getAllRecipes } from '../_lib/recipes';
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

    // Match each recipe with current offers
    const recipesWithMatches = recipes.map(recipe => {
      const match = matchRecipeToOffers(recipe, offers);
      return {
        ...recipe,
        matchingOffers: match.totalMatchingIngredients,
        estimatedCost: match.estimatedCost,
        estimatedSavings: match.estimatedSavings,
        matchScore: match.matchScore,
      };
    });

    // Filter by tag if requested
    const { tag, freezerFriendly, minServings } = req.query;

    let filteredRecipes = recipesWithMatches;

    if (tag && typeof tag === 'string') {
      filteredRecipes = filteredRecipes.filter(r =>
        r.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
      );
    }

    if (freezerFriendly === 'true') {
      filteredRecipes = filteredRecipes.filter(r => r.freezerFriendly);
    }

    if (minServings && typeof minServings === 'string') {
      const min = parseInt(minServings);
      if (!isNaN(min)) {
        filteredRecipes = filteredRecipes.filter(r => r.servings >= min);
      }
    }

    // Sort by match score by default
    filteredRecipes.sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      success: true,
      data: filteredRecipes,
    });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch recipes',
    });
  }
}
