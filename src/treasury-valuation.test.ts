import BigNumber from 'bignumber.js'
import { NetworkName } from './entities/Networks'
import {
  isNativeTokenErc20,
  toUnits,
  TokenHolding,
  ValuationContext,
  valueHolding,
} from './treasury-valuation'

const WALLET = '0xc3bfc8c27e69ade0b852de1524ae1e9d2019303c'
const MANA = '0x0f5d2fb29fb7d3cfee444a200298f468908cc942'
const USDC = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const STETH = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
const STEAK_USDC = '0xbeef088055857739c12cd3765f20b7679def0f51'
const SAFE = '0x5afe3855358e112b5647b952709e6165e1c1eeee'
const MALLY = '0xa3e7833775a9cc022db2c72eb900378f90ce89b4'
const FAKE_VAULT = '0x1111111111111111111111111111111111111111'
const WBTC_VAULT = '0x2222222222222222222222222222222222222222'
const WBTC = '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599'

function units(amount: string, decimals: number): string {
  return new BigNumber(amount).multipliedBy(new BigNumber(10).pow(decimals)).toFixed()
}

function holding(contractAddress: string, rawBalance: string, network = NetworkName.ETHEREUM): TokenHolding {
  return { network, walletAddress: WALLET, contractAddress, rawBalance }
}

function context(overrides: Partial<ValuationContext> = {}): ValuationContext {
  return {
    curatedTokens: {
      [NetworkName.ETHEREUM]: {
        [MANA]: { symbol: 'MANA', decimals: 18, coinGeckoId: 'decentraland' },
        [USDC]: { symbol: 'USDC', decimals: 6, coinGeckoId: 'usd-coin' },
        [STETH]: { symbol: 'stETH', decimals: 18, coinGeckoId: 'staked-ether', balancesOnly: true },
      },
      [NetworkName.POLYGON]: {},
    } as unknown as ValuationContext['curatedTokens'],
    curatedPricesBySymbol: { MANA: 0.088284, USDC: 1, STETH: 2500 },
    markets: {
      safe: { id: 'safe', symbol: 'safe', price: 0.108, marketCap: 500_000_000 },
      mally: { id: 'mally', symbol: 'mally', price: 3.9e-13, marketCap: null },
    },
    coinGeckoIdsByContract: {
      [NetworkName.ETHEREUM]: { [SAFE]: 'safe', [MALLY]: 'mally' },
      [NetworkName.POLYGON]: {},
    },
    defiLlamaCoins: {
      [`ethereum:${STEAK_USDC}`]: { symbol: 'steakUSDC', decimals: 18, price: 1.036, confidence: 0.99 },
      [`ethereum:${WBTC_VAULT}`]: { symbol: 'vWBTC', decimals: 8, price: 84000, confidence: 0.99 },
      [`ethereum:${SAFE}`]: { symbol: 'SAFE', decimals: 18, price: 0.108, confidence: 0.99 },
    },
    tokenMetadata: {},
    vaultPositions: {
      [`Ethereum:${WALLET}:${STEAK_USDC}`]: { underlying: USDC, rawAssets: units('221801.60', 6) },
      [`Ethereum:${WALLET}:${FAKE_VAULT}`]: { underlying: USDC, rawAssets: units('5000000', 6) },
      [`Ethereum:${WALLET}:${WBTC_VAULT}`]: { underlying: WBTC, rawAssets: units('1', 8) },
    },
    ...overrides,
  }
}

