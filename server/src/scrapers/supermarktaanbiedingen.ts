import * as cheerio from 'cheerio';
import type { Offer, Store } from '../../../shared/types.js';

const BASE_URL = 'https://www.supermarktaanbiedingen.com';

// Map supermarktaanbiedingen.com store names to our store types
const STORE_MAP: Record<string, Store> = {
  'albert_heijn': 'albert-heijn',
  'jumbo': 'jumbo',
};

function generateOfferId(store: string, productName: string, validFrom: string): string {
  const hash = Buffer.from(`${store}-${productName}-${validFrom}`).toString('base64').replace(/[/+=]/g, '');
  return `${store}-${hash}`;
}

function categorizeProduct(productName: string): string {
  const name = productName.toLowerCase();

  // Vlees (meat)
  if (/kip|kipfilet|kipdrumstick|gehakt|rundergehakt|varken|spek|bacon|worst|hamburger|steak|biefstuk|kalkoen|eend|lam|schnitzel|slavink|frikandel|kroket/.test(name)) {
    return 'vlees';
  }

  // Vis (fish)
  if (/vis|zalm|tonijn|kabeljauw|garnaal|mosselen|haring|makreel|tilapia|pangasius|kibbeling|lekkerbekje/.test(name)) {
    return 'vis';
  }

  // Zuivel (dairy)
  if (/melk|kaas|yoghurt|kwark|boter|room|ei|eieren|zuivel|margarine|vla|pudding|toetje/.test(name)) {
    return 'zuivel';
  }

  // Groenten (vegetables)
  if (/tomaat|tomaten|sla|komkommer|paprika|wortel|ui|aardappel|broccoli|bloemkool|spinazie|champignon|courgette|aubergine|groente|prei|kool|biet|radijs|sperzieboon/.test(name)) {
    return 'groenten';
  }

  // Fruit
  if (/appel|banaan|sinaasappel|druif|aardbei|peer|mango|ananas|citroen|limoen|fruit|bes|kiwi|meloen|perzik|pruim|framboos|bosbes/.test(name)) {
    return 'fruit';
  }

  // Brood (bread)
  if (/brood|stokbrood|croissant|pistolet|bolletje|beschuit|cracker|toast|baguette/.test(name)) {
    return 'brood';
  }

  // Pasta & Rijst
  if (/pasta|spaghetti|penne|macaroni|rijst|noodle|couscous|bulgur|quinoa|lasagne/.test(name)) {
    return 'pasta-rijst';
  }

  // Conserven
  if (/blik|gedroogd|gepeld|tomatenblokjes|passata|kikkererwt|bonen|linzen|mais|ingelegd/.test(name)) {
    return 'conserven';
  }

  // Diepvries (frozen)
  if (/diepvries|bevroren|ijs|pizza|ijsje/.test(name)) {
    return 'diepvries';
  }

  // Dranken (drinks)
  if (/cola|fanta|sprite|sinas|limonade|sap|water|bier|wijn|koffie|thee|energy|frisdrank|pils/.test(name)) {
    return 'dranken';
  }

  // Sauzen (sauces)
  if (/saus|ketchup|mayonaise|mayo|mosterd|pesto|dressing|curry|sambal/.test(name)) {
    return 'sauzen';
  }

  // Snacks
  if (/chips|nootjes|koek|chocola|snoep|drop|popcorn|cracker/.test(name)) {
    return 'snacks';
  }

  return 'overig';
}

