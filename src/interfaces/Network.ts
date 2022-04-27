export enum Network {
  ETHEREUM = 'Ethereum',
  POLYGON = 'Polygon',
}

export const NetworkID = {
  [Network.ETHEREUM]: 1,
  [Network.POLYGON]: 137,
}

export enum Token {
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