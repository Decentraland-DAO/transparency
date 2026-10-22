// Builds the treasury balances (balances.json): every token held by the DAO wallets, valued as described in
// treasury-valuation.ts. Network sources are injected, so the pipeline can run against any RPC.
import BigNumber from 'bignumber.js'
import { NetworkName } from './entities/Networks'
import { TOKENS, TokenSymbols } from './entities/Tokens'
import { Wallet } from './entities/Wallets'
import {
  fetchCoinGeckoIdsByContract,
  fetchCoinGeckoMarkets,
  getCuratedCoinGeckoIds,
  getCuratedPricesBySymbol,
} from './fetchCoingeckoPrices'
import {
  DefiLlamaCoin,
  hasMeaningfulMarketCap,
  holdingKey,
  isCurated,
  isNativeTokenErc20,
  isRecognizedByDefiLlama,
  SkipCode,
  TokenHolding,
  TokenMetadata,
  tokenKey,
  toUnits,
  ValuationContext,
  ValuationSource,
  valueHolding,
  VaultPosition,
} from './treasury-valuation'

export type RpcUrls = Record<NetworkName, string>
export type DiscoverErc20 = (network: NetworkName, walletAddress: string) => Promise<TokenHolding[]>

export type TreasuryBalanceRow = {
  timestamp: string
  name: string
  amount: number
  quote: number
  rate: number
  symbol: string
  network: NetworkName
  address: string
  status: string
  contractAddress: string
  decimals: number
  source: ValuationSource
  underlying?: { symbol: string; contractAddress: string; amount: number }
}

export type SkippedHolding = TokenHolding & { walletName: string; reason: string; code: SkipCode }

const SCANNED_NETWORKS = [NetworkName.ETHEREUM, NetworkName.POLYGON]
const NATIVE_TOKENS: Record<NetworkName, TokenSymbols> = {
  [NetworkName.ETHEREUM]: TokenSymbols.ETH,
  [NetworkName.POLYGON]: TokenSymbols.MATIC,
}
const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'
const NATIVE_TOKEN_DECIMALS = 18

const DEFILLAMA_PRICES_API = 'https://coins.llama.fi/prices/current'
const DEFILLAMA_BATCH_SIZE = 50

// function selectors
const ASSET_SELECTOR = '0x38d52e0f' // ERC4626 asset()
const CONVERT_TO_ASSETS_SELECTOR = '0x07a2d13a' // ERC4626 convertToAssets(uint256)
const SYMBOL_SELECTOR = '0x95d89b41' // ERC20 symbol()
const DECIMALS_SELECTOR = '0x313ce567' // ERC20 decimals()

// Alchemy enforces a compute-units-per-second (CUPS) throughput cap that is independent of the monthly quota,
// so bursts of requests get HTTP 429s even on pay-as-you-go plans. We pace the calls with a small delay and
// retry with exponential backoff when a request fails (e.g. a 429).
const RATE_LIMIT_DELAY = 500

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function withRetry<T>(fn: () => Promise<T>, retries = 5, backoff = 1000): Promise<T> {
  let lastErr: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt < retries) {
        const wait = backoff * 2 ** attempt
        console.log(`Request failed (attempt ${attempt + 1}/${retries + 1}), retrying in ${wait}ms...`)
        await sleep(wait)
      }
    }
  }
  throw lastErr
}

type JsonRpcResponse<T> = { result?: T; error?: { code: number; message: string } }

// Throws on transport errors (retryable). JSON-RPC errors, like a reverted eth_call, come back in `error`.
async function jsonRpc<T>(url: string, method: string, params: unknown[]): Promise<JsonRpcResponse<T>> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  if (!response.ok) {
    throw new Error(`${method} failed: HTTP ${response.status}`)
  }
  return (await response.json()) as JsonRpcResponse<T>
}

async function rpcResult<T>(url: string, method: string, params: unknown[]): Promise<T> {
  const { result, error } = await withRetry(() => jsonRpc<T>(url, method, params))
  if (error) {
    throw new Error(`${method} failed: ${error.message}`)
  }
  return result as T
}

async function ethCall(url: string, to: string, data: string): Promise<string | null> {
  const { result, error } = await withRetry(() => jsonRpc<string>(url, 'eth_call', [{ to, data }, 'latest']))
  return error || !result || result === '0x' ? null : result
}

function toUint256(raw: string): string {
  return new BigNumber(raw).integerValue().toString(16).padStart(64, '0')
}

function isAbiEncodedAddress(result: string | null): result is string {
  return !!result && /^0x0{24}[0-9a-f]{40}$/i.test(result)
}

