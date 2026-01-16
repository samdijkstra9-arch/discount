import type { Offer } from './scraper';
import { readFileSync } from 'fs';
import { join } from 'path';

// Cache the loaded data
let offersData: { lastUpdated: string; totalOffers: number; offers: Offer[] } | null = null;

export async function getOffersFromData(): Promise<Offer[]> {
  if (offersData) {
    return offersData.offers;
  }

  try {
    // Read the offers.json file directly from the data directory
    const filePath = join(process.cwd(), 'data', 'offers.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    offersData = JSON.parse(fileContent);
    return offersData?.offers || [];
  } catch (error) {
    console.error('Error loading offers data:', error);
    return [];
  }
}

export function getLastUpdated(): string | null {
  return offersData?.lastUpdated || null;
}
