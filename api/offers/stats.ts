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

    const byStore: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const offer of offers) {
      byStore[offer.store] = (byStore[offer.store] || 0) + 1;
      byCategory[offer.category] = (byCategory[offer.category] || 0) + 1;
    }

    return res.status(200).json({
      success: true,
      data: {
        totalOffers: offers.length,
        byStore,
        byCategory,
      },
    });
  } catch (error) {
    console.error('Error fetching offer stats:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch offer statistics',
    });
  }
}
