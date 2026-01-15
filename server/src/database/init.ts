import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { homedir } from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Use absolute path relative to project root for consistency
const projectRoot = path.resolve(__dirname, '../..');
const dbPath = path.join(projectRoot, 'data/budget-recipes.db');

// Database path logged for debugging if needed

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  -- Offers table
  CREATE TABLE IF NOT EXISTS offers (
    id TEXT PRIMARY KEY,
    store TEXT NOT NULL,
    product_name TEXT NOT NULL,
    original_price REAL NOT NULL,
    offer_price REAL NOT NULL,
    discount_percentage REAL NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    valid_from TEXT NOT NULL,
    valid_until TEXT NOT NULL,
    image_url TEXT,
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Recipes table
  CREATE TABLE IF NOT EXISTS recipes (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    servings INTEGER NOT NULL,
    prep_time INTEGER NOT NULL,
    cook_time INTEGER NOT NULL,
    batch_cooking_score INTEGER NOT NULL,
    freezer_friendly INTEGER NOT NULL,
    fridge_life_days INTEGER NOT NULL,
    freezer_life_months INTEGER NOT NULL,
    image_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  -- Recipe ingredients table
  CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL,
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    unit TEXT NOT NULL,
    category TEXT NOT NULL,
    is_pantry_staple INTEGER DEFAULT 0,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  -- Recipe instructions table
  CREATE TABLE IF NOT EXISTS recipe_instructions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL,
    step_number INTEGER NOT NULL,
    instruction TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  -- Recipe variation tips table
  CREATE TABLE IF NOT EXISTS recipe_variations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL,
    day INTEGER NOT NULL,
    suggestion TEXT NOT NULL,
    extra_ingredients TEXT,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  -- Recipe tags table
  CREATE TABLE IF NOT EXISTS recipe_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
  );

  -- Create indexes
  CREATE INDEX IF NOT EXISTS idx_offers_store ON offers(store);
  CREATE INDEX IF NOT EXISTS idx_offers_category ON offers(category);
  CREATE INDEX IF NOT EXISTS idx_offers_valid ON offers(valid_from, valid_until);
  CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_name ON recipe_ingredients(name);
  CREATE INDEX IF NOT EXISTS idx_recipe_tags_tag ON recipe_tags(tag);
`);

export default db;
