import type { Recipe, Offer, MatchedRecipe, OfferMatch, Ingredient, ShoppingList, ShoppingListItem } from '../../../shared/types.js';

// Pantry staples - items assumed to be in every household
const PANTRY_STAPLES = [
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

// Common Dutch ingredient name variations for matching
const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  'kip': ['kipfilet', 'kipdrumstick', 'kippendij', 'kippenvleugel', 'kippenborst', 'kippenbout'],
  'gehakt': ['rundergehakt', 'varkensgehakt', 'half-om-half gehakt', 'kipgehakt'],
  'tomaat': ['tomaten', 'cherrytomaat', 'roma tomaat', 'trostomaat', 'tomatenblokjes'],
  'pasta': ['spaghetti', 'penne', 'macaroni', 'fusilli', 'tagliatelle', 'linguine'],
  'rijst': ['basmatirijst', 'jasmijnrijst', 'witte rijst', 'zilvervliesrijst', 'risottorijst'],
  'bonen': ['kidneybonen', 'witte bonen', 'zwarte bonen', 'bruine bonen', 'cannellinibonen'],
  'paprika': ['rode paprika', 'groene paprika', 'gele paprika', 'paprika mix'],
  'ui': ['uien', 'rode ui', 'witte ui', 'sjalot', 'bosui'],
  'kaas': ['jonge kaas', 'belegen kaas', 'oude kaas', 'geraspte kaas', 'parmezaan', 'mozzarella'],
  'aardappel': ['aardappelen', 'kruimige aardappelen', 'vastkokende aardappelen'],
  'wortel': ['wortelen', 'winterwortel', 'bospeen'],
  'room': ['slagroom', 'kookroom', 'creme fraiche'],
};

// Average prices per category (used when no offer matches)
const AVERAGE_PRICES: Record<string, number> = {
  'vlees': 8.00,
  'vis': 6.00,
  'zuivel': 2.50,
  'groenten': 1.50,
  'fruit': 2.00,
  'brood': 2.50,
  'pasta-rijst': 1.50,
  'conserven': 1.20,
  'diepvries': 3.00,
  'sauzen': 2.00,
  'kruiden': 1.50,
  'overig': 2.00,
};

function normalizeIngredient(name: string): string {
  return name.toLowerCase().trim();
}

function findMatchingOffer(ingredient: Ingredient, offers: Offer[]): Offer | null {
  const normalizedName = normalizeIngredient(ingredient.name);

  // Skip pantry staples
  if (isPantryStaple(ingredient.name)) {
    return null;
  }

  // Direct match
  for (const offer of offers) {
    const offerName = normalizeIngredient(offer.productName);
    if (offerName.includes(normalizedName) || normalizedName.includes(offerName)) {
      return offer;
    }
  }

  // Check synonyms
  for (const [base, synonyms] of Object.entries(INGREDIENT_SYNONYMS)) {
    if (normalizedName.includes(base) || synonyms.some(s => normalizedName.includes(s))) {
      for (const offer of offers) {
        const offerName = normalizeIngredient(offer.productName);
        if (offerName.includes(base) || synonyms.some(s => offerName.includes(s))) {
          return offer;
        }
      }
    }
  }

  return null;
}

function isPantryStaple(ingredientName: string): boolean {
  const normalized = normalizeIngredient(ingredientName);
  return PANTRY_STAPLES.some(staple =>
    normalized.includes(staple) || staple.includes(normalized)
  );
}

function estimateIngredientPrice(ingredient: Ingredient, offer: Offer | null): number {
  if (offer) {
    return offer.offerPrice;
  }
  return AVERAGE_PRICES[ingredient.category] || 2.00;
}

function calculateSavings(ingredient: Ingredient, offer: Offer | null): number {
  if (!offer) return 0;
  return offer.originalPrice - offer.offerPrice;
}

