import * as cheerio from 'cheerio';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'https://www.supermarktaanbiedingen.com';

const STORE_MAP = {
  'albert_heijn': 'albert-heijn',
  'jumbo': 'jumbo',
};

function generateOfferId(store, productName, validFrom) {
  const hash = Buffer.from(`${store}-${productName}-${validFrom}`).toString('base64').replace(/[/+=]/g, '');
  return `${store}-${hash}`;
}

function categorizeProduct(productName) {
  const name = productName.toLowerCase();

  if (/kip|kipfilet|kipdrumstick|gehakt|rundergehakt|varken|spek|bacon|worst|hamburger|steak|biefstuk|kalkoen|eend|lam|schnitzel|slavink|frikandel|kroket/.test(name)) {
    return 'vlees';
  }
  if (/vis|zalm|tonijn|kabeljauw|garnaal|mosselen|haring|makreel|tilapia|pangasius|kibbeling|lekkerbekje/.test(name)) {
    return 'vis';
  }
  if (/melk|kaas|yoghurt|kwark|boter|room|ei|eieren|zuivel|margarine|vla|pudding|toetje/.test(name)) {
    return 'zuivel';
  }
  if (/tomaat|tomaten|sla|komkommer|paprika|wortel|ui|aardappel|broccoli|bloemkool|spinazie|champignon|courgette|aubergine|groente|prei|kool|biet|radijs|sperzieboon/.test(name)) {
    return 'groenten';
  }
  if (/appel|banaan|sinaasappel|druif|aardbei|peer|mango|ananas|citroen|limoen|fruit|bes|kiwi|meloen|perzik|pruim|framboos|bosbes/.test(name)) {
    return 'fruit';
  }
  if (/brood|stokbrood|croissant|pistolet|bolletje|beschuit|cracker|toast|baguette/.test(name)) {
    return 'brood';
  }
  if (/pasta|spaghetti|penne|macaroni|rijst|noodle|couscous|bulgur|quinoa|lasagne/.test(name)) {
    return 'pasta-rijst';
  }
  if (/blik|gedroogd|gepeld|tomatenblokjes|passata|kikkererwt|bonen|linzen|mais|ingelegd/.test(name)) {
    return 'conserven';
  }
  if (/diepvries|bevroren|ijs|pizza|ijsje/.test(name)) {
    return 'diepvries';
  }
  if (/cola|fanta|sprite|sinas|limonade|sap|water|bier|wijn|koffie|thee|energy|frisdrank|pils/.test(name)) {
    return 'dranken';
  }
  if (/saus|ketchup|mayonaise|mayo|mosterd|pesto|dressing|curry|sambal/.test(name)) {
    return 'sauzen';
  }
  if (/chips|nootjes|koek|chocola|snoep|drop|popcorn/.test(name)) {
    return 'snacks';
  }

  return 'overig';
}

function parsePrice(priceText) {
  if (!priceText) return 0;
  const cleaned = priceText.replace(/[€\s]/g, '').replace(',', '.');
  const match = cleaned.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 0;
}

function parseDiscount(discountText) {
  if (!discountText) return { percentage: 0, type: '' };

  const text = discountText.toLowerCase();

  if (/1\s*\+\s*1|1\s*\+\s*1\s*gratis/.test(text)) {
    return { percentage: 50, type: '1+1 GRATIS' };
  }
  if (/2\s*\+\s*1|2\s*\+\s*1\s*gratis/.test(text)) {
    return { percentage: 33, type: '2+1 GRATIS' };
  }
  if (/2e\s*(voor\s*)?halve\s*prijs|tweede\s*halve\s*prijs/.test(text)) {
    return { percentage: 25, type: '2e HALVE PRIJS' };
  }
  const percentMatch = text.match(/(\d+)\s*%/);
  if (percentMatch) {
    return { percentage: parseInt(percentMatch[1]), type: `${percentMatch[1]}% KORTING` };
  }

  return { percentage: 0, type: discountText };
}

function getValidDates() {
  const now = new Date();
  const dayOfWeek = now.getDay();
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

async function fetchPage(url) {
  console.log(`Fetching ${url}...`);
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

async function scrapeStore(storeName) {
  const storeKey = storeName.toLowerCase().replace('-', '_');
  const store = STORE_MAP[storeKey];

  if (!store) {
    console.error(`Unknown store: ${storeName}`);
    return [];
  }

  const url = `${BASE_URL}/aanbiedingen/${storeKey}`;

  try {
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    const offers = [];
    const { validFrom, validUntil } = getValidDates();

    $('li[id^="product-"]').each((_, element) => {
      try {
        const $li = $(element);
        const $card = $li.find('div.card');

        if (!$card.length) return;

        const productName = $card.find('h3.card_title').text().trim();
        if (!productName || productName.length < 3) return;

        const originalPriceText = $card.find('span.card_prijs-oud').text().trim();
        const offerPriceText = $card.find('span.card_prijs').text().trim();

        const originalPrice = parsePrice(originalPriceText);
        const offerPrice = parsePrice(offerPriceText);

        if (!offerPrice || offerPrice <= 0) return;

        const discountText = $card.find('p.card_text').text().trim();
        const { type } = parseDiscount(discountText);

        const discountPercentage = originalPrice > 0 && originalPrice > offerPrice
          ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100)
          : 0;

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

    const seen = new Set();
    const uniqueOffers = offers.filter(offer => {
      const key = offer.productName.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    console.log(`Found ${uniqueOffers.length} offers from ${storeName}`);
    return uniqueOffers;
  } catch (error) {
    console.error(`Error scraping ${storeName}:`, error.message);
    return [];
  }
}

async function main() {
  console.log('Starting scrape...');

  const [ahOffers, jumboOffers] = await Promise.all([
    scrapeStore('albert_heijn'),
    scrapeStore('jumbo'),
  ]);

  const allOffers = [...ahOffers, ...jumboOffers];

  console.log(`Total offers scraped: ${allOffers.length}`);

  const outputPath = join(__dirname, '..', 'data', 'offers.json');

  const data = {
    lastUpdated: new Date().toISOString(),
    totalOffers: allOffers.length,
    offers: allOffers,
  };

  writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`Saved ${allOffers.length} offers to ${outputPath}`);
}

main().catch(console.error);
