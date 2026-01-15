import { scrapeAllStores as scrapeSupermarktAanbiedingen } from './supermarktaanbiedingen.js';
import { generateSampleAHOffers } from './albert-heijn.js';
import { generateSampleJumboOffers } from './jumbo.js';
import { saveOffers, clearOldOffers } from '../database/offers.js';
import type { Offer } from '../../../shared/types.js';

export async function scrapeAllOffers(useSampleData = false): Promise<{ ah: number; jumbo: number; total: number }> {
  console.log('Starting offer scraping...');

  // Clear old offers first
  const cleared = clearOldOffers();
  console.log(`Cleared ${cleared} expired offers`);

  let ahOffers: Offer[] = [];
  let jumboOffers: Offer[] = [];

  if (useSampleData) {
    console.log('Using sample data (scraping disabled)');
    ahOffers = generateSampleAHOffers();
    jumboOffers = generateSampleJumboOffers();
  } else {
    // Try to scrape from supermarktaanbiedingen.com
    try {
      console.log('Scraping from supermarktaanbiedingen.com...');
      const results = await scrapeSupermarktAanbiedingen();
      ahOffers = results.ah;
      jumboOffers = results.jumbo;

      // Fall back to sample data if scraping failed
      if (ahOffers.length === 0) {
        console.log('No AH offers scraped, using sample data');
        ahOffers = generateSampleAHOffers();
      }
      if (jumboOffers.length === 0) {
        console.log('No Jumbo offers scraped, using sample data');
        jumboOffers = generateSampleJumboOffers();
      }
    } catch (error) {
      console.error('Scraping failed, using sample data:', error);
      ahOffers = generateSampleAHOffers();
      jumboOffers = generateSampleJumboOffers();
    }
  }

  // Save to database
  if (ahOffers.length > 0) {
    saveOffers(ahOffers);
    console.log(`Saved ${ahOffers.length} Albert Heijn offers`);
  }

  if (jumboOffers.length > 0) {
    saveOffers(jumboOffers);
    console.log(`Saved ${jumboOffers.length} Jumbo offers`);
  }

  return {
    ah: ahOffers.length,
    jumbo: jumboOffers.length,
    total: ahOffers.length + jumboOffers.length,
  };
}

export { generateSampleAHOffers, generateSampleJumboOffers };