describe('valueHolding', () => {
  describe('for a curated token', () => {
    it('values it with the curated price, at full precision', () => {
      const result = valueHolding(holding(MANA, units('1000', 18)), context())
      expect(result).toEqual({
        valued: expect.objectContaining({ amount: 1000, rate: 0.088284, symbol: 'MANA', source: 'curated' }),
      })
      expect('valued' in result && result.valued.quote).toBeCloseTo(88.284, 6)
    })

    it('values balances-only curated tokens too', () => {
      const result = valueHolding(holding(STETH, units('339.993', 18)), context())
      expect('valued' in result && result.valued.quote).toBeCloseTo(849982.5, 1)
    })
  })

  describe('for an ERC4626 vault recognized by DefiLlama with a curated underlying', () => {
    it('values the shares through the underlying assets', () => {
      const result = valueHolding(holding(STEAK_USDC, units('214006.1273', 18)), context())
      if (!('valued' in result)) throw new Error(`expected a valuation, got: ${result.skipped}`)
      expect(result.valued).toEqual(
        expect.objectContaining({
          amount: 214006.1273,
          quote: 221801.6,
          symbol: 'steakUSDC',
          source: 'vault',
          underlying: { symbol: 'USDC', contractAddress: USDC, amount: 221801.6 },
        })
      )
      expect(result.valued.rate).toBeCloseTo(1.0364, 4)
    })
  })

  describe('for a vault DefiLlama does not recognize', () => {
    it('skips it, so a spam token posing as a vault cannot inflate the treasury', () => {
      expect(valueHolding(holding(FAKE_VAULT, units('1', 18)), context())).toEqual({
        skipped: 'ERC4626 vault not recognized by DefiLlama',
      })
    })
  })

  describe('for a vault whose underlying is not curated', () => {
    it('skips it', () => {
      expect(valueHolding(holding(WBTC_VAULT, units('1', 8)), context())).toEqual({
        skipped: `ERC4626 vault whose underlying ${WBTC} is not a curated token`,
      })
    })
  })

  describe('for a discovered token listed on CoinGecko with a meaningful market cap', () => {
    it('values it with the CoinGecko price', () => {
      const result = valueHolding(holding(SAFE, units('3748.0051', 18)), context())
      if (!('valued' in result)) throw new Error(`expected a valuation, got: ${result.skipped}`)
      expect(result.valued).toEqual(expect.objectContaining({ amount: 3748.0051, rate: 0.108, symbol: 'SAFE', source: 'discovered' }))
    })

    it('uses the fallback metadata when DefiLlama does not describe the token', () => {
      const result = valueHolding(
        holding(SAFE, units('10', 18)),
        context({ defiLlamaCoins: {}, tokenMetadata: { [`ethereum:${SAFE}`]: { symbol: 'SAFE', decimals: 18 } } })
      )
      expect('valued' in result && result.valued.amount).toBe(10)
    })

    it('skips it when its decimals are unknown', () => {
      expect(valueHolding(holding(SAFE, units('10', 18)), context({ defiLlamaCoins: {} }))).toEqual({
        skipped: 'listed on CoinGecko (safe) but its decimals are unknown',
      })
    })
  })

  describe('for a token without a meaningful market cap', () => {
    it('skips it as likely spam', () => {
      expect(valueHolding(holding(MALLY, units('2095076', 18)), context())).toEqual({
        skipped: 'no price with a meaningful market cap (likely spam)',
      })
    })
  })

  describe('for a token nobody knows', () => {
    it('skips it as likely spam', () => {
      expect(valueHolding(holding('0x3333333333333333333333333333333333333333', units('50002960', 18)), context())).toEqual({
        skipped: 'no price with a meaningful market cap (likely spam)',
      })
    })
  })
})

describe('isNativeTokenErc20', () => {
  it("flags Polygon's native token ERC20 address", () => {
    expect(isNativeTokenErc20(NetworkName.POLYGON, '0x0000000000000000000000000000000000001010')).toBe(true)
  })

  it('does not flag other tokens', () => {
    expect(isNativeTokenErc20(NetworkName.ETHEREUM, '0x0000000000000000000000000000000000001010')).toBe(false)
    expect(isNativeTokenErc20(NetworkName.POLYGON, MANA)).toBe(false)
  })
})

describe('toUnits', () => {
  it('converts raw balances without losing precision', () => {
    expect(toUnits('45541160190000000000000000', 18)).toBe(45541160.19)
    expect(toUnits('0x0de0b6b3a7640000', 18)).toBe(1)
  })
})
