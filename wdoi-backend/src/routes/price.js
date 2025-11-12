const express = require('express');
const router = express.Router();

// Cache for price data (5 minutes)
let priceCache = null;
let lastPriceFetch = 0;
const PRICE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get DOI price from CoinPaprika API using the proper search logic
 */
async function fetchDOIPriceFromCoinPaprika() {
  try {
    console.log('Fetching DOI price from CoinPaprika API...');
    
    // Try known possible IDs for DOI
    const possibleIds = ['doi-doichain', 'doichain', 'doi'];
    let doiPriceData = null;
    
    for (const id of possibleIds) {
      try {
        console.log(`Trying CoinPaprika ID: ${id}`);
        const response = await fetch(`https://api.coinpaprika.com/v1/tickers/${id}`);
        
        if (response.ok) {
          doiPriceData = await response.json();
          console.log(`✅ Found DOI data with ID: ${id}`);
          break;
        }
      } catch (error) {
        console.log(`⚠️ ID ${id} not found, trying next...`);
      }
    }
    
    // If no direct ID worked, search for DOI-related coins
    if (!doiPriceData) {
      try {
        console.log('Searching for DOI-related coins...');
        const searchResponse = await fetch('https://api.coinpaprika.com/v1/coins');
        const allCoins = await searchResponse.json();
        
        const doiCoins = allCoins.filter(coin => 
          coin.name.toLowerCase().includes('doi') || 
          coin.symbol.toLowerCase().includes('doi') ||
          coin.id.includes('doi')
        );
        
        if (doiCoins.length > 0) {
          const firstMatch = doiCoins[0];
          console.log(`Trying first DOI match: ${firstMatch.id} (${firstMatch.name})`);
          
          const response = await fetch(`https://api.coinpaprika.com/v1/tickers/${firstMatch.id}`);
          if (response.ok) {
            doiPriceData = await response.json();
            console.log(`✅ Found DOI data with search: ${firstMatch.id}`);
          }
        }
      } catch (searchError) {
        console.warn('Search for DOI failed:', searchError.message);
      }
    }
    
    if (doiPriceData && doiPriceData.quotes && doiPriceData.quotes.USD) {
      const priceData = doiPriceData.quotes.USD;
      
      return {
        usd: priceData.price || 0,
        eur: (priceData.price || 0) * 0.92, // Approximate EUR conversion  
        btc: doiPriceData.quotes?.BTC?.price || 0,
        change24h: priceData.percent_change_24h || 0,
        volume24h: priceData.volume_24h || 0,
        marketCap: priceData.market_cap || 0,
        rank: doiPriceData.rank || 0,
        coinId: doiPriceData.id,
        name: doiPriceData.name,
        symbol: doiPriceData.symbol,
        lastUpdate: doiPriceData.last_updated || new Date().toISOString(),
        source: 'CoinPaprika'
      };
    }
    
    throw new Error('No valid DOI price data found on CoinPaprika');
    
  } catch (error) {
    console.warn('CoinPaprika API failed, using fallback price:', error.message);
    
    // Fallback to reasonable mock data if CoinPaprika fails
    return {
      usd: 0.85,
      eur: 0.78,
      btc: 0.000022,
      change24h: 2.5,
      volume24h: 125000,
      marketCap: 18500000,
      rank: 0,
      coinId: 'unknown',
      name: 'Doichain',
      symbol: 'DOI',
      lastUpdate: new Date().toISOString(),
      source: 'Fallback (CoinPaprika unavailable)'
    };
  }
}

/**
 * GET /price
 * Get current DOI price information from CoinPaprika
 */
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (priceCache && (now - lastPriceFetch) < PRICE_CACHE_TTL) {
      const cacheAge = Math.round((now - lastPriceFetch) / 1000);
      console.log(`Returning cached price data (${cacheAge}s old)`);
      return res.json(priceCache);
    }
    
    // Fetch fresh price data
    const doiPrice = await fetchDOIPriceFromCoinPaprika();
    
    const priceData = {
      doi: doiPrice,
      wdoi: {
        // wDOI should maintain parity with DOI
        usd: doiPrice.usd,
        eur: doiPrice.eur,
        btc: doiPrice.btc,
        change24h: doiPrice.change24h,
        peggingRatio: 1.0,
        lastUpdate: doiPrice.lastUpdate,
        source: doiPrice.source
      },
      exchanges: [
        {
          name: 'Uniswap V3',
          pair: 'wDOI/USDT',
          price: doiPrice.usd,
          volume24h: 45000, // Mock Uniswap volume
          fee: '0.3%'
        }
      ],
      source: doiPrice.source,
      timestamp: new Date().toISOString(),
      cached: false
    };
    
    // Update cache
    priceCache = { ...priceData, cached: true };
    lastPriceFetch = now;
    
    res.json(priceData);

  } catch (error) {
    console.error('Price API error:', error);
    res.status(500).json({
      error: 'Failed to get price data',
      message: error.message
    });
  }
});

module.exports = router;