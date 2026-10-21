// Pure valuation of the tokens held by the DAO wallets (no network calls, so it can be unit tested).
//
// Every ERC20 a wallet holds is valued in this order:
// 1. curated: the tokens in entities/Tokens, priced by CoinGecko
// 2. vault: ERC4626 vault shares, valued through their underlying asset (convertToAssets). This keeps new
//    treasury positions (e.g. the Council moving to another vault) counted without code changes
// 3. discovered: any other token listed on CoinGecko with a meaningful market cap
// Anything else is skipped and reported (airdropped spam, unknown positions).
import BigNumber from 'bignumber.js'
import { NetworkName } from './entities/Networks'
import type { TokenData } from './entities/Tokens'
import type { CoinGeckoMarket } from './fetchCoingeckoPrices'

// Discovered tokens are only counted when CoinGecko reports at least this market cap: airdropped spam tokens
// have no price or no meaningful market cap
export const MIN_DISCOVERED_MARKET_CAP_USD = 10_000_000

// ERC4626 shares report their own value (convertToAssets), so a spam token could pose as a vault and inflate
// the treasury. Vaults are only valued when DefiLlama recognizes the share token with at least this confidence.
export const MIN_DEFILLAMA_CONFIDENCE = 0.9

// Polygon's native token also answers as an ERC20 at this address. Its balance is already counted as the
// native balance, so counting the ERC20 too would double it.
const NATIVE_TOKEN_ERC20_ADDRESSES: Record<NetworkName, string[]> = {
  [NetworkName.ETHEREUM]: [],
  [NetworkName.POLYGON]: ['0x0000000000000000000000000000000000001010'],
}

export const DEFILLAMA_CHAINS: Record<NetworkName, string> = {
  [NetworkName.ETHEREUM]: 'ethereum',
  [NetworkName.POLYGON]: 'polygon',
}

export type ValuationSource = 'curated' | 'vault' | 'discovered'

export type DefiLlamaCoin = {
  symbol: string
  decimals?: number
  price: number
  confidence?: number
}

export type TokenMetadata = {
  symbol: string
  decimals: number
}

export type VaultPosition = {
  underlying: string
  // raw integer amount (decimal or 0x-hex string)
  rawAssets: string
}

export type TokenHolding = {
  network: NetworkName
  walletAddress: string
  contractAddress: string
  // raw integer amount (decimal or 0x-hex string)
  rawBalance: string
}

export type ValuedHolding = {
  amount: number
  quote: number
  rate: number
  symbol: string
  contractAddress: string
  decimals: number
  source: ValuationSource
  underlying?: { symbol: string; contractAddress: string; amount: number }
}

export type Valuation = { valued: ValuedHolding } | { skipped: string }

export type ValuationContext = {
  curatedTokens: Record<NetworkName, Record<string, TokenData>>
  curatedPricesBySymbol: Record<string, number>
  markets: Record<string, CoinGeckoMarket>
  coinGeckoIdsByContract: Record<NetworkName, Record<string, string>>
  // keyed by tokenKey()
  defiLlamaCoins: Record<string, DefiLlamaCoin>
  // fallback symbol/decimals for discovered tokens DefiLlama doesn't know, keyed by tokenKey()
  tokenMetadata: Record<string, TokenMetadata>
  // ERC4626 positions (null when the token is not a vault), keyed by holdingKey()
  vaultPositions: Record<string, VaultPosition | null>
}

export function tokenKey(network: NetworkName, contractAddress: string): string {
  return `${DEFILLAMA_CHAINS[network]}:${contractAddress.toLowerCase()}`
}

export function holdingKey(holding: Pick<TokenHolding, 'network' | 'walletAddress' | 'contractAddress'>): string {
  return `${holding.network}:${holding.walletAddress.toLowerCase()}:${holding.contractAddress.toLowerCase()}`
}

export function toUnits(raw: string, decimals: number): number {
  return new BigNumber(raw).dividedBy(new BigNumber(10).pow(decimals)).toNumber()
}

