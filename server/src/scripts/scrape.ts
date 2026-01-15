import { scrapeAllOffers } from '../scrapers/index.js';

async function main() {
  const useSampleData = process.argv.includes('--sample');

  console.log('Starting offer scraping...');
  console.log(useSampleData ? 'Using sample data mode' : 'Attempting to scrape live data');

  try {
    const result = await scrapeAllOffers(useSampleData);
    console.log('\nScraping complete!');
    console.log(`Albert Heijn: ${result.ah} offers`);
    console.log(`Jumbo: ${result.jumbo} offers`);
    console.log(`Total: ${result.total} offers`);
  } catch (error) {
    console.error('Scraping failed:', error);
    process.exit(1);
  }
}

main();
