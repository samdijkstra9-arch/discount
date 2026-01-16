import type { Offer } from './scraper';

// This will be populated at build time or read from the JSON file
let offersData: { lastUpdated: string; totalOffers: number; offers: Offer[] } | null = null;

export async function getOffersFromData(): Promise<Offer[]> {
  if (offersData) {
    return offersData.offers;
  }

  try {
    // Fetch the offers.json from the raw GitHub URL
    const response = await fetch(
      'https://raw.githubusercontent.com/samdijkstra9-arch/discount/main/data/offers.json',
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );

    if (!response.ok) {
      console.error('Failed to fetch offers data:', response.status);
      return [];
    }

    offersData = await response.json();
    return offersData?.offers || [];
  } catch (error) {
    console.error('Error loading offers data:', error);
    return [];
  }
}

export function getLastUpdated(): string | null {
  return offersData?.lastUpdated || null;
}
