import type { Offer } from './prices-data';
import type { Recipe, RecipeIngredient } from './recipes';

const PANTRY_STAPLES = [
  'ui', 'knoflook', 'zout', 'peper', 'olijfolie', 'zonnebloemolie', 'boter',
  'bloem', 'suiker', 'azijn', 'bouillon', 'kruiden', 'specerijen',
  'tomatenpuree', 'mosterd', 'sojasaus', 'olie'
];

export interface IngredientMatch {
  ingredient: RecipeIngredient;
  matchingOffers: Offer[];
  bestOffer?: Offer;
  savings: number;
}

export interface RecipeMatch {
  recipe: Recipe;
  ingredientMatches: IngredientMatch[];
  totalMatchingIngredients: number;
  estimatedCost: number;
  estimatedSavings: number;
  matchScore: number;
}

function normalizeString(str: string): string {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function ingredientMatchesOffer(ingredient: RecipeIngredient, offer: Offer): boolean {
  const ingredientName = normalizeString(ingredient.name);
  const offerName = normalizeString(offer.productName);

  const ingredientWords = ingredientName.split(' ');
  const offerWords = offerName.split(' ');

  for (const word of ingredientWords) {
    if (word.length < 3) continue;

    for (const offerWord of offerWords) {
      if (offerWord.includes(word) || word.includes(offerWord)) {
        return true;
      }
    }
  }

  const synonyms: Record<string, string[]> = {
    'gehakt': ['rundergehakt', 'half om half', 'kipgehakt', 'gehakt'],
    'kip': ['kipfilet', 'kipdrumstick', 'kippenbout', 'kip'],
    'tomaat': ['tomaten', 'tomatenblokjes', 'passata', 'tomatenpuree'],
    'bonen': ['kidneybonen', 'witte bonen', 'zwarte bonen', 'bruine bonen'],
    'pasta': ['spaghetti', 'penne', 'macaroni', 'fusilli', 'lasagne'],
    'rijst': ['basmatirijst', 'jasmijnrijst', 'witte rijst', 'risottorijst'],
    'kaas': ['geraspte kaas', 'goudse kaas', 'mozzarella', 'parmezaan'],
    'melk': ['halfvolle melk', 'volle melk', 'magere melk'],
    'worst': ['rookworst', 'braadworst'],
    'varken': ['varkensschouder', 'varkenshaas', 'spek', 'varkensvlees'],
    'rund': ['rundvlees', 'runderstoofvlees', 'biefstuk', 'rundergehakt'],
    'linzen': ['rode linzen', 'bruine linzen', 'linzen'],
    'pompoen': ['flespompoen', 'hokkaido', 'butternut', 'pompoen'],
  };

  for (const [base, variants] of Object.entries(synonyms)) {
    if (ingredientName.includes(base) || variants.some(v => ingredientName.includes(v))) {
      if (offerName.includes(base) || variants.some(v => offerName.includes(v))) {
        return true;
      }
    }
  }

  return false;
}

export function matchRecipeToOffers(recipe: Recipe, offers: Offer[]): RecipeMatch {
  const ingredientMatches: IngredientMatch[] = [];
  let totalMatchingIngredients = 0;
  let estimatedSavings = 0;

  for (const ingredient of recipe.ingredients) {
    if (ingredient.isPantryStaple) {
      ingredientMatches.push({
        ingredient,
        matchingOffers: [],
        savings: 0,
      });
      continue;
    }

    const isPantryStaple = PANTRY_STAPLES.some(staple =>
      normalizeString(ingredient.name).includes(staple)
    );

    if (isPantryStaple) {
      ingredientMatches.push({
        ingredient,
        matchingOffers: [],
        savings: 0,
      });
      continue;
    }

    const matchingOffers = offers.filter(offer =>
      ingredientMatchesOffer(ingredient, offer)
    );

    if (matchingOffers.length > 0) {
      totalMatchingIngredients++;

      // Find offer with highest discount
      const bestOffer = matchingOffers.reduce((best, current) => {
        const bestDiscount = parseInt(best.discount.replace('%', '')) || 0;
        const currentDiscount = parseInt(current.discount.replace('%', '')) || 0;
        return currentDiscount > bestDiscount ? current : best;
      });

      const savings = bestOffer.originalPrice - bestOffer.salePrice;
      estimatedSavings += savings;

      ingredientMatches.push({
        ingredient,
        matchingOffers,
        bestOffer,
        savings,
      });
    } else {
      ingredientMatches.push({
        ingredient,
        matchingOffers: [],
        savings: 0,
      });
    }
  }

  const nonPantryIngredients = recipe.ingredients.filter(i =>
    !i.isPantryStaple && !PANTRY_STAPLES.some(s => normalizeString(i.name).includes(s))
  );

  const matchScore = nonPantryIngredients.length > 0
    ? (totalMatchingIngredients / nonPantryIngredients.length) * 100
    : 0;

  let estimatedCost = 0;
  for (const match of ingredientMatches) {
    if (match.bestOffer) {
      estimatedCost += match.bestOffer.salePrice;
    } else if (!match.ingredient.isPantryStaple) {
      estimatedCost += 2.50;
    }
  }

  return {
    recipe,
    ingredientMatches,
    totalMatchingIngredients,
    estimatedCost: Math.round(estimatedCost * 100) / 100,
    estimatedSavings: Math.round(estimatedSavings * 100) / 100,
    matchScore: Math.round(matchScore),
  };
}

export function findTopMatchingRecipes(recipes: Recipe[], offers: Offer[], limit = 10): RecipeMatch[] {
  const matches = recipes.map(recipe => matchRecipeToOffers(recipe, offers));

  return matches
    .filter(m => m.totalMatchingIngredients > 0)
    .sort((a, b) => {
      if (b.totalMatchingIngredients !== a.totalMatchingIngredients) {
        return b.totalMatchingIngredients - a.totalMatchingIngredients;
      }
      return b.estimatedSavings - a.estimatedSavings;
    })
    .slice(0, limit);
}

export function findCheapestRecipes(recipes: Recipe[], offers: Offer[], limit = 10): RecipeMatch[] {
  const matches = recipes.map(recipe => matchRecipeToOffers(recipe, offers));

  return matches
    .sort((a, b) => {
      const costPerServingA = a.estimatedCost / a.recipe.servings;
      const costPerServingB = b.estimatedCost / b.recipe.servings;
      return costPerServingA - costPerServingB;
    })
    .slice(0, limit);
}

export function findBestDeals(recipes: Recipe[], offers: Offer[], limit = 10): RecipeMatch[] {
  const matches = recipes.map(recipe => matchRecipeToOffers(recipe, offers));

  return matches
    .filter(m => m.estimatedSavings > 0)
    .sort((a, b) => b.estimatedSavings - a.estimatedSavings)
    .slice(0, limit);
}
