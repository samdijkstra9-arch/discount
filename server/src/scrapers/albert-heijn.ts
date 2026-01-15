import puppeteer from 'puppeteer';
import type { Offer } from '../../../shared/types.js';

const AH_BONUS_URL = 'https://www.ah.nl/bonus';

function generateOfferId(store: string, productName: string, validFrom: string): string {
  // Use full base64 encoding to avoid collisions
  const hash = Buffer.from(`${store}-${productName}-${validFrom}`).toString('base64').replace(/[/+=]/g, '');
  return `${store}-${hash}`;
}

function parsePrice(priceText: string): number {
  // Handle Dutch price format: "1,99" or "€1,99" or "1.99"
  const cleaned = priceText.replace(/[€\s]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
}

function categorizeProduct(productName: string): string {
  const name = productName.toLowerCase();

  // Vlees (meat)
  if (/kip|kipfilet|kipdrumstick|gehakt|rundergehakt|varken|spek|bacon|worst|hamburger|steak|biefstuk|kalkoen|eend|lam/.test(name)) {
    return 'vlees';
  }

  // Vis (fish)
  if (/vis|zalm|tonijn|kabeljauw|garnaal|mosselen|haring|makreel|tilapia|pangasius/.test(name)) {
    return 'vis';
  }

  // Zuivel (dairy)
  if (/melk|kaas|yoghurt|kwark|boter|room|ei|eieren|zuivel|margarine/.test(name)) {
    return 'zuivel';
  }

  // Groenten (vegetables)
  if (/tomaat|tomaten|sla|komkommer|paprika|wortel|ui|aardappel|broccoli|bloemkool|spinazie|champignon|courgette|aubergine|groente/.test(name)) {
    return 'groenten';
  }

  // Fruit
  if (/appel|banaan|sinaasappel|druif|aardbei|peer|mango|ananas|citroen|limoen|fruit|bes|kiwi/.test(name)) {
    return 'fruit';
  }

  // Brood (bread)
  if (/brood|stokbrood|croissant|pistolet|bolletje|beschuit|cracker/.test(name)) {
    return 'brood';
  }

  // Pasta & Rijst
  if (/pasta|spaghetti|penne|macaroni|rijst|noodle|couscous|bulgur|quinoa/.test(name)) {
    return 'pasta-rijst';
  }

  // Conserven
  if (/blik|gedroogd|gepeld|tomatenblokjes|passata|kikkererwt|bonen|linzen|mais/.test(name)) {
    return 'conserven';
  }

  // Diepvries (frozen)
  if (/diepvries|bevroren|ijs|pizza/.test(name)) {
    return 'diepvries';
  }

  // Sauzen (sauces)
  if (/saus|ketchup|mayonaise|mayo|mosterd|pesto|dressing/.test(name)) {
    return 'sauzen';
  }

  return 'overig';
}

function getValidDates(): { validFrom: string; validUntil: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // AH bonus weeks typically run Monday to Sunday
  const daysUntilMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const validFrom = new Date(now);
  validFrom.setDate(now.getDate() - daysSinceMonday);

  const validUntil = new Date(validFrom);
  validUntil.setDate(validFrom.getDate() + 6);

  return {
    validFrom: validFrom.toISOString().split('T')[0],
    validUntil: validUntil.toISOString().split('T')[0],
  };
}

export async function scrapeAlbertHeijn(): Promise<Offer[]> {
  console.log('Starting Albert Heijn scraper...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const offers: Offer[] = [];

  try {
    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`Navigating to ${AH_BONUS_URL}...`);
    await page.goto(AH_BONUS_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Helper for waiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Accept cookies if prompted
    try {
      const cookieButton = await page.$('button[id*="accept"], button:has-text("Accepteren")');
      if (cookieButton) {
        await cookieButton.click();
        await delay(1000);
      }
    } catch (e) {
      // Cookie dialog might not appear
    }

    // Wait for products to load
    await delay(3000);

    // Scroll to load more products
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, window.innerHeight));
      await delay(1000);
    }

    const { validFrom, validUntil } = getValidDates();

    // Extract product data
    const products = await page.evaluate(() => {
      const items: Array<{
        name: string;
        originalPrice: string;
        offerPrice: string;
        discount: string;
        unit: string;
        imageUrl: string;
      }> = [];

      // Try different selectors that AH might use
      const productCards = document.querySelectorAll('[data-testhook="product-card"], .product-card, [class*="ProductCard"], article[class*="product"]');

      productCards.forEach(card => {
        try {
          const nameEl = card.querySelector('[class*="title"], [class*="Title"], h2, h3, [data-testhook="product-title"]');
          const priceEl = card.querySelector('[class*="price"], [class*="Price"], [data-testhook="price"]');
          const oldPriceEl = card.querySelector('[class*="was"], [class*="old"], [class*="strike"], del, s');
          const discountEl = card.querySelector('[class*="discount"], [class*="bonus"], [class*="korting"]');
          const imageEl = card.querySelector('img');
          const unitEl = card.querySelector('[class*="unit"], [class*="size"]');

          if (nameEl && priceEl) {
            items.push({
              name: nameEl.textContent?.trim() || '',
              originalPrice: oldPriceEl?.textContent?.trim() || priceEl.textContent?.trim() || '',
              offerPrice: priceEl.textContent?.trim() || '',
              discount: discountEl?.textContent?.trim() || '',
              unit: unitEl?.textContent?.trim() || 'per stuk',
              imageUrl: imageEl?.src || '',
            });
          }
        } catch (e) {
          // Skip problematic cards
        }
      });

      return items;
    });

    console.log(`Found ${products.length} products from Albert Heijn`);

    for (const product of products) {
      if (!product.name) continue;

      const originalPrice = parsePrice(product.originalPrice);
      const offerPrice = parsePrice(product.offerPrice);

      // Skip if prices couldn't be parsed
      if (offerPrice === 0) continue;

      const discountPercentage = originalPrice > offerPrice
        ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
        : 0;

      offers.push({
        id: generateOfferId('albert-heijn', product.name, validFrom),
        store: 'albert-heijn',
        productName: product.name,
        originalPrice: originalPrice || offerPrice,
        offerPrice,
        discountPercentage,
        category: categorizeProduct(product.name),
        unit: product.unit || 'per stuk',
        validFrom,
        validUntil,
        imageUrl: product.imageUrl,
        description: product.discount,
      });
    }
  } catch (error) {
    console.error('Error scraping Albert Heijn:', error);
  } finally {
    await browser.close();
  }

  console.log(`Scraped ${offers.length} valid offers from Albert Heijn`);
  return offers;
}