function parsePrice(priceText: string): number {
  if (!priceText) return 0;
  // Handle various Dutch price formats: "€1,99", "1.99", "1,99", "€ 1,99"
  const cleaned = priceText.replace(/[€\s]/g, '').replace(',', '.');
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseDiscount(discountText: string): { percentage: number; type: string } {
  if (!discountText) return { percentage: 0, type: '' };

  const text = discountText.toLowerCase();

  // "1+1 gratis" = 50% off
  if (/1\s*\+\s*1|1\s*\+\s*1\s*gratis/.test(text)) {
    return { percentage: 50, type: '1+1 GRATIS' };
  }

  // "2+1 gratis" = 33% off
  if (/2\s*\+\s*1|2\s*\+\s*1\s*gratis/.test(text)) {
    return { percentage: 33, type: '2+1 GRATIS' };
  }

  // "2e halve prijs" = 25% off
  if (/2e\s*(voor\s*)?halve\s*prijs|tweede\s*halve\s*prijs/.test(text)) {
    return { percentage: 25, type: '2e HALVE PRIJS' };
  }

  // "25% korting" etc
  const percentMatch = text.match(/(\d+)\s*%/);
  if (percentMatch) {
    return { percentage: parseInt(percentMatch[1]), type: `${percentMatch[1]}% KORTING` };
  }

  return { percentage: 0, type: discountText };
}

function getValidDates(): { validFrom: string; validUntil: string } {
  const now = new Date();
  const dayOfWeek = now.getDay();

  // Offers typically run Monday to Sunday
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

async function fetchPage(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  return response.text();
}

export async function scrapeStore(storeName: string): Promise<Offer[]> {
  const storeKey = storeName.toLowerCase().replace('-', '_');
  const store = STORE_MAP[storeKey];

  if (!store) {
    console.error(`Unknown store: ${storeName}`);
    return [];
  }

  const url = `${BASE_URL}/aanbiedingen/${storeKey}`;
  console.log(`Scraping ${url}...`);

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const offers: Offer[] = [];
    const { validFrom, validUntil } = getValidDates();

    // Products are in <li> elements with class or within ul.products-posts
    // Each product has:
    // - div.card containing the product info
    // - h3.card_title for product name
    // - p.card_text for discount description
    // - span.card_prijs-oud for original price
    // - span.card_prijs for offer price
    // - img.card_productimage for image

    $('li[id^="product-"]').each((_, element) => {
      try {
        const $li = $(element);
        const $card = $li.find('div.card');

        if (!$card.length) return;

        // Get product name from card_title
        const productName = $card.find('h3.card_title').text().trim();
        if (!productName || productName.length < 3) return;

        // Get prices
        const originalPriceText = $card.find('span.card_prijs-oud').text().trim();
        const offerPriceText = $card.find('span.card_prijs').text().trim();

        const originalPrice = parsePrice(originalPriceText);
        const offerPrice = parsePrice(offerPriceText);

        // Skip if we don't have valid prices
        if (!offerPrice || offerPrice <= 0) return;

        // Get discount description from card_text (e.g., "VOOR 0.99", "1 + 1 GRATIS", "25% KORTING")
        const discountText = $card.find('p.card_text').text().trim();
        const { type } = parseDiscount(discountText);

        // Calculate discount percentage
        const discountPercentage = originalPrice > 0 && originalPrice > offerPrice
          ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
          : 0;

        // Get image URL
        const imageUrl = $card.find('img.card_productimage').attr('src') || undefined;

        offers.push({
          id: generateOfferId(store, productName, validFrom),
          store,
          productName,
          originalPrice: originalPrice > 0 ? Math.round(originalPrice * 100) / 100 : Math.round(offerPrice * 100) / 100,
          offerPrice: Math.round(offerPrice * 100) / 100,
          discountPercentage,
          category: categorizeProduct(productName),
          unit: 'per stuk',
          validFrom,
          validUntil,
          description: type || discountText || undefined,
          imageUrl,
        });
      } catch (e) {
        // Skip problematic elements
      }
    });

    // Deduplicate by product name (keep first occurrence)
    const seen = new Set<string>();
    const uniqueOffers = offers.filter(offer => {
      const key = offer.productName.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`Found ${uniqueOffers.length} offers from ${storeName}`);
    return uniqueOffers;
  } catch (error) {
    console.error(`Error scraping ${storeName}:`, error);
    return [];
  }
}

export async function scrapeAlbertHeijn(): Promise<Offer[]> {
  return scrapeStore('albert_heijn');
}

export async function scrapeJumbo(): Promise<Offer[]> {
  return scrapeStore('jumbo');
}

export async function scrapeAllStores(): Promise<{ ah: Offer[]; jumbo: Offer[] }> {
  console.log('Scraping supermarktaanbiedingen.com...');

  const [ah, jumbo] = await Promise.all([
    scrapeAlbertHeijn(),
    scrapeJumbo(),
  ]);

  return { ah, jumbo };
}
