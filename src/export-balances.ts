import { NetworkName } from './entities/Networks'
import { TOKENS, TokenSymbols } from './entities/Tokens'
import { WALLETS } from './entities/Wallets'
import { parseNumber, reportToRollbarAndThrow, saveToCSV, saveToJSON } from './utils'
import { createAlchemyWeb3, TokenBalance } from '@alch/alchemy-web3'
import BigNumber from 'bignumber.js'
import { getAllTokenPrices } from './fetchCoingeckoPrices'

const apiKey = process.env.ALCHEMY_API_KEY

type TokenBalanceValue = {
  amount: number,
  quote: number,
  rate: number,
  symbol: TokenSymbols,
  contractAddress: string,
  decimals: number
}

function calculateErc20TokenBalanceValue(tokenBalance: TokenBalance, network: NetworkName, pricesPerToken: Record<string, number>) {
  const tokenInfo = TOKENS[network][tokenBalance.contractAddress.toLowerCase()]

  if (tokenInfo) {
    const amount = parseNumber(Number(tokenBalance.tokenBalance), tokenInfo.decimals)
    const rate = pricesPerToken[tokenInfo.symbol.toUpperCase()] || 0
    const quote = amount * rate

    return {
      amount,
      quote,
      rate,
      symbol: tokenInfo.symbol,
      contractAddress: tokenBalance.contractAddress,
      decimals: tokenInfo.decimals
    }
  } else throw new Error(`Unable to find token info for ${tokenBalance.contractAddress.toLowerCase()}`)
}

function parseNativeBalance(hexBalance: string): number {
  return new BigNumber(hexBalance).dividedBy(10 ** 18).toNumber()
}

function calculateNativeTokenBalanceValue(tokenAmount: string, tokenSymbol: TokenSymbols, tokenPrice: number) {
  const amount = parseNativeBalance(tokenAmount)
  const quote = amount * tokenPrice

  return {
    amount,
    quote,
    rate: tokenPrice,
    symbol: tokenSymbol,
    contractAddress: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
    decimals: 18
  }
}

async function main() {
  const alchemyEth = createAlchemyWeb3(`https://eth-mainnet.g.alchemy.com/v2/${apiKey}`)
  const alchemyPolygon = createAlchemyWeb3(`https://polygon-mainnet.g.alchemy.com/v2/${apiKey}`)

  const walletBalances: Record<string, {
    ethereumErc20Balances: TokenBalance[],
    polygonErc20Balances: TokenBalance[],
    ethBalance: string,
    maticBalance: string
  }> = {}
  for (const wallet of WALLETS) {
    const ethereumErc20Balances = await alchemyEth.alchemy.getTokenBalances(wallet.address, Object.keys(TOKENS[NetworkName.ETHEREUM]))
    const ethBalance = await alchemyEth.eth.getBalance(wallet.address)

    const polygonErc20Balances = await alchemyPolygon.alchemy.getTokenBalances(wallet.address, Object.keys(TOKENS[NetworkName.POLYGON]))
    const maticBalance = await alchemyPolygon.eth.getBalance(wallet.address)

    walletBalances[wallet.address] = {
      ethereumErc20Balances: ethereumErc20Balances.tokenBalances,
      polygonErc20Balances: polygonErc20Balances.tokenBalances,
      ethBalance,
      maticBalance
    }
  }

  const pricesPerToken = await getAllTokenPrices()
  const walletBalancesValue: Record<string, {
    ethTokenValues: TokenBalanceValue[],
    polygonTokenValues: TokenBalanceValue[]
  }> = {}
  for (const wallet of WALLETS) {
    const { ethereumErc20Balances, polygonErc20Balances, ethBalance, maticBalance } = walletBalances[wallet.address]

    const ethTokenValues = ethereumErc20Balances.map(tokenBalance => calculateErc20TokenBalanceValue(tokenBalance, NetworkName.ETHEREUM, pricesPerToken))
    ethTokenValues.push(calculateNativeTokenBalanceValue(ethBalance, TokenSymbols.ETH, pricesPerToken[TokenSymbols.ETH]))

    const polygonTokenValues = polygonErc20Balances.map(tokenBalance => calculateErc20TokenBalanceValue(tokenBalance, NetworkName.POLYGON, pricesPerToken))
    polygonTokenValues.push(calculateNativeTokenBalanceValue(maticBalance, TokenSymbols.MATIC, pricesPerToken[TokenSymbols.MATIC]))

    walletBalancesValue[wallet.address] = { ethTokenValues, polygonTokenValues }
  }

  const timestamp = new Date().toISOString()
  const balances = []
  for (const wallet of WALLETS) {
    const { ethTokenValues, polygonTokenValues } = walletBalancesValue[wallet.address]
    ethTokenValues.forEach(tokenValue => {
      if (tokenValue.amount > 0) {
        balances.push({
          timestamp,
          name: wallet.name,
          amount: tokenValue.amount,
          quote: tokenValue.quote,
          rate: tokenValue.rate,
          symbol: tokenValue.symbol,
          network: NetworkName.ETHEREUM,
          address: wallet.address,
          contractAddress: tokenValue.contractAddress,
          decimals: tokenValue.decimals
        })
      }
    })

    polygonTokenValues.forEach(tokenValue => {
      if (tokenValue.amount > 0) {
        balances.push({
          timestamp,
          name: wallet.name,
          amount: tokenValue.amount,
          quote: tokenValue.quote,
          rate: tokenValue.rate,
          symbol: tokenValue.symbol,
          network: NetworkName.POLYGON,
          address: wallet.address,
          contractAddress: tokenValue.contractAddress,
          decimals: tokenValue.decimals
        })
      }
    })
  }

  console.log(balances.length, 'balances found.')

  saveToJSON('balances.json', balances)
  await saveToCSV('balances.csv', balances, [
    { id: 'timestamp', title: 'Timestamp' },
    { id: 'name', title: 'Wallet' },
    { id: 'amount', title: 'Balance' },
    { id: 'symbol', title: 'Symbol' },
    { id: 'quote', title: 'USD Balance' },
    { id: 'rate', title: 'USD Rate' },
    { id: 'network', title: 'Network' },
    { id: 'address', title: 'Address' },
    { id: 'contractAddress', title: 'Token' }
  ])
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))
