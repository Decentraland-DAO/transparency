import BigNumber from "bignumber.js"
import { NetworkName } from './entities/Networks'
import { TokenSymbols } from "./entities/Tokens"
import { Wallet, Wallets } from "./entities/Wallets"
import { Contract } from "./interfaces/Balance"
import { baseCovalentUrl, fetchURL, flattenArray, saveToCSV, saveToJSON } from "./utils"
require('dotenv').config()

const ALLOWED_SYMBOLS = new Set<string>(Object.values(TokenSymbols))

const API_KEY = process.env.COVALENTHQ_API_KEY

export type BalanceParsed = {
  timestamp: string
  name: string
  amount: number
  quote: number
  rate: number
  symbol: TokenSymbols
  network: `${NetworkName}`
  address: string
  contractAddress: string
}

async function getBalance(wallet: Wallet) {
  const { name, address, network } = wallet
  const url = `${baseCovalentUrl(network)}/address/${address}/portfolio_v2/?key=${API_KEY}`
  const json = await fetchURL(url)
  const contracts: Contract[] = json.data.items


  return contracts.map<BalanceParsed>(contract => ({
    timestamp: contract.holdings[0].timestamp,
    name,
    amount: new BigNumber(contract.holdings[0].close.balance).dividedBy(10 ** contract.contract_decimals).toNumber(),
    quote: contract.holdings[0].close.quote,
    rate: contract.holdings[0].quote_rate,
    symbol: contract.contract_ticker_symbol,
    network: network.name,
    address,
    contractAddress: contract.contract_address
  }))
}

async function main() {
  const unresolvedBalances: Promise<BalanceParsed[]>[] = []

  for (const wallet of Wallets.getAll()) {
    unresolvedBalances.push(getBalance(wallet))
  }

  const balances = flattenArray(await Promise.all(unresolvedBalances)).filter(
    (balance) => ALLOWED_SYMBOLS.has(balance.symbol) && balance.amount > 0
  )

  console.log(balances.length, 'balances found.')

  saveToJSON('balances.json', balances)
  saveToCSV('balances.csv', balances, [
    { id: 'timestamp', title: 'Timestamp' },
    { id: 'name', title: 'Wallet' },
    { id: 'amount', title: 'Balance' },
    { id: 'symbol', title: 'Symbol' },
    { id: 'quote', title: 'USD Balance' },
    { id: 'rate', title: 'USD Rate' },
    { id: 'network', title: 'Network' },
    { id: 'address', title: 'Address' },
    { id: 'contractAddress', title: 'Token' },
  ])
}

main()