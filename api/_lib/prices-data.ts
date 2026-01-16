import { readFileSync } from 'fs';
import { join } from 'path';

export interface StorePrice {
  regular: number;
  lowest: number;
  hasOffer: boolean;
}

export interface IngredientPrice {
  ingredientName: string;
  category: string;
  unit: string;
  lijssieUrl: string;
  prices: Record<string, StorePrice>;
  cheapestStore: string | null;
  cheapestPrice: number | null;
}

export interface PricesData {
  lastUpdated: string;
  source: string;
  description: string;
  totalIngredients: number;
  successCount: number;
  totalOffers: number;
  stores: string[];
  currentPrices: IngredientPrice[];
  history: Array<{ date: string; prices: IngredientPrice[] }>;
}

// Legacy Offer interface for backwards compatibility
export interface Offer {
  store: string;
  productName: string;
  originalPrice: number;
  salePrice: number;
  discount: string;
  validUntil: string;
  category: string;
}

// Cache the loaded data
let pricesData: PricesData | null = null;

export async function getPricesData(): Promise<PricesData | null> {
  if (pricesData) {
    return pricesData;
  }

  try {
    const filePath = join(process.cwd(), 'data', 'prices.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    pricesData = JSON.parse(fileContent);
    return pricesData;
  } catch (error) {
    console.error('Error loading prices data:', error);
    return null;
  }
}

export async function getIngredientPrices(): Promise<IngredientPrice[]> {
  const data = await getPricesData();
  return data?.currentPrices || [];
}

// Convert Lijssie prices to Offer format for backwards compatibility
export async function getOffersFromData(): Promise<Offer[]> {
  const data = await getPricesData();
  if (!data) return [];

  const offers: Offer[] = [];

  for (const ingredient of data.currentPrices) {
    for (const [store, priceInfo] of Object.entries(ingredient.prices)) {
      if (priceInfo.hasOffer) {
        offers.push({
          store,
          productName: `${ingredient.ingredientName} (${ingredient.unit})`,
          originalPrice: priceInfo.regular,
          salePrice: priceInfo.lowest,
          discount: `${Math.round((1 - priceInfo.lowest / priceInfo.regular) * 100)}%`,
          validUntil: data.lastUpdated.split('T')[0],
          category: ingredient.category,
        });
      }
    }
  }

  return offers;
}

export function getLastUpdated(): string | null {
  return pricesData?.lastUpdated || null;
}

export function getAllStores(): string[] {
  return pricesData?.stores || [];
}