export function matchRecipeWithOffers(recipe: Recipe, offers: Offer[]): MatchedRecipe {
  const matchedOffers: OfferMatch[] = [];
  let totalSavings = 0;
  let estimatedTotalCost = 0;
  let matchedCount = 0;
  let eligibleCount = 0;

  for (const ingredient of recipe.ingredients) {
    // Skip pantry staples in calculations
    if (isPantryStaple(ingredient.name)) {
      continue;
    }

    eligibleCount++;
    const matchingOffer = findMatchingOffer(ingredient, offers);

    if (matchingOffer) {
      matchedCount++;
      const savings = calculateSavings(ingredient, matchingOffer);
      totalSavings += savings;

      matchedOffers.push({
        ingredient,
        offer: matchingOffer,
        savings,
      });
    }

    estimatedTotalCost += estimateIngredientPrice(ingredient, matchingOffer);
  }

  const matchPercentage = eligibleCount > 0
    ? Math.round((matchedCount / eligibleCount) * 100)
    : 0;

  return {
    ...recipe,
    matchedOffers,
    totalSavings,
    estimatedTotalCost,
    matchPercentage,
    estimatedCostPerServing: estimatedTotalCost / recipe.servings,
  };
}

export function matchAllRecipes(recipes: Recipe[], offers: Offer[]): MatchedRecipe[] {
  return recipes
    .map(recipe => matchRecipeWithOffers(recipe, offers))
    .sort((a, b) => {
      // Sort by match percentage first, then by savings
      if (b.matchPercentage !== a.matchPercentage) {
        return b.matchPercentage - a.matchPercentage;
      }
      return b.totalSavings - a.totalSavings;
    });
}

export function generateShoppingList(recipes: { recipe: Recipe; servings: number }[], offers: Offer[]): ShoppingList {
  const itemMap = new Map<string, ShoppingListItem>();

  for (const { recipe, servings } of recipes) {
    const scaleFactor = servings / recipe.servings;

    for (const ingredient of recipe.ingredients) {
      // Skip pantry staples
      if (isPantryStaple(ingredient.name)) {
        continue;
      }

      const key = normalizeIngredient(ingredient.name);
      const existingItem = itemMap.get(key);
      const matchingOffer = findMatchingOffer(ingredient, offers);

      const scaledAmount = ingredient.amount * scaleFactor;
      const estimatedPrice = estimateIngredientPrice(ingredient, matchingOffer);

      if (existingItem) {
        // Combine quantities
        existingItem.ingredient.amount += scaledAmount;
        existingItem.estimatedPrice += estimatedPrice;
      } else {
        itemMap.set(key, {
          ingredient: {
            ...ingredient,
            amount: scaledAmount,
          },
          recipe: recipe.name,
          offer: matchingOffer || undefined,
          estimatedPrice,
          isOnOffer: !!matchingOffer,
        });
      }
    }
  }

  const items = Array.from(itemMap.values());

  // Group by store
  const ahItems = items.filter(item => item.offer?.store === 'albert-heijn');
  const jumboItems = items.filter(item => item.offer?.store === 'jumbo');
  const noOfferItems = items.filter(item => !item.offer);

  const totalEstimatedCost = items.reduce((sum, item) => sum + item.estimatedPrice, 0);
  const totalSavings = items.reduce((sum, item) => {
    if (item.offer) {
      return sum + (item.offer.originalPrice - item.offer.offerPrice);
    }
    return sum;
  }, 0);

  return {
    items,
    totalEstimatedCost,
    totalSavings,
    stores: [
      {
        store: 'albert-heijn',
        items: ahItems,
        subtotal: ahItems.reduce((sum, item) => sum + item.estimatedPrice, 0),
      },
      {
        store: 'jumbo',
        items: jumboItems,
        subtotal: jumboItems.reduce((sum, item) => sum + item.estimatedPrice, 0),
      },
    ],
  };
}

export function getTopMatchingRecipes(recipes: Recipe[], offers: Offer[], limit = 10): MatchedRecipe[] {
  return matchAllRecipes(recipes, offers).slice(0, limit);
}

export function getBestDeals(recipes: Recipe[], offers: Offer[], limit = 5): MatchedRecipe[] {
  return matchAllRecipes(recipes, offers)
    .filter(r => r.totalSavings > 0)
    .sort((a, b) => b.totalSavings - a.totalSavings)
    .slice(0, limit);
}

export function getCheapestRecipes(recipes: Recipe[], offers: Offer[], limit = 10): MatchedRecipe[] {
  return matchAllRecipes(recipes, offers)
    .sort((a, b) => (a.estimatedCostPerServing || 0) - (b.estimatedCostPerServing || 0))
    .slice(0, limit);
}
