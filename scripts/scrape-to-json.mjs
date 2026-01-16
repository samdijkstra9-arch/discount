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

// Food categories that we want to include
const FOOD_CATEGORIES = [
  'vlees', 'vis', 'zuivel', 'groenten', 'fruit', 'brood',
  'pasta-rijst', 'conserven', 'diepvries-eten', 'sauzen', 'kruiden'
];

// Non-food keywords to exclude
const NON_FOOD_KEYWORDS = [
  // Cleaning products
  'wasmiddel', 'afwasmiddel', 'schoonmaak', 'allesreiniger', 'bleek', 'ontstopper',
  'toiletblok', 'glansspoelmiddel', 'wasverzachter', 'vlekverwijderaar', 'glasreiniger',
  'vloeibaar wasmiddel', 'pods', 'capsules wassen', 'dreft', 'robijn', 'ariel', 'persil',
  'vanish', 'glorix', 'wc-eend', 'toiletpapier', 'keukenpapier', 'keukenrol',
  // Personal care
  'shampoo', 'conditioner', 'douchegel', 'zeep', 'deodorant', 'tandpasta', 'mondwater',
  'scheermesje', 'scheerschuim', 'bodylotion', 'handcreme', 'gezichtscreme', 'sunblock',
  'zonnebrand', 'lipbalm', 'mascara', 'foundation', 'make-up', 'nagellak', 'parfum',
  'haargel', 'haarspray', 'tampons', 'maandverband', 'luiers', 'billendoekjes',
  // Pet products
  'hondenvoer', 'kattenvoer', 'kattenbak', 'diervoeding', 'hondenbrokken', 'kattenbrokjes',
  // Household items
  'batterij', 'batterijen', 'lamp', 'gloeilamp', 'led', 'vuilniszak', 'pedaalemmerzak',
  'aluminiumfolie', 'bakpapier', 'vershoudfolie', 'ziplock',
  // Non-food pharmacy
  'paracetamol', 'ibuprofen', 'vitamine', 'supplement', 'pijnstiller'
];

function isNonFood(productName) {
  const name = productName.toLowerCase();
  return NON_FOOD_KEYWORDS.some(keyword => name.includes(keyword));
}

