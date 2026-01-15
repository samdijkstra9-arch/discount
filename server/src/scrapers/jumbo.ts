import puppeteer from 'puppeteer';
import type { Offer } from '../../../shared/types.js';

const JUMBO_OFFERS_URL = 'https://www.jumbo.com/aanbiedingen';

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

  if (/kip|kipfilet|gehakt|varken|spek|bacon|worst|hamburger|steak|biefstuk|kalkoen/.test(name)) {
    return 'vlees';
  }
  if (/vis|zalm|tonijn|kabeljauw|garnaal|mosselen|haring|makreel/.test(name)) {
    return 'vis';
  }
  if (/melk|kaas|yoghurt|kwark|boter|room|ei|eieren|zuivel/.test(name)) {
    return 'zuivel';
  }
  if (/tomaat|sla|komkommer|paprika|wortel|ui|aardappel|broccoli|bloemkool|spinazie|champignon|groente/.test(name)) {
    return 'groenten';
  }
  if (/appel|banaan|sinaasappel|druif|aardbei|peer|mango|fruit/.test(name)) {
    return 'fruit';
  }
  if (/brood|stokbrood|croissant/.test(name)) {
    return 'brood';
  }
  if (/pasta|spaghetti|penne|macaroni|rijst|noodle|couscous/.test(name)) {
    return 'pasta-rijst';
  }
  if (/blik|tomatenblokjes|passata|bonen|linzen|mais/.test(name)) {
    return 'conserven';
  }
  if (/diepvries|bevroren|ijs/.test(name)) {
    return 'diepvries';
  }
  if (/saus|ketchup|mayonaise|mosterd/.test(name)) {
    return 'sauzen';
  }

  return 'overig';
}

function getValidDates(): { validFrom: string; validUntil: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Jumbo offers typically run Monday to Sunday
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

export async function scrapeJumbo(): Promise<Offer[]> {
  console.log('Starting Jumbo scraper...');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const offers: Offer[] = [];

  try {
    const page = await browser.newPage();

    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log(`Navigating to ${JUMBO_OFFERS_URL}...`);
    await page.goto(JUMBO_OFFERS_URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Helper for waiting
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // Accept cookies if prompted
    try {
      const cookieButton = await page.$('button[id*="accept"], button:has-text("Akkoord"), [data-testid="cookie-accept"]');
      if (cookieButton) {
        await cookieButton.click();
        await delay(1000);
      }
    } catch (e) {
      // Cookie dialog might not appear
    }

    // Wait for content and scroll to load more
    await delay(3000);
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

      // Try various selectors Jumbo might use
      const productCards = document.querySelectorAll('[data-testid="product-card"], .product-card, [class*="ProductCard"], [class*="promotion-card"]');

      productCards.forEach(card => {
        try {
          const nameEl = card.querySelector('[class*="title"], [class*="Title"], h2, h3, [data-testid="product-title"]');
          const priceEl = card.querySelector('[class*="price"], [class*="Price"], [data-testid="price-current"]');
          const oldPriceEl = card.querySelector('[class*="was"], [class*="old"], [class*="strike"], del, s, [data-testid="price-old"]');
          const discountEl = card.querySelector('[class*="discount"], [class*="label"], [class*="promotion"]');
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

    console.log(`Found ${products.length} products from Jumbo`);

    for (const product of products) {
      if (!product.name) continue;

      const originalPrice = parsePrice(product.originalPrice);
      const offerPrice = parsePrice(product.offerPrice);

      if (offerPrice === 0) continue;

      const discountPercentage = originalPrice > offerPrice
        ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
        : 0;

      offers.push({
        id: generateOfferId('jumbo', product.name, validFrom),
        store: 'jumbo',
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
    console.error('Error scraping Jumbo:', error);
  } finally {
    await browser.close();
  }

  console.log(`Scraped ${offers.length} valid offers from Jumbo`);
  return offers;
}

// Fallback: Generate sample offers if scraping fails
export function generateSampleJumboOffers(): Offer[] {
  const { validFrom, validUntil } = getValidDates();

  const sampleProducts = [
    { name: 'Jumbo Kipdrumsticks', originalPrice: 4.99, offerPrice: 2.99, unit: 'per 500g', category: 'vlees' },
    { name: 'Jumbo Varkensgehakt', originalPrice: 5.49, offerPrice: 3.49, unit: 'per 500g', category: 'vlees' },
    { name: 'Jumbo Rundergehakt', originalPrice: 6.99, offerPrice: 4.99, unit: 'per 500g', category: 'vlees' },
    { name: 'Jumbo Volkoren pasta', originalPrice: 1.79, offerPrice: 1.19, unit: 'per 500g', category: 'pasta-rijst' },
    { name: 'Jumbo Gepelde tomaten', originalPrice: 0.99, offerPrice: 0.69, unit: 'per blik', category: 'conserven' },
    { name: 'Jumbo Ui geel', originalPrice: 1.29, offerPrice: 0.79, unit: 'per kg', category: 'groenten' },
    { name: 'Jumbo Knoflook', originalPrice: 0.89, offerPrice: 0.59, unit: 'per 3 stuks', category: 'groenten' },
    { name: 'Jumbo Basmatirijst', originalPrice: 2.49, offerPrice: 1.79, unit: 'per kg', category: 'pasta-rijst' },
    { name: 'Jumbo Zilvervliesrijst', originalPrice: 2.29, offerPrice: 1.49, unit: 'per kg', category: 'pasta-rijst' },
    { name: 'Jumbo Kikkererwten', originalPrice: 1.19, offerPrice: 0.79, unit: 'per blik', category: 'conserven' },
    { name: 'Jumbo Bruine bonen', originalPrice: 1.09, offerPrice: 0.69, unit: 'per blik', category: 'conserven' },
    { name: 'Jumbo Witte bonen', originalPrice: 1.09, offerPrice: 0.69, unit: 'per blik', category: 'conserven' },
    { name: 'Jumbo Belegen kaas', originalPrice: 6.49, offerPrice: 4.49, unit: 'per 500g', category: 'zuivel' },
    { name: 'Jumbo Room', originalPrice: 1.99, offerPrice: 1.39, unit: 'per 200ml', category: 'zuivel' },
    { name: 'Jumbo Champignons gesneden', originalPrice: 1.79, offerPrice: 1.19, unit: 'per 250g', category: 'groenten' },
    { name: 'Jumbo Broccoli', originalPrice: 1.49, offerPrice: 0.99, unit: 'per stuk', category: 'groenten' },
    { name: 'Jumbo Courgette', originalPrice: 0.99, offerPrice: 0.69, unit: 'per stuk', category: 'groenten' },
    { name: 'Jumbo Aardappelpuree', originalPrice: 1.69, offerPrice: 1.09, unit: 'per pak', category: 'pasta-rijst' },
    { name: 'Jumbo Tonijn in water', originalPrice: 2.49, offerPrice: 1.69, unit: 'per blik', category: 'vis' },
    { name: 'Jumbo Gebakken uitjes', originalPrice: 1.99, offerPrice: 1.29, unit: 'per 100g', category: 'conserven' },
  ];

  return sampleProducts.map(p => ({
    id: generateOfferId('jumbo', p.name, validFrom),
    store: 'jumbo' as const,
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