export function isNativeTokenErc20(network: NetworkName, contractAddress: string): boolean {
  return NATIVE_TOKEN_ERC20_ADDRESSES[network].includes(contractAddress.toLowerCase())
}

export function isCurated(ctx: Pick<ValuationContext, 'curatedTokens'>, network: NetworkName, contractAddress: string): boolean {
  return !!ctx.curatedTokens[network][contractAddress.toLowerCase()]
}

export function isRecognizedByDefiLlama(coin?: DefiLlamaCoin): boolean {
  return !!coin && coin.price > 0 && (coin.confidence ?? 0) >= MIN_DEFILLAMA_CONFIDENCE
}

export function hasMeaningfulMarketCap(market?: CoinGeckoMarket): boolean {
  return !!market && market.price > 0 && (market.marketCap ?? 0) >= MIN_DISCOVERED_MARKET_CAP_USD
}

export function valueHolding(holding: TokenHolding, ctx: ValuationContext): Valuation {
  const contractAddress = holding.contractAddress.toLowerCase()
  const key = tokenKey(holding.network, contractAddress)

  // 1. curated
  const curated = ctx.curatedTokens[holding.network][contractAddress]
  if (curated) {
    const amount = toUnits(holding.rawBalance, curated.decimals)
    const rate = ctx.curatedPricesBySymbol[curated.symbol.toUpperCase()] || 0
    return {
      valued: { amount, quote: amount * rate, rate, symbol: curated.symbol, contractAddress, decimals: curated.decimals, source: 'curated' },
    }
  }

  const defiLlamaCoin = ctx.defiLlamaCoins[key]
  const metadata: TokenMetadata | undefined =
    defiLlamaCoin && defiLlamaCoin.decimals !== undefined
      ? { symbol: defiLlamaCoin.symbol, decimals: defiLlamaCoin.decimals }
      : ctx.tokenMetadata[key]

  // 2. ERC4626 vault recognized by DefiLlama, valued through its curated underlying asset
  const vault = ctx.vaultPositions[holdingKey(holding)]
  let vaultSkipReason: string | undefined
  if (vault) {
    const underlying = ctx.curatedTokens[holding.network][vault.underlying.toLowerCase()]
    const underlyingPrice = underlying ? ctx.curatedPricesBySymbol[underlying.symbol.toUpperCase()] : undefined
    if (!isRecognizedByDefiLlama(defiLlamaCoin)) {
      vaultSkipReason = 'ERC4626 vault not recognized by DefiLlama'
    } else if (!underlying || !underlyingPrice) {
      vaultSkipReason = `ERC4626 vault whose underlying ${vault.underlying} is not a curated token`
    } else if (!metadata) {
      vaultSkipReason = 'ERC4626 vault with unknown share decimals'
    } else {
      const amount = toUnits(holding.rawBalance, metadata.decimals)
      const underlyingAmount = toUnits(vault.rawAssets, underlying.decimals)
      const quote = underlyingAmount * underlyingPrice
      return {
        valued: {
          amount,
          quote,
          rate: amount > 0 ? quote / amount : 0,
          symbol: metadata.symbol,
          contractAddress,
          decimals: metadata.decimals,
          source: 'vault',
          underlying: { symbol: underlying.symbol, contractAddress: vault.underlying.toLowerCase(), amount: underlyingAmount },
        },
      }
    }
  }

  // 3. listed on CoinGecko with a meaningful market cap
  const coinGeckoId = ctx.coinGeckoIdsByContract[holding.network][contractAddress]
  const market = coinGeckoId ? ctx.markets[coinGeckoId] : undefined
  if (hasMeaningfulMarketCap(market)) {
    if (!metadata) {
      return { skipped: `listed on CoinGecko (${coinGeckoId}) but its decimals are unknown` }
    }
    const amount = toUnits(holding.rawBalance, metadata.decimals)
    return {
      valued: {
        amount,
        quote: amount * market!.price,
        rate: market!.price,
        symbol: metadata.symbol,
        contractAddress,
        decimals: metadata.decimals,
        source: 'discovered',
      },
    }
  }

  return { skipped: vaultSkipReason || 'no price with a meaningful market cap (likely spam)' }
}
