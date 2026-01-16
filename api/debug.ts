import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = 'https://www.supermarktaanbiedingen.com/aanbiedingen/albert_heijn';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9,en;q=0.8',
      },
    });

    const status = response.status;
    const headers = Object.fromEntries(response.headers.entries());
    const text = await response.text();

    // Check if we got the actual page
    const hasProducts = text.includes('product-') && text.includes('card_title');
    const pageLength = text.length;

    // Get first 500 chars to see what we got
    const preview = text.substring(0, 1000);

    return res.status(200).json({
      success: true,
      fetchStatus: status,
      pageLength,
      hasProducts,
      responseHeaders: headers,
      preview,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: String(error),
    });
  }
}
