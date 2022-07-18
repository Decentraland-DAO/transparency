import { AbiItem } from 'web3-utils'
import DAI_ABI from '../abi/dai.json'
import MANA_ABI from '../abi/mana.json'
import USDC_ABI from '../abi/usdc.json'
import USDT_ABI from '../abi/usdt.json'

export enum Network {
  ETHEREUM = 'Ethereum',
  POLYGON = 'Polygon',
}

export const NetworkID = {
  [Network.ETHEREUM]: 1,
  [Network.POLYGON]: 137
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

type VestingToken = Token.DAI | Token.MANA | Token.USDC | Token.USDT
type TokenData = {
  symbol: Token,
  address: string,
  decimals: Decimals,
  abi: AbiItem[]
}

export const TOKENS: Record<VestingToken, TokenData> = {
  DAI: {
    symbol: Token.DAI,
    address: '0x6b175474e89094c44da98b954eedeac495271d0f',
    decimals: Decimals.DAI,
    abi: DAI_ABI as AbiItem[]
  },
  MANA: {
    symbol: Token.MANA,
    address: '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
    decimals: Decimals.MANA,
    abi: MANA_ABI as AbiItem[]
  },
  USDC: {
    symbol: Token.USDC,
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    decimals: Decimals.USDC,
    abi: USDC_ABI as AbiItem[]
  },
  USDT: {
    symbol: Token.USDT,
    address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    decimals: Decimals.USDT,
    abi: USDT_ABI as AbiItem[]
  }
}

export function getTokenByAddress(address: string): VestingToken {
  const token = (Object.keys(TOKENS) as Array<VestingToken>).find(key => !!address && TOKENS[key].address.toLowerCase() === address.toLowerCase())
  if (!token) throw new Error(`Vesting token not found for address ${address}`)
  return token
}