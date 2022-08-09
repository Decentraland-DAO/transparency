import BigNumber from "bignumber.js"
import { NetworkName } from './entities/Networks'
import { TokenSymbols } from "./entities/Tokens"
import { Wallet, Wallets } from "./entities/Wallets"
import { Contract } from "./interfaces/Balance"
import { COVALENT_API_KEY, fetchCovalentURL, flattenArray, saveToCSV, saveToJSON } from "./utils"

const ALLOWED_SYMBOLS = new Set<string>(Object.values(TokenSymbols))

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
  const contracts = await fetchCovalentURL<Contract>(`https://api.covalenthq.com/v1/${network.id}/address/${address}/portfolio_v2/?key=${COVALENT_API_KEY}`, 0)


  return contracts.map<BalanceParsed>(t => ({
    timestamp: t.holdings[0].timestamp,
    name,
    amount: new BigNumber(t.holdings[0].close.balance).dividedBy(10 ** t.contract_decimals).toNumber(),
    quote: t.holdings[0].close.quote,
    rate: t.holdings[0].quote_rate,
    symbol: t.contract_ticker_symbol,
    network: network.name,
    address,
    contractAddress: t.contract_address
  }))
}

async function main() {
  const unresolvedBalances: Promise<BalanceParsed[]>[] = []

  for (const wallet of Wallets.get()) {
    unresolvedBalances.push(getBalance(wallet))
  }

  let balances = flattenArray(await Promise.all(unresolvedBalances))

  balances = balances.filter(b => ALLOWED_SYMBOLS.has(b.symbol) && b.amount > 0)
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