export enum Network {
  ETHEREUM = 'Ethereum',
  POLYGON = 'Polygon',
}

export const NetworkID: Record<Network, number> = {
  [Network.ETHEREUM]: 1,
  [Network.POLYGON]: 137,
}

export enum Symbols {
  MANA = 'MANA',
  MATIC = 'MATIC',
  ETH = 'ETH',
  DAI = 'DAI',
  USDT = 'USDT',
  USDC = 'USDC',
  WETH = 'WETH',
}

export enum Decimals {
  MANA = 18,
  MATIC = 18,
  ETH = 18,
  DAI = 18,
  USDT = 6,
  USDC = 6,
  WETH = 18,
}

export type TokenProperties = {
  symbol: Symbols
  decimals: Decimals
}

export type Token = Record<string, TokenProperties>

export const TOKENS: Record<Network, Token> = {
  [Network.ETHEREUM]: {
    '0x0f5d2fb29fb7d3cfee444a200298f468908cc942': { symbol: Symbols.MANA, decimals: Decimals.MANA },
    '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': { symbol: Symbols.MATIC, decimals: Decimals.MATIC },
    '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: Symbols.DAI, decimals: Decimals.DAI },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: Symbols.USDT, decimals: Decimals.USDT },
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: Symbols.USDC, decimals: Decimals.USDC },
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: Symbols.WETH, decimals: Decimals.WETH },
  },
  [Network.POLYGON]: {
    '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4': { symbol: Symbols.MANA, decimals: Decimals.MANA },
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { symbol: Symbols.DAI, decimals: Decimals.DAI },
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: Symbols.USDT, decimals: Decimals.USDT },
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: Symbols.USDC, decimals: Decimals.USDC },
    '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': { symbol: Symbols.WETH, decimals: Decimals.WETH },
  },
}