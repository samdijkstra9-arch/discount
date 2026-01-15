import db from './init.js';
import type { Offer, Store } from '../../../shared/types.js';

export function saveOffers(offers: Offer[]): void {
  for (const offer of offers) {
    const sql = `
      INSERT OR REPLACE INTO offers (
        id, store, product_name, original_price, offer_price,
        discount_percentage, category, unit, valid_from, valid_until,
        image_url, description, updated_at
      ) VALUES (
        '${offer.id}',
        '${offer.store}',
        '${offer.productName.replace(/'/g, "''")}',
        ${offer.originalPrice},
        ${offer.offerPrice},
        ${offer.discountPercentage},
        '${offer.category}',
        '${offer.unit.replace(/'/g, "''")}',
        '${offer.validFrom}',
        '${offer.validUntil}',
        ${offer.imageUrl ? `'${offer.imageUrl}'` : 'NULL'},
        ${offer.description ? `'${offer.description.replace(/'/g, "''")}'` : 'NULL'},
        CURRENT_TIMESTAMP
      )
    `;
    try {
      db.exec(sql);
    } catch (e: any) {
      console.error('Error saving offer:', offer.id, e?.message);
    }
  }
}

export function getActiveOffers(store?: Store): Offer[] {
  const today = new Date().toISOString().split('T')[0];

  let query = `
    SELECT * FROM offers
    WHERE valid_from <= ? AND valid_until >= ?
  `;
  const params: string[] = [today, today];

  if (store) {
    query += ' AND store = ?';
    params.push(store);
  }

  query += ' ORDER BY discount_percentage DESC';

  const rows = db.prepare(query).all(...params) as any[];

  return rows.map(row => ({
    id: row.id,
    store: row.store as Store,
    productName: row.product_name,
    originalPrice: row.original_price,
    offerPrice: row.offer_price,
    discountPercentage: row.discount_percentage,
    category: row.category,
    unit: row.unit,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    imageUrl: row.image_url,
    description: row.description,
  }));
}

export function getOffersByCategory(category: string): Offer[] {
  const today = new Date().toISOString().split('T')[0];

  const rows = db.prepare(`
    SELECT * FROM offers
    WHERE category = ? AND valid_from <= ? AND valid_until >= ?
    ORDER BY discount_percentage DESC
  `).all(category, today, today) as any[];

  return rows.map(row => ({
    id: row.id,
    store: row.store as Store,
    productName: row.product_name,
    originalPrice: row.original_price,
    offerPrice: row.offer_price,
    discountPercentage: row.discount_percentage,
    category: row.category,
    unit: row.unit,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    imageUrl: row.image_url,
    description: row.description,
  }));
}

export function searchOffers(query: string): Offer[] {
  const today = new Date().toISOString().split('T')[0];
  const searchTerm = `%${query.toLowerCase()}%`;

  const rows = db.prepare(`
    SELECT * FROM offers
    WHERE LOWER(product_name) LIKE ?
    AND valid_from <= ? AND valid_until >= ?
    ORDER BY discount_percentage DESC
  `).all(searchTerm, today, today) as any[];

  return rows.map(row => ({
    id: row.id,
    store: row.store as Store,
    productName: row.product_name,
    originalPrice: row.original_price,
    offerPrice: row.offer_price,
    discountPercentage: row.discount_percentage,
    category: row.category,
    unit: row.unit,
    validFrom: row.valid_from,
    validUntil: row.valid_until,
    imageUrl: row.image_url,
    description: row.description,
  }));
}

export function clearOldOffers(): number {
  const today = new Date().toISOString().split('T')[0];

  const result = db.prepare(`
    DELETE FROM offers WHERE valid_until < ?
  `).run(today);

  return result.changes;
}

export function getOfferStats(): { totalOffers: number; byStore: Record<string, number>; byCategory: Record<string, number> } {
  const today = new Date().toISOString().split('T')[0];

  const total = db.prepare(`
    SELECT COUNT(*) as count FROM offers
    WHERE valid_from <= ? AND valid_until >= ?
  `).get(today, today) as { count: number };

  const byStoreRows = db.prepare(`
    SELECT store, COUNT(*) as count FROM offers
    WHERE valid_from <= ? AND valid_until >= ?
    GROUP BY store
  `).all(today, today) as { store: string; count: number }[];

  const byCategoryRows = db.prepare(`
    SELECT category, COUNT(*) as count FROM offers
    WHERE valid_from <= ? AND valid_until >= ?
    GROUP BY category
  `).all(today, today) as { category: string; count: number }[];

  const byStore: Record<string, number> = {};
  byStoreRows.forEach(row => {
    byStore[row.store] = row.count;
  });

  const byCategory: Record<string, number> = {};
  byCategoryRows.forEach(row => {
    byCategory[row.category] = row.count;
  });

  return {
    totalOffers: total.count,
    byStore,
    byCategory,
  };
}
