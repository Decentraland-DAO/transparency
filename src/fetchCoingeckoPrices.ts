import fetch from 'isomorphic-fetch'
import { TOKENS } from './entities/Tokens'


const COIN_GECKO_API_KEY = process.env.COIN_GECKO_API_KEY


type CoinGeckoResponse = {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
};

function getAllCoinGeckoIds(): string[] {
  const coinGeckoIds: string[] = [];
  Object.values(TOKENS).forEach(networkTokens => {
    Object.values(networkTokens).forEach(token => {
      if (token.coinGeckoId) {
        coinGeckoIds.push(token.coinGeckoId);
      }
    });
  });

  coinGeckoIds.push('ethereum')

  return coinGeckoIds;
}

async function fetchCoinGeckoPrices(coinIds: string[]) {
  const ids = coinIds.join(',');
  const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${encodeURIComponent(ids)}&precision=2`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
        'x-cg-demo-api-key': COIN_GECKO_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching data from CoinGecko: ${response.statusText}`);
    }

    const data: CoinGeckoResponse[] = await response.json();

    const priceMap: Record<string, number> = {};
    data.forEach(token => {
      priceMap[token.symbol.toUpperCase()] = token.current_price;
    });

    return priceMap;
  } catch (error) {
    console.error('Error fetching CoinGecko prices:', error);
    throw error;
  }
}

// We are assuming prices are similar for the same token across different networks
export async function getAllTokenPrices(){
  return await fetchCoinGeckoPrices(getAllCoinGeckoIds())
}