function categorizeProduct(productName) {
  const name = productName.toLowerCase();

  // Meat
  if (/kip|kipfilet|kipdrumstick|kippenbouten|kippendijtjes|gehakt|rundergehakt|varken|varkenshaas|spek|bacon|worst|rookworst|braadworst|hamburger|steak|biefstuk|kalkoen|eend|lam|schnitzel|slavink|frikandel|kroket|gyros|shoarma|ossenworst|lever|entrecote|rib-eye|spare|ribs|pulled|pork|beef/.test(name)) {
    return 'vlees';
  }
  // Fish
  if (/vis|zalm|tonijn|kabeljauw|garnaal|garnalen|mosselen|haring|makreel|tilapia|pangasius|kibbeling|lekkerbekje|krab|kreeft|scampi|forel|schol|tong|zeebaars|dorade|ansjovis|sardine|visfilet|visstick/.test(name)) {
    return 'vis';
  }
  // Dairy
  if (/melk|kaas|yoghurt|kwark|boter|room|slagroom|ei\b|eieren|zuivel|margarine|vla|pudding|toetje|cottage|ricotta|mozzarella|parmezan|goudse|edammer|brie|camembert|feta|creme fraiche|mascarpone|skyr/.test(name)) {
    return 'zuivel';
  }
  // Vegetables
  if (/tomaat|tomaten|sla|komkommer|paprika|wortel|wortelen|ui\b|uien|aardappel|aardappelen|broccoli|bloemkool|spinazie|champignon|champignons|courgette|aubergine|groente|groenten|prei|kool|boerenkool|andijvie|biet|bieten|radijs|sperzieboon|sperziebonen|snijboon|snijbonen|peultjes|erwten|doperwten|asperge|asperges|venkel|knolselderij|bleekselderij|pastinaak|knol|rapen|pompoen|butternut|zoete aardappel|witlof|rucola|veldsla|ijsbergsla|romeinse sla|spitskool|savooiekool|spruitjes|avocado/.test(name)) {
    return 'groenten';
  }
  // Fruit
  if (/appel|appels|banaan|bananen|sinaasappel|sinaasappels|druif|druiven|aardbei|aardbeien|peer|peren|mango|ananas|citroen|limoen|fruit|bes|bessen|kiwi|meloen|watermeloen|perzik|pruim|framboos|frambozen|bosbes|bosbessen|bramen|kersen|abrikoos|abrikozen|nectarine|granaatappel|passievrucht|lychee|papaya|kokos|grapefruit|mandarijn|clementine/.test(name)) {
    return 'fruit';
  }
  // Bread & bakery
  if (/brood|stokbrood|croissant|pistolet|bolletje|beschuit|cracker|toast|baguette|ciabatta|focaccia|pita|wrap|tortilla|naan|volkoren|meergranen|rogge|spelt|bagel/.test(name)) {
    return 'brood';
  }
  // Pasta, rice, grains
  if (/pasta|spaghetti|penne|macaroni|fusilli|tagliatelle|farfalle|rigatoni|rijst|basmati|jasmine|risotto|noodle|noodles|mie|bami|couscous|bulgur|quinoa|lasagne|ravioli|tortellini|gnocchi|polenta/.test(name)) {
    return 'pasta-rijst';
  }
  // Canned & dried goods
  if (/blik|gedroogd|gepeld|tomatenblokjes|passata|tomatenpuree|kikkererwt|kikkererwten|bonen|kidneybonen|witte bonen|bruine bonen|zwarte bonen|linzen|mais|ingelegd|augurk|kappertjes|olijven|zongedroogd|peulvrucht|chili con carne/.test(name)) {
    return 'conserven';
  }
  // Frozen food (only food items)
  if (/diepvries|bevroren|pizza|ijsje|ijs\b|magnum|cornetto|ben & jerry|diepvriespizza|diepvriesgroente|friet|patat|kroketten|bitterballen|loempia|spring roll|fish fingers|visstick/.test(name)) {
    return 'diepvries-eten';
  }
  // Sauces & condiments
  if (/saus|ketchup|mayonaise|mayo|mosterd|pesto|dressing|curry|currysaus|sambal|sojasaus|ketjap|hoisin|sriracha|tabasco|barbecuesaus|bbq|vinaigrette|hummus|tzatziki|guacamole/.test(name)) {
    return 'sauzen';
  }
  // Herbs & spices
  if (/kruiden|kruid|basilicum|oregano|tijm|rozemarijn|peterselie|bieslook|dille|munt|koriander|kerrie|paprikapoeder|komijn|kaneel|nootmuskaat|kurkuma|gember|knoflook|laurier|cayenne|chilipoeder|kruidenmix/.test(name)) {
    return 'kruiden';
  }
  // Oils & cooking fats
  if (/olie|olijfolie|zonnebloemolie|kokosolie|arachideolie|sesamolie|frituurvet|bak en braad/.test(name)) {
    return 'olie';
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
      'Cache-Control': 'no-cache',
    },
  });

  console.log(`Response status: ${response.status}`);
  console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`);
  }

  const text = await response.text();
  console.log(`Page length: ${text.length} characters`);
  console.log(`Contains product-: ${text.includes('product-')}`);
  console.log(`Contains card_title: ${text.includes('card_title')}`);
  console.log(`First 500 chars: ${text.substring(0, 500)}`);

  return text;
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

    // Filter out non-food items and 'overig' category
    const foodOffers = offers.filter(offer => {
      // Exclude non-food items by keywords
      if (isNonFood(offer.productName)) return false;
      // Exclude 'overig' category (uncategorized items are often non-food)
      if (offer.category === 'overig') return false;
      return true;
    });

    const seen = new Set();
    const uniqueOffers = foodOffers.filter(offer => {
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