function decodeAbiString(result: string): string {
  const hex = result.slice(2)
  if (hex.length === 64) {
    // bytes32 symbols (old tokens)
    return Buffer.from(hex, 'hex').toString('utf8').replace(/\0+$/, '')
  }
  const length = parseInt(hex.slice(64, 128), 16)
  return Buffer.from(hex.slice(128, 128 + length * 2), 'hex').toString('utf8')
}

type AlchemyTokenBalances = {
  tokenBalances: { contractAddress: string; tokenBalance: string | null }[]
  pageKey?: string
}

// Every ERC20 the wallet holds (not only the curated list), from Alchemy's token API
export function alchemyErc20Discovery(rpcUrls: RpcUrls): DiscoverErc20 {
  return async (network, walletAddress) => {
    const holdings: TokenHolding[] = []
    let pageKey: string | undefined
    do {
      const params: unknown[] = pageKey ? [walletAddress, 'erc20', { pageKey }] : [walletAddress, 'erc20']
      const result = await rpcResult<AlchemyTokenBalances>(rpcUrls[network], 'alchemy_getTokenBalances', params)
      for (const { contractAddress, tokenBalance } of result.tokenBalances) {
        if (!tokenBalance || tokenBalance === '0x') continue
        if (new BigNumber(tokenBalance).isGreaterThan(0)) {
          holdings.push({ network, walletAddress, contractAddress: contractAddress.toLowerCase(), rawBalance: tokenBalance })
        }
      }
      pageKey = result.pageKey
      if (pageKey) await sleep(RATE_LIMIT_DELAY)
    } while (pageKey)

    return holdings
  }
}

async function getNativeBalance(rpcUrl: string, walletAddress: string): Promise<string> {
  return await rpcResult<string>(rpcUrl, 'eth_getBalance', [walletAddress, 'latest'])
}

// asset() + convertToAssets(shares). null when the token is not an ERC4626 vault.
async function probeErc4626(rpcUrl: string, token: string, rawShares: string): Promise<VaultPosition | null> {
  const asset = await ethCall(rpcUrl, token, ASSET_SELECTOR)
  if (!isAbiEncodedAddress(asset)) return null
  const assets = await ethCall(rpcUrl, token, CONVERT_TO_ASSETS_SELECTOR + toUint256(rawShares))
  if (!assets) return null

  return { underlying: `0x${asset.slice(-40)}`.toLowerCase(), rawAssets: assets }
}

async function fetchTokenMetadata(rpcUrl: string, token: string): Promise<TokenMetadata | null> {
  const [symbol, decimals] = await Promise.all([ethCall(rpcUrl, token, SYMBOL_SELECTOR), ethCall(rpcUrl, token, DECIMALS_SELECTOR)])
  if (!symbol || !decimals) return null
  return { symbol: decodeAbiString(symbol), decimals: parseInt(decimals, 16) }
}

// Price, symbol, decimals and confidence for DefiLlama-known tokens (spam tokens are not returned)
async function fetchDefiLlamaCoins(tokenKeys: string[]): Promise<Record<string, DefiLlamaCoin>> {
  const coins: Record<string, DefiLlamaCoin> = {}
  for (let i = 0; i < tokenKeys.length; i += DEFILLAMA_BATCH_SIZE) {
    const batch = tokenKeys.slice(i, i + DEFILLAMA_BATCH_SIZE)
    const response = await withRetry(() => fetch(`${DEFILLAMA_PRICES_API}/${batch.join(',')}`))
    if (!response.ok) {
      throw new Error(`DefiLlama prices failed: HTTP ${response.status}`)
    }
    const { coins: batchCoins } = (await response.json()) as { coins: Record<string, DefiLlamaCoin> }
    Object.entries(batchCoins || {}).forEach(([key, coin]) => {
      coins[key.toLowerCase()] = coin
    })
  }
  return coins
}

async function bestEffort<T>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    console.error(`[balances] ${label} failed, continuing without it:`, error)
    return fallback
  }
}

