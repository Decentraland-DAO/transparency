import { AbiItem } from 'web3-utils'
import DAI_ABI from '../abi/Ethereum/dai.json'
import MANA_ABI from '../abi/Ethereum/mana.json'
import USDC_ABI from '../abi/Ethereum/usdc.json'
import USDT_ABI from '../abi/Ethereum/usdt.json'
import { Decimals, Network, TokenSymbols } from "../interfaces/Network"

type TokenData = {
  symbol: TokenSymbols,
  decimals: number,
  abi?: AbiItem[]
}

type Token = Record<string, TokenData>

export class Tokens {
  private static TOKENS: Record<Network, Token> = {
    [Network.ETHEREUM]: {
      '0x0f5d2fb29fb7d3cfee444a200298f468908cc942': { symbol: TokenSymbols.MANA, decimals: Decimals.MANA, abi: MANA_ABI as AbiItem[] },
      '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': { symbol: TokenSymbols.MATIC, decimals: Decimals.MATIC },
      '0x6b175474e89094c44da98b954eedeac495271d0f': { symbol: TokenSymbols.DAI, decimals: Decimals.DAI, abi: DAI_ABI as AbiItem[] },
      '0xdac17f958d2ee523a2206206994597c13d831ec7': { symbol: TokenSymbols.USDT, decimals: Decimals.USDT, abi: USDT_ABI as AbiItem[] },
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': { symbol: TokenSymbols.USDC, decimals: Decimals.USDC, abi: USDC_ABI as AbiItem[] },
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': { symbol: TokenSymbols.WETH, decimals: Decimals.WETH },
    },
    [Network.POLYGON]: {
      '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4': { symbol: TokenSymbols.MANA, decimals: Decimals.MANA },
      '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': { symbol: TokenSymbols.DAI, decimals: Decimals.DAI },
      '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': { symbol: TokenSymbols.USDT, decimals: Decimals.USDT },
      '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': { symbol: TokenSymbols.USDC, decimals: Decimals.USDC },
      '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': { symbol: TokenSymbols.WETH, decimals: Decimals.WETH },
    }
  }

  public static getToken(network: Network, address: string): TokenData {
    const token = this.TOKENS[network][address]
    if (!token) {
      throw new Error(`Token ${address} not found on network ${network}`)
    }
    return token
  }

  public static getEthereumToken(address: string): TokenData {
    return this.getToken(Network.ETHEREUM, address)
  }

  public static getPolygonToken(address: string): TokenData {
    return this.getToken(Network.POLYGON, address)
  }

  public static getTokenAddresses(network: Network): string[] {
    return Object.keys(this.TOKENS[network])
  }
}