import { AbiItem } from 'web3-utils'
import DAI_ABI from '../abi/Ethereum/dai.json'
import MANA_ABI from '../abi/Ethereum/mana.json'
import USDC_ABI from '../abi/Ethereum/usdc.json'
import USDT_ABI from '../abi/Ethereum/usdt.json'
import { DataByNetworks, NetworkName } from './Networks'

export enum TokenSymbols {
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


type TokenData = {
  symbol: TokenSymbols,
  decimals: number,
  abi?: AbiItem[],
  coinGeckoId: string
}

type Token = Record<string, TokenData>

export const TOKENS: DataByNetworks<Token> = {
  [NetworkName.ETHEREUM]: {
    '0x0f5d2fb29fb7d3cfee444a200298f468908cc942': { symbol: TokenSymbols.MANA, decimals: Decimals.MANA, abi: MANA_ABI as AbiItem[], coinGeckoId: "decentraland", },
    '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': { symbol: TokenSymbols.MATIC, decimals: Decimals.MATIC , coinGeckoId: "matic",},
    '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: TokenSymbols.DAI, decimals: Decimals.DAI, abi: DAI_ABI as AbiItem[], coinGeckoId: "dai", },
    '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: TokenSymbols.USDT, decimals: Decimals.USDT, abi: USDT_ABI as AbiItem[], coinGeckoId: "tether", },
    '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: TokenSymbols.USDC, decimals: Decimals.USDC, abi: USDC_ABI as AbiItem[], coinGeckoId: "usd-coin", },
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: TokenSymbols.WETH, decimals: Decimals.WETH , coinGeckoId: "weth",},
  },
  [NetworkName.POLYGON]: {
    '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4': { symbol: TokenSymbols.MANA, decimals: Decimals.MANA , coinGeckoId: "decentraland",},
    '0x0000000000000000000000000000000000001010': { symbol: TokenSymbols.MATIC, decimals: Decimals.MATIC , coinGeckoId: "matic-network",},
    '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { symbol: TokenSymbols.DAI, decimals: Decimals.DAI , coinGeckoId: "polygon-pos-bridged-dai-polygon-pos",},
    '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: TokenSymbols.USDT, decimals: Decimals.USDT , coinGeckoId:  "polygon-bridged-usdt-polygon",},
    '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: TokenSymbols.USDC, decimals: Decimals.USDC , coinGeckoId: "bridged-usdc-polygon-pos-bridge",},
    '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': { symbol: TokenSymbols.WETH, decimals: Decimals.WETH , coinGeckoId: "polygon-pos-bridged-weth-polygon-pos",},
  }
}

export class Tokens {
  public static get(network: NetworkName, address: string): TokenData {
    const token = TOKENS[network][address]
    if (!token) {
      throw new Error(`Token ${address} not found on network ${network}`)
    }
    return token
  }

  public static getEthereumToken(address: string): TokenData {
    return this.get(NetworkName.ETHEREUM, address)
  }

  public static getPolygonToken(address: string): TokenData {
    return this.get(NetworkName.POLYGON, address)
  }

  public static getAddresses(network: NetworkName | `${NetworkName}`): string[] {
    return Object.keys(TOKENS[network])
  }
}

