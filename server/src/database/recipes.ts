import db from './init.js';
import type { Recipe, Ingredient, VariationTip } from '../../../shared/types.js';

export function saveRecipe(recipe: Recipe): void {
  const insertRecipe = db.prepare(`
    INSERT OR REPLACE INTO recipes (
      id, name, description, servings, prep_time, cook_time,
      batch_cooking_score, freezer_friendly, fridge_life_days,
      freezer_life_months, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const deleteIngredients = db.prepare('DELETE FROM recipe_ingredients WHERE recipe_id = ?');
  const deleteInstructions = db.prepare('DELETE FROM recipe_instructions WHERE recipe_id = ?');
  const deleteVariations = db.prepare('DELETE FROM recipe_variations WHERE recipe_id = ?');
  const deleteTags = db.prepare('DELETE FROM recipe_tags WHERE recipe_id = ?');

  const insertIngredient = db.prepare(`
    INSERT INTO recipe_ingredients (recipe_id, name, amount, unit, category, is_pantry_staple)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertInstruction = db.prepare(`
    INSERT INTO recipe_instructions (recipe_id, step_number, instruction)
    VALUES (?, ?, ?)
  `);

  const insertVariation = db.prepare(`
    INSERT INTO recipe_variations (recipe_id, day, suggestion, extra_ingredients)
    VALUES (?, ?, ?, ?)
  `);

  const insertTag = db.prepare(`
    INSERT INTO recipe_tags (recipe_id, tag) VALUES (?, ?)
  `);

  const transaction = db.transaction((recipe: Recipe) => {
    // Insert recipe
    insertRecipe.run(
      recipe.id,
      recipe.name,
      recipe.description,
      recipe.servings,
      recipe.prepTime,
      recipe.cookTime,
      recipe.batchCookingScore,
      recipe.freezerFriendly ? 1 : 0,
      recipe.fridgeLifeDays,
      recipe.freezerLifeMonths,
      recipe.imageUrl || null
    );

    // Clear existing related data
    deleteIngredients.run(recipe.id);
    deleteInstructions.run(recipe.id);
    deleteVariations.run(recipe.id);
    deleteTags.run(recipe.id);

    // Insert ingredients
    for (const ingredient of recipe.ingredients) {
      insertIngredient.run(
        recipe.id,
        ingredient.name,
        ingredient.amount,
        ingredient.unit,
        ingredient.category,
        ingredient.isPantryStaple ? 1 : 0
      );
    }

    // Insert instructions
    recipe.instructions.forEach((instruction, index) => {
      insertInstruction.run(recipe.id, index + 1, instruction);
    });

    // Insert variations
    for (const variation of recipe.variationTips) {
      insertVariation.run(
        recipe.id,
        variation.day,
        variation.suggestion,
        variation.extraIngredients ? JSON.stringify(variation.extraIngredients) : null
      );
    }

    // Insert tags
    for (const tag of recipe.tags) {
      insertTag.run(recipe.id, tag);
    }
  });

  transaction(recipe);
}

export function getRecipe(id: string): Recipe | null {
  const recipeRow = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id) as any;

  if (!recipeRow) return null;

  return buildRecipeFromRow(recipeRow);
}

export function getAllRecipes(): Recipe[] {
  const rows = db.prepare('SELECT * FROM recipes ORDER BY batch_cooking_score DESC').all() as any[];
  return rows.map(buildRecipeFromRow);
}

export function getRecipesByTag(tag: string): Recipe[] {
  const rows = db.prepare(`
    SELECT r.* FROM recipes r
    JOIN recipe_tags t ON r.id = t.recipe_id
    WHERE t.tag = ?
    ORDER BY r.batch_cooking_score DESC
  `).all(tag) as any[];

  return rows.map(buildRecipeFromRow);
}

export function searchRecipes(query: string): Recipe[] {
  const searchTerm = `%${query.toLowerCase()}%`;

  const rows = db.prepare(`
    SELECT DISTINCT r.* FROM recipes r
    LEFT JOIN recipe_tags t ON r.id = t.recipe_id
    LEFT JOIN recipe_ingredients i ON r.id = i.recipe_id
    WHERE LOWER(r.name) LIKE ?
    OR LOWER(r.description) LIKE ?
    OR LOWER(t.tag) LIKE ?
    OR LOWER(i.name) LIKE ?
    ORDER BY r.batch_cooking_score DESC
  `).all(searchTerm, searchTerm, searchTerm, searchTerm) as any[];

  return rows.map(buildRecipeFromRow);
}

export function getBatchFriendlyRecipes(minScore: number = 4): Recipe[] {
  const rows = db.prepare(`
    SELECT * FROM recipes
    WHERE batch_cooking_score >= ?
    ORDER BY batch_cooking_score DESC
  `).all(minScore) as any[];

  return rows.map(buildRecipeFromRow);
}

export function getFreezerFriendlyRecipes(): Recipe[] {
  const rows = db.prepare(`
    SELECT * FROM recipes
    WHERE freezer_friendly = 1
    ORDER BY batch_cooking_score DESC
  `).all() as any[];

  return rows.map(buildRecipeFromRow);
}

function buildRecipeFromRow(row: any): Recipe {
  const ingredients = db.prepare(`
    SELECT * FROM recipe_ingredients WHERE recipe_id = ?
  `).all(row.id) as any[];

  const instructions = db.prepare(`
    SELECT instruction FROM recipe_instructions
    WHERE recipe_id = ? ORDER BY step_number
  `).all(row.id) as { instruction: string }[];

  const variations = db.prepare(`
    SELECT * FROM recipe_variations WHERE recipe_id = ? ORDER BY day
  `).all(row.id) as any[];

  const tags = db.prepare(`
    SELECT tag FROM recipe_tags WHERE recipe_id = ?
  `).all(row.id) as { tag: string }[];

  return {
    id: row.id,
    name: row.name,
    description: row.description,
    servings: row.servings,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    batchCookingScore: row.batch_cooking_score,
    freezerFriendly: row.freezer_friendly === 1,
    fridgeLifeDays: row.fridge_life_days,
    freezerLifeMonths: row.freezer_life_months,
    imageUrl: row.image_url,
    ingredients: ingredients.map((i: any) => ({
      name: i.name,
      amount: i.amount,
      unit: i.unit,
      category: i.category,
      isPantryStaple: i.is_pantry_staple === 1,
    })),
    instructions: instructions.map(i => i.instruction),
    variationTips: variations.map((v: any) => ({
      day: v.day,
      suggestion: v.suggestion,
      extraIngredients: v.extra_ingredients ? JSON.parse(v.extra_ingredients) : undefined,
    })),
    tags: tags.map(t => t.tag),
  };
}

export function getRecipeIngredients(): string[] {
  const rows = db.prepare(`
    SELECT DISTINCT LOWER(name) as name FROM recipe_ingredients
    WHERE is_pantry_staple = 0
    ORDER BY name
  `).all() as { name: string }[];

  return rows.map(r => r.name);
}

export function getRecipeTags(): string[] {
  const rows = db.prepare(`
    SELECT DISTINCT tag FROM recipe_tags ORDER BY tag
  `).all() as { tag: string }[];

  return rows.map(r => r.tag);
}
