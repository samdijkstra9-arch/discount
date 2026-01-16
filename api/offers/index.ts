import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getOffersFromData, type Offer } from '../_lib/prices-data';

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
  // Set CORS headers
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

    // Filter by store if requested
    const { store, category, search } = req.query;

    let filteredOffers = offers;

    if (store && typeof store === 'string') {
      filteredOffers = filteredOffers.filter(o => o.store === store);
    }

    if (category && typeof category === 'string') {
      filteredOffers = filteredOffers.filter(o => o.category === category);
    }

    if (search && typeof search === 'string') {
      const searchLower = search.toLowerCase();
      filteredOffers = filteredOffers.filter(o =>
        o.productName.toLowerCase().includes(searchLower)
      );
    }

    // Sort by discount percentage by default
    filteredOffers.sort((a, b) => {
      const discountA = parseInt(a.discount.replace('%', '')) || 0;
      const discountB = parseInt(b.discount.replace('%', '')) || 0;
      return discountB - discountA;
    });

    return res.status(200).json({
      success: true,
      data: filteredOffers,
      meta: {
        total: filteredOffers.length,
        cached: Date.now() - cacheTimestamp < 1000,
      }
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch offers',
    });
  }
}
