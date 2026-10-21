import fetch from 'isomorphic-fetch'
import { NetworkName } from './entities/Networks'
import { TOKENS } from './entities/Tokens'

const COIN_GECKO_API_KEY = process.env.COIN_GECKO_API_KEY
const COIN_GECKO_API = 'https://api.coingecko.com/api/v3'
const MARKETS_PAGE_SIZE = 250

// CoinGecko asset platform ids of the networks we scan
const COIN_GECKO_PLATFORMS: Record<NetworkName, string> = {
  [NetworkName.ETHEREUM]: 'ethereum',
  [NetworkName.POLYGON]: 'polygon-pos',
}

type CoinGeckoResponse = {
  id: string;
  symbol: string;
  name: string;
  current_price: number | null;
  market_cap: number | null;
};

export type CoinGeckoMarket = {
  id: string;
  symbol: string;
  price: number;
  marketCap: number | null;
};

async function coinGeckoGet<T>(path: string): Promise<T> {
  const headers: Record<string, string> = { 'accept': 'application/json' }
  // Sending the header without a key ("undefined") is rejected with a 401
  if (COIN_GECKO_API_KEY) {
    headers['x-cg-demo-api-key'] = COIN_GECKO_API_KEY
  }
  const response = await fetch(`${COIN_GECKO_API}${path}`, { method: 'GET', headers });

  if (!response.ok) {
    throw new Error(`Error fetching data from CoinGecko (${path.split('?')[0]}): ${response.status} ${response.statusText}`);
  }

  return await response.json() as T;
}

export function getCuratedCoinGeckoIds(): string[] {
  const coinGeckoIds: string[] = [];
  Object.values(TOKENS).forEach(networkTokens => {
    Object.values(networkTokens).forEach(token => {
      if (token.coinGeckoId) {
        coinGeckoIds.push(token.coinGeckoId);
      }
    });
  });

  return [...new Set([...coinGeckoIds, 'ethereum'])]
}

// Price and market cap by CoinGecko id, at full precision. One request per 250 ids.
export async function fetchCoinGeckoMarkets(coinIds: string[]): Promise<Record<string, CoinGeckoMarket>> {
  const ids = [...new Set(coinIds)]
  const markets: Record<string, CoinGeckoMarket> = {}

  for (let i = 0; i < ids.length; i += MARKETS_PAGE_SIZE) {
    const page = ids.slice(i, i + MARKETS_PAGE_SIZE)
    const data = await coinGeckoGet<CoinGeckoResponse[]>(
      `/coins/markets?vs_currency=usd&ids=${encodeURIComponent(page.join(','))}&per_page=${MARKETS_PAGE_SIZE}`
    )
    data.forEach(token => {
      if (typeof token.current_price === 'number') {
        markets[token.id] = { id: token.id, symbol: token.symbol, price: token.current_price, marketCap: token.market_cap }
      }
    })
  }

  return markets
}

// Price per curated token symbol. Only curated ids are used, so a discovered token that shares a symbol
// (e.g. another "USDC") can't override a curated price. We are assuming prices are similar for the same
// token across different networks.
export function getCuratedPricesBySymbol(markets: Record<string, CoinGeckoMarket>): Record<string, number> {
  const priceMap: Record<string, number> = {}
  getCuratedCoinGeckoIds().forEach(id => {
    const market = markets[id]
    if (market) {
      priceMap[market.symbol.toUpperCase()] = market.price
    }
  })

  return priceMap
}

// Contract address (lowercase) -> CoinGecko id, per network. A single request covers every listed token, so
// discovered tokens can be priced without one request per contract.
export async function fetchCoinGeckoIdsByContract(): Promise<Record<NetworkName, Record<string, string>>> {
  const coins = await coinGeckoGet<{ id: string; platforms?: Record<string, string | null> }[]>(
    '/coins/list?include_platform=true'
  )
  const idsByContract: Record<NetworkName, Record<string, string>> = {
    [NetworkName.ETHEREUM]: {},
    [NetworkName.POLYGON]: {},
  }

  for (const coin of coins) {
    for (const network of Object.values(NetworkName)) {
      const contract = coin.platforms?.[COIN_GECKO_PLATFORMS[network]]
      if (contract) {
        idsByContract[network][contract.toLowerCase()] = coin.id
      }
    }
  }

  return idsByContract
}
