import { chromium } from 'playwright';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// All Dutch supermarkets that Lijssie tracks
const ALL_STORES = [
  'Albert Heijn', 'Jumbo', 'Lidl', 'Aldi', 'Plus', 'Dirk',
  'Coop', 'DekaMarkt', 'Vomar', 'Hoogvliet', 'Spar', 'Poiesz'
];

// Ingredients mapped to Lijssie blog URLs
// These are common ingredients used in recipes
const INGREDIENTS_TO_SCRAPE = [
  // Vlees
  { name: 'gehakt', url: 'gehakt-500g', unit: '500g', category: 'vlees' },
  { name: 'kipfilet', url: 'kipfilet-300-gram', unit: '300g', category: 'vlees' },
  { name: 'kippenpoot', url: 'kippenpoot-500g', unit: '500g', category: 'vlees' },
  { name: 'zalm', url: 'zalm-filet', unit: 'stuk', category: 'vlees' },
  { name: 'spekblokjes', url: 'spekblokjes', unit: '150g', category: 'vlees' },
  { name: 'ham', url: 'ham-gesneden', unit: '100g', category: 'vlees' },
  { name: 'salami', url: 'salami', unit: '80g', category: 'vlees' },

  // Groenten
  { name: 'paprika', url: 'puntpaprika', unit: 'stuk', category: 'groenten' },
  { name: 'tomaten', url: 'tomaten', unit: '500g', category: 'groenten' },
  { name: 'komkommer', url: 'komkommer', unit: 'stuk', category: 'groenten' },
  { name: 'sla', url: 'ijsbergsla', unit: 'krop', category: 'groenten' },
  { name: 'champignons', url: 'champignons', unit: '250g', category: 'groenten' },
  { name: 'uien', url: 'uien', unit: 'kg', category: 'groenten' },
  { name: 'aardappelen', url: 'aardappelen', unit: 'kg', category: 'groenten' },
  { name: 'wortelen', url: 'wortelen', unit: 'kg', category: 'groenten' },
  { name: 'broccoli', url: 'broccoli', unit: 'stuk', category: 'groenten' },
  { name: 'spinazie', url: 'spinazie', unit: '300g', category: 'groenten' },
  { name: 'avocado', url: 'avocado-eetrijp', unit: 'stuk', category: 'groenten' },

  // Zuivel
  { name: 'melk', url: 'halfvolle-melk', unit: 'liter', category: 'zuivel' },
  { name: 'karnemelk', url: 'karnemelk', unit: 'liter', category: 'zuivel' },
  { name: 'yoghurt', url: 'griekse-yoghurt-1l', unit: 'liter', category: 'zuivel' },
  { name: 'kwark', url: 'magere-kwark', unit: '500g', category: 'zuivel' },
  { name: 'boter', url: 'roomboter', unit: '250g', category: 'zuivel' },
  { name: 'kaas', url: 'kaas', unit: '500g', category: 'zuivel' },
  { name: 'parmezaan', url: 'parmezaanse-kaas', unit: '80g', category: 'zuivel' },
  { name: 'eieren', url: 'eieren-10-stuks', unit: '10 stuks', category: 'zuivel' },
  { name: 'slagroom', url: 'slagroom', unit: '250ml', category: 'zuivel' },

  // Brood
  { name: 'wit brood', url: 'wit-brood', unit: 'heel', category: 'brood' },
  { name: 'volkoren brood', url: 'volkoren-brood', unit: 'heel', category: 'brood' },
  { name: 'croissants', url: 'croissants', unit: '4 stuks', category: 'brood' },

  // Pasta, rijst, conserven
  { name: 'pasta', url: 'pasta-500g', unit: '500g', category: 'pasta-rijst' },
  { name: 'rijst', url: 'rijst', unit: 'kg', category: 'pasta-rijst' },
  { name: 'tomatenblokjes', url: 'tomatenblokjes', unit: '400g', category: 'conserven' },
  { name: 'olijfolie', url: 'olijfolie-500ml', unit: '500ml', category: 'conserven' },

  // Dranken
  { name: 'koffie', url: 'koffie', unit: '500g', category: 'dranken' },
  { name: 'thee', url: 'thee', unit: '20 zakjes', category: 'dranken' },
  { name: 'sinaasappelsap', url: 'sinaasappelsap', unit: 'liter', category: 'dranken' },

  // Overig
  { name: 'pindakaas', url: 'pindakaas', unit: '350g', category: 'overig' },
  { name: 'hagelslag', url: 'hagelslag', unit: '400g', category: 'overig' },
  { name: 'jam', url: 'jam', unit: '450g', category: 'overig' },
];