// Fallback: Generate sample offers if scraping fails
export function generateSampleAHOffers(): Offer[] {
  const { validFrom, validUntil } = getValidDates();

  const sampleProducts = [
    { name: 'AH Kipfilet', originalPrice: 8.99, offerPrice: 5.99, unit: 'per 500g', category: 'vlees' },
    { name: 'AH Rundergehakt', originalPrice: 6.49, offerPrice: 4.49, unit: 'per 500g', category: 'vlees' },
    { name: 'AH Verse pasta', originalPrice: 2.99, offerPrice: 1.99, unit: 'per 400g', category: 'pasta-rijst' },
    { name: 'AH Tomatenblokjes', originalPrice: 1.29, offerPrice: 0.89, unit: 'per blik', category: 'conserven' },
    { name: 'AH Paprika mix', originalPrice: 2.49, offerPrice: 1.49, unit: 'per 3 stuks', category: 'groenten' },
    { name: 'AH Champignons', originalPrice: 1.99, offerPrice: 1.29, unit: 'per 250g', category: 'groenten' },
    { name: 'AH Rode ui', originalPrice: 1.49, offerPrice: 0.99, unit: 'per 500g', category: 'groenten' },
    { name: 'AH Witte rijst', originalPrice: 2.29, offerPrice: 1.49, unit: 'per kg', category: 'pasta-rijst' },
    { name: 'AH Spaghetti', originalPrice: 1.19, offerPrice: 0.79, unit: 'per 500g', category: 'pasta-rijst' },
    { name: 'AH Kokosmelk', originalPrice: 1.79, offerPrice: 1.19, unit: 'per blik', category: 'conserven' },
    { name: 'AH Kidneybonen', originalPrice: 1.09, offerPrice: 0.69, unit: 'per blik', category: 'conserven' },
    { name: 'AH Linzen', originalPrice: 1.39, offerPrice: 0.89, unit: 'per blik', category: 'conserven' },
    { name: 'AH Jonge kaas', originalPrice: 5.99, offerPrice: 3.99, unit: 'per 500g', category: 'zuivel' },
    { name: 'AH Verse spinazie', originalPrice: 1.99, offerPrice: 1.29, unit: 'per 200g', category: 'groenten' },
    { name: 'AH Knoflook', originalPrice: 0.99, offerPrice: 0.69, unit: 'per 3 stuks', category: 'groenten' },
    { name: 'AH Wortel', originalPrice: 1.29, offerPrice: 0.79, unit: 'per kg', category: 'groenten' },
    { name: 'AH Aardappelen kruimig', originalPrice: 2.99, offerPrice: 1.99, unit: 'per 2kg', category: 'groenten' },
    { name: 'AH Spekblokjes', originalPrice: 2.49, offerPrice: 1.69, unit: 'per 150g', category: 'vlees' },
    { name: 'AH Passata', originalPrice: 1.49, offerPrice: 0.99, unit: 'per 700ml', category: 'conserven' },
    { name: 'AH Zalmmoot', originalPrice: 5.99, offerPrice: 3.99, unit: 'per 200g', category: 'vis' },
  ];

  return sampleProducts.map(p => ({
    id: generateOfferId('albert-heijn', p.name, validFrom),
    store: 'albert-heijn' as const,
    productName: p.name,
    originalPrice: p.originalPrice,
    offerPrice: p.offerPrice,
    discountPercentage: Math.round(((p.originalPrice - p.offerPrice) / p.originalPrice) * 100),
    category: p.category,
    unit: p.unit,
    validFrom,
    validUntil,
  }));
}