export async function buildTreasuryBalances({
  wallets,
  rpcUrls,
  discoverErc20,
}: {
  wallets: Wallet[]
  rpcUrls: RpcUrls
  discoverErc20: DiscoverErc20
}): Promise<{ rows: TreasuryBalanceRow[]; skipped: SkippedHolding[] }> {
  // 1. what every wallet holds
  const scans: { wallet: Wallet; network: NetworkName; erc20: TokenHolding[]; nativeRaw: string }[] = []
  for (const wallet of wallets) {
    for (const network of SCANNED_NETWORKS) {
      const erc20 = (await discoverErc20(network, wallet.address)).filter(
        holding => !isNativeTokenErc20(network, holding.contractAddress)
      )
      await sleep(RATE_LIMIT_DELAY)
      const nativeRaw = await getNativeBalance(rpcUrls[network], wallet.address)
      await sleep(RATE_LIMIT_DELAY)
      scans.push({ wallet, network, erc20, nativeRaw })
    }
  }

  // 2. what is known about the tokens outside the curated list (one request each, whatever the token count)
  const curatedTokens = TOKENS as ValuationContext['curatedTokens']
  const unknownHoldings = scans
    .flatMap(scan => scan.erc20)
    .filter(holding => !isCurated({ curatedTokens }, holding.network, holding.contractAddress))
  const unknownTokenKeys = [...new Set(unknownHoldings.map(holding => tokenKey(holding.network, holding.contractAddress)))]

  const defiLlamaCoins = unknownTokenKeys.length
    ? await bestEffort('DefiLlama prices', () => fetchDefiLlamaCoins(unknownTokenKeys), {} as Record<string, DefiLlamaCoin>)
    : {}
  const coinGeckoIdsByContract = unknownTokenKeys.length
    ? await bestEffort('CoinGecko coins list', fetchCoinGeckoIdsByContract, {
        [NetworkName.ETHEREUM]: {},
        [NetworkName.POLYGON]: {},
      })
    : { [NetworkName.ETHEREUM]: {}, [NetworkName.POLYGON]: {} }

  // 3. vault probes, only for tokens DefiLlama recognizes, so spam costs no extra RPC calls
  const vaultPositions: Record<string, VaultPosition | null> = {}
  for (const holding of unknownHoldings) {
    if (!isRecognizedByDefiLlama(defiLlamaCoins[tokenKey(holding.network, holding.contractAddress)])) continue
    vaultPositions[holdingKey(holding)] = await probeErc4626(rpcUrls[holding.network], holding.contractAddress, holding.rawBalance)
    await sleep(RATE_LIMIT_DELAY)
  }

  // 4. prices: curated and discovered tokens in a single CoinGecko request
  const discoveredIds = unknownHoldings
    .map(holding => coinGeckoIdsByContract[holding.network][holding.contractAddress])
    .filter((id): id is string => !!id)
  const markets = await fetchCoinGeckoMarkets([...getCuratedCoinGeckoIds(), ...discoveredIds])
  const curatedPricesBySymbol = getCuratedPricesBySymbol(markets)

  // 5. symbol and decimals for countable discovered tokens that DefiLlama doesn't describe
  const tokenMetadata: Record<string, TokenMetadata> = {}
  for (const holding of unknownHoldings) {
    const key = tokenKey(holding.network, holding.contractAddress)
    const coinGeckoId = coinGeckoIdsByContract[holding.network][holding.contractAddress]
    if (tokenMetadata[key] || defiLlamaCoins[key]?.decimals !== undefined) continue
    if (!hasMeaningfulMarketCap(coinGeckoId ? markets[coinGeckoId] : undefined)) continue
    const metadata = await fetchTokenMetadata(rpcUrls[holding.network], holding.contractAddress)
    if (metadata) tokenMetadata[key] = metadata
  }

  // 6. rows, in the same order as before: per wallet, Ethereum tokens then Polygon tokens, native last
  const ctx: ValuationContext = {
    curatedTokens,
    curatedPricesBySymbol,
    markets,
    coinGeckoIdsByContract,
    defiLlamaCoins,
    tokenMetadata,
    vaultPositions,
  }
  const timestamp = new Date().toISOString()
  const rows: TreasuryBalanceRow[] = []
  const skipped: SkippedHolding[] = []

  for (const { wallet, network, erc20, nativeRaw } of scans) {
    const base = { timestamp, name: wallet.name, network, address: wallet.address, status: wallet.status }

    for (const holding of erc20) {
      const valuation = valueHolding(holding, ctx)
      if ('valued' in valuation) {
        if (valuation.valued.amount > 0) rows.push({ ...base, ...valuation.valued })
      } else {
        skipped.push({ ...holding, walletName: wallet.name, reason: valuation.skipped, code: valuation.code })
      }
    }

    const nativeAmount = toUnits(nativeRaw, NATIVE_TOKEN_DECIMALS)
    if (nativeAmount > 0) {
      const symbol = NATIVE_TOKENS[network]
      const rate = curatedPricesBySymbol[symbol] || 0
      rows.push({
        ...base,
        amount: nativeAmount,
        quote: nativeAmount * rate,
        rate,
        symbol,
        contractAddress: NATIVE_TOKEN_ADDRESS,
        decimals: NATIVE_TOKEN_DECIMALS,
        source: 'curated',
      })
    }
  }

  return { rows, skipped }
}