async function scrapeLijssiePrices(page, ingredient) {
  const url = `https://www.lijssie.nl/blog/${ingredient.url}`;

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Extract prices per store from the page
    const priceData = await page.evaluate((storeNames) => {
      const results = {};
      const bodyText = document.body.innerText;

      // Parse the comparison table
      // Format: "StoreName ... €X,XX ... €Y,YY" (average price, lowest price)
      for (const store of storeNames) {
        // Match: StoreName followed by prices
        // We want both the average/regular price AND the lowest/offer price
        const storeRegex = new RegExp(
          store + '(?:\\s*Goedkoopst)?\\s*€\\s*(\\d+)[,\\.](\\d{2})\\s*€\\s*(\\d+)[,\\.](\\d{2})',
          'i'
        );
        const match = bodyText.match(storeRegex);

        if (match) {
          const regularPrice = parseFloat(`${match[1]}.${match[2]}`);
          const lowestPrice = parseFloat(`${match[3]}.${match[4]}`);

          // Filter out unrealistic prices
          if (regularPrice > 0 && regularPrice < 50 && lowestPrice > 0 && lowestPrice < 50) {
            const storeKey = store.toLowerCase().replace(/\s+/g, '-');
            results[storeKey] = {
              regular: regularPrice,
              lowest: lowestPrice,
              hasOffer: lowestPrice < regularPrice * 0.95, // Consider it an offer if >5% cheaper
            };
          }
        } else {
          // Fallback: try to find just one price
          const singlePriceRegex = new RegExp(store + '[^€]*€\\s*(\\d+)[,\\.](\\d{2})', 'i');
          const singleMatch = bodyText.match(singlePriceRegex);

          if (singleMatch) {
            const price = parseFloat(`${singleMatch[1]}.${singleMatch[2]}`);
            if (price > 0 && price < 50) {
              const storeKey = store.toLowerCase().replace(/\s+/g, '-');
              results[storeKey] = {
                regular: price,
                lowest: price,
                hasOffer: false,
              };
            }
          }
        }
      }

      // Get meta info
      const metaDesc = document.querySelector('meta[name="description"]')?.content || '';
      const cheapestMatch = metaDesc.match(/Goedkoopst bij (\w+)[^€]*€([\d,\.]+)/i);

      return {
        prices: results,
        cheapestStore: cheapestMatch ? cheapestMatch[1].toLowerCase() : null,
        cheapestPrice: cheapestMatch ? parseFloat(cheapestMatch[2].replace(',', '.')) : null,
      };
    }, ALL_STORES);

    return priceData;
  } catch (error) {
    console.log(`  Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🛒 Starting Lijssie price scraper (regular + offer prices)...\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
    locale: 'nl-NL',
  });
  const page = await context.newPage();

  const results = [];
  let successCount = 0;
  let offerCount = 0;

  for (let i = 0; i < INGREDIENTS_TO_SCRAPE.length; i++) {
    const ingredient = INGREDIENTS_TO_SCRAPE[i];
    process.stdout.write(`[${i + 1}/${INGREDIENTS_TO_SCRAPE.length}] ${ingredient.name}... `);

    const data = await scrapeLijssiePrices(page, ingredient);

    if (data && Object.keys(data.prices).length > 0) {
      const storeCount = Object.keys(data.prices).length;
      const offers = Object.values(data.prices).filter(p => p.hasOffer).length;
      const minPrice = Math.min(...Object.values(data.prices).map(p => p.lowest));

      console.log(`${storeCount} winkels, ${offers} aanbiedingen, goedkoopst: €${minPrice.toFixed(2)}`);
      successCount++;
      offerCount += offers;

      results.push({
        ingredientName: ingredient.name,
        category: ingredient.category,
        unit: ingredient.unit,
        lijssieUrl: `https://www.lijssie.nl/blog/${ingredient.url}`,
        prices: data.prices,
        cheapestStore: data.cheapestStore,
        cheapestPrice: data.cheapestPrice,
      });
    } else {
      console.log('not found');
      results.push({
        ingredientName: ingredient.name,
        category: ingredient.category,
        unit: ingredient.unit,
        lijssieUrl: `https://www.lijssie.nl/blog/${ingredient.url}`,
        prices: {},
        cheapestStore: null,
        cheapestPrice: null,
      });
    }

    await page.waitForTimeout(800);
  }

  await browser.close();

  // Save results
  const outputPath = join(__dirname, '..', 'data', 'prices.json');

  let history = [];
  if (existsSync(outputPath)) {
    try {
      const existing = JSON.parse(readFileSync(outputPath, 'utf-8'));
      history = existing.history || [];
    } catch (e) {}
  }

  history.push({
    date: new Date().toISOString().split('T')[0],
    prices: results,
  });
  history = history.slice(-12); // Keep 12 weeks of history

  const data = {
    lastUpdated: new Date().toISOString(),
    source: 'lijssie.nl',
    description: 'Prijzen inclusief aanbiedingen van alle Nederlandse supermarkten',
    totalIngredients: results.length,
    successCount,
    totalOffers: offerCount,
    stores: ALL_STORES.map(s => s.toLowerCase().replace(/\s+/g, '-')),
    currentPrices: results,
    history,
  };

  writeFileSync(outputPath, JSON.stringify(data, null, 2));

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`✅ Scraped ${successCount}/${results.length} ingredients`);
  console.log(`🏷️  Found ${offerCount} active offers`);
  console.log(`📁 Saved to ${outputPath}`);
  console.log('='.repeat(50));

  // Show some examples with offers
  console.log('\n📦 Voorbeelden met aanbiedingen:');
  for (const item of results.filter(r => Object.values(r.prices).some(p => p.hasOffer)).slice(0, 5)) {
    console.log(`\n${item.ingredientName} (${item.unit}):`);
    const sorted = Object.entries(item.prices).sort((a, b) => a[1].lowest - b[1].lowest);
    for (const [store, priceInfo] of sorted.slice(0, 5)) {
      const offerTag = priceInfo.hasOffer ? ' 🏷️ AANBIEDING' : '';
      const priceStr = priceInfo.hasOffer
        ? `€${priceInfo.lowest.toFixed(2)} (was €${priceInfo.regular.toFixed(2)})`
        : `€${priceInfo.regular.toFixed(2)}`;
      console.log(`  ${store}: ${priceStr}${offerTag}`);
    }
  }
}

main().catch(console.error);
