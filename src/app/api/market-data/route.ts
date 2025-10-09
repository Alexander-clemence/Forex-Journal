import { NextResponse } from 'next/server';

export const runtime = 'nodejs'; // ensure Node.js runtime for setTimeout etc.

// Top global assets to track
const ASSETS = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'NASDAQ' },
  { symbol: 'DIA', name: 'Dow Jones' },
  { symbol: 'GLD', name: 'Gold' },
  { symbol: 'USO', name: 'Oil' },
  { symbol: 'BTC', name: 'Bitcoin' },
];

// --- 🧩 MOCK DATA GENERATOR ---
function generateMockData() {
  return ASSETS.map(asset => {
    const base = Math.random() * 1000 + 100; // random price range
    const change = (Math.random() - 0.5) * 5; // random +/- change
    return {
      symbol: asset.symbol,
      name: asset.name,
      price: parseFloat((base + change).toFixed(2)),
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(((change / base) * 100).toFixed(2)),
    };
  });
}

// --- 📡 MAIN HANDLER ---
export async function GET() {
  try {
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
    const isDev = process.env.NODE_ENV !== 'production';

    // ✅ Use mock data in dev mode or if no API key
    if (isDev || !API_KEY) {
      console.warn('⚠️ Using mock market data (dev mode or missing API key)');
      const mockData = generateMockData();
      return NextResponse.json({
        data: mockData,
        mock: true,
        timestamp: new Date().toISOString(),
      });
    }

    // --- Real API fetch ---
    const promises = ASSETS.map(async (asset, index) => {
      try {
        await new Promise(r => setTimeout(r, index * 6000)); // delay 6s between calls
        const response = await fetch(
          `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${asset.symbol}&apikey=${API_KEY}`,
          { next: { revalidate: 300 } }
        );

        if (!response.ok) {
          console.error(`API error for ${asset.symbol}: ${response.status}`);
          return null;
        }

        const data = await response.json();
        const quote = data['Global Quote'];
//@ts-ignore
        if (!quote || !quote['05. price']) return null;

        return {
          symbol: asset.symbol,
          name: asset.name,
          price: parseFloat(quote['05. price']),
          change: parseFloat(quote['09. change']),
          changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        };
      } catch (error) {
        console.error(`Error fetching ${asset.symbol}:`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const validData = results.filter(Boolean);

    // If API limit or all failed → fallback to mock
    if (validData.length === 0) {
      console.warn('⚠️ API failed or limit reached — using mock data fallback');
      return NextResponse.json({
        data: generateMockData(),
        mock: true,
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      data: validData,
      mock: false,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Market data fetch error:', error);
    // Always fallback to mock to prevent frontend break
    return NextResponse.json({
      data: generateMockData(),
      mock: true,
      timestamp: new Date().toISOString(),
    });
  }
}
