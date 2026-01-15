// Supermarket types
export type Store = 'albert-heijn' | 'jumbo';

export interface Offer {
  id: string;
  store: Store;
  productName: string;
  originalPrice: number;
  offerPrice: number;
  discountPercentage: number;
  category: string;
  unit: string; // e.g., "per kg", "per stuk", "per 500g"
  validFrom: string;
  validUntil: string;
  imageUrl?: string;
  description?: string;
}

// Recipe types
export interface Ingredient {
  name: string;
  amount: number;
  unit: string; // e.g., "g", "ml", "stuks", "el" (eetlepel)
  category: string;
  isPantryStaple?: boolean;
}

export interface VariationTip {
  day: number;
  suggestion: string;
  extraIngredients?: string[];
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  servings: number;
  prepTime: number; // in minutes
  cookTime: number; // in minutes
  ingredients: Ingredient[];
  instructions: string[];
  batchCookingScore: number; // 1-5, how suitable for batch cooking
  freezerFriendly: boolean;
  fridgeLifeDays: number;
  freezerLifeMonths: number;
  variationTips: VariationTip[];
  tags: string[]; // e.g., "vegetarian", "vegan", "dutch", "quick"
  imageUrl?: string;
  estimatedCostPerServing?: number;
}

// Matched recipe with offers
export interface MatchedRecipe extends Recipe {
  matchedOffers: OfferMatch[];
  totalSavings: number;
  estimatedTotalCost: number;
  matchPercentage: number; // percentage of ingredients on offer
}

export interface OfferMatch {
  ingredient: Ingredient;
  offer: Offer;
  savings: number;
}

// Shopping list
export interface ShoppingListItem {
  ingredient: Ingredient;
  recipe: string;
  offer?: Offer;
  estimatedPrice: number;
  isOnOffer: boolean;
}

export interface ShoppingList {
  items: ShoppingListItem[];
  totalEstimatedCost: number;
  totalSavings: number;
  stores: {
    store: Store;
    items: ShoppingListItem[];
    subtotal: number;
  }[];
}

// API responses
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pantry staples - items assumed to be in every household
export const PANTRY_STAPLES = [
  'zout',
  'peper',
  'zwarte peper',
  'paprikapoeder',
  'knoflookpoeder',
  'uienpoeder',
  'oregano',
  'basilicum',
  'tijm',
  'komijn',
  'kerrie',
  'kurkuma',
  'kaneel',
  'nootmuskaat',
  'laurierblad',
  'zonnebloemolie',
  'olijfolie',
  'plantaardige olie',
  'bloem',
  'suiker',
  'boter',
  'margarine',
  'ui',
  'uien',
  'knoflook',
  'bouillonblokje',
  'groentebouillon',
  'kippenbouillon',
  'runderbouillon',
  'azijn',
  'witte wijnazijn',
  'balsamico azijn',
  'sojasaus',
  'tomatenpuree',
  'mosterd',
];

// Ingredient categories for matching
export const INGREDIENT_CATEGORIES = [
  'vlees',
  'vis',
  'zuivel',
  'groenten',
  'fruit',
  'brood',
  'pasta-rijst',
  'conserven',
  'diepvries',
  'dranken',
  'kruiden',
  'sauzen',
  'overig',
];
