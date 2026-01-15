import { Router } from 'express';
import {
  getAllRecipes,
  getRecipe,
  getRecipesByTag,
  searchRecipes,
  getBatchFriendlyRecipes,
  getFreezerFriendlyRecipes,
  getRecipeTags,
} from '../database/recipes.js';
import { getActiveOffers } from '../database/offers.js';
import {
  matchRecipeWithOffers,
  matchAllRecipes,
  getTopMatchingRecipes,
  getBestDeals,
  getCheapestRecipes,
  generateShoppingList,
} from '../utils/matcher.js';
import type { Recipe } from '../../../shared/types.js';

const router = Router();

// Get all recipes with offer matching
router.get('/', (req, res) => {
  try {
    const recipes = getAllRecipes();
    const offers = getActiveOffers();

    const matchedRecipes = matchAllRecipes(recipes, offers);
    res.json({ success: true, data: matchedRecipes });
  } catch (error) {
    console.error('Error fetching recipes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recipes' });
  }
});

// Get top recipes matching current offers
router.get('/top-matches', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const recipes = getAllRecipes();
    const offers = getActiveOffers();

    const topRecipes = getTopMatchingRecipes(recipes, offers, limit);
    res.json({ success: true, data: topRecipes });
  } catch (error) {
    console.error('Error fetching top matches:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recipes' });
  }
});

// Get best deals (highest savings)
router.get('/best-deals', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 5;
    const recipes = getAllRecipes();
    const offers = getActiveOffers();

    const bestDeals = getBestDeals(recipes, offers, limit);
    res.json({ success: true, data: bestDeals });
  } catch (error) {
    console.error('Error fetching best deals:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recipes' });
  }
});

// Get cheapest recipes
router.get('/cheapest', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const recipes = getAllRecipes();
    const offers = getActiveOffers();

    const cheapest = getCheapestRecipes(recipes, offers, limit);
    res.json({ success: true, data: cheapest });
  } catch (error) {
    console.error('Error fetching cheapest recipes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recipes' });
  }
});

// Get batch-friendly recipes
router.get('/batch-friendly', (req, res) => {
  try {
    const minScore = parseInt(req.query.minScore as string) || 4;
    const recipes = getBatchFriendlyRecipes(minScore);
    const offers = getActiveOffers();

    const matchedRecipes = matchAllRecipes(recipes, offers);
    res.json({ success: true, data: matchedRecipes });
  } catch (error) {
    console.error('Error fetching batch-friendly recipes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recipes' });
  }
});

// Get freezer-friendly recipes
router.get('/freezer-friendly', (req, res) => {
  try {
    const recipes = getFreezerFriendlyRecipes();
    const offers = getActiveOffers();

    const matchedRecipes = matchAllRecipes(recipes, offers);
    res.json({ success: true, data: matchedRecipes });
  } catch (error) {
    console.error('Error fetching freezer-friendly recipes:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recipes' });
  }
});

// Get recipes by tag
router.get('/tag/:tag', (req, res) => {
  try {
    const recipes = getRecipesByTag(req.params.tag);
    const offers = getActiveOffers();

    const matchedRecipes = matchAllRecipes(recipes, offers);
    res.json({ success: true, data: matchedRecipes });
  } catch (error) {
    console.error('Error fetching recipes by tag:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recipes' });
  }
});

// Get all available tags
router.get('/tags', (req, res) => {
  try {
    const tags = getRecipeTags();
    res.json({ success: true, data: tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch tags' });
  }
});

// Search recipes
router.get('/search', (req, res) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ success: false, error: 'Search query required' });
    }

    const recipes = searchRecipes(query);
    const offers = getActiveOffers();

    const matchedRecipes = matchAllRecipes(recipes, offers);
    res.json({ success: true, data: matchedRecipes });
  } catch (error) {
    console.error('Error searching recipes:', error);
    res.status(500).json({ success: false, error: 'Failed to search recipes' });
  }
});

// Get single recipe by ID
router.get('/:id', (req, res) => {
  try {
    const recipe = getRecipe(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, error: 'Recipe not found' });
    }

    const offers = getActiveOffers();
    const matchedRecipe = matchRecipeWithOffers(recipe, offers);

    res.json({ success: true, data: matchedRecipe });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch recipe' });
  }
});

// Generate shopping list
router.post('/shopping-list', (req, res) => {
  try {
    const { recipes: recipeRequests } = req.body as {
      recipes: { id: string; servings: number }[];
    };

    if (!recipeRequests || !Array.isArray(recipeRequests)) {
      return res.status(400).json({ success: false, error: 'Invalid request body' });
    }

    const recipesWithServings: { recipe: Recipe; servings: number }[] = [];

    for (const request of recipeRequests) {
      const recipe = getRecipe(request.id);
      if (recipe) {
        recipesWithServings.push({
          recipe,
          servings: request.servings || recipe.servings,
        });
      }
    }

    const offers = getActiveOffers();
    const shoppingList = generateShoppingList(recipesWithServings, offers);

    res.json({ success: true, data: shoppingList });
  } catch (error) {
    console.error('Error generating shopping list:', error);
    res.status(500).json({ success: false, error: 'Failed to generate shopping list' });
  }
});

export default router;
