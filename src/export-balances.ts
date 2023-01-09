import { NetworkName } from './entities/Networks'
import { TokenSymbols } from "./entities/Tokens"
import { Wallet, Wallets } from "./entities/Wallets"
import { Contract } from "./interfaces/Balance"
import { baseCovalentUrl, COVALENT_API_KEY, fetchCovalentURL, flattenArray, parseNumber, saveToCSV, saveToJSON } from "./utils"

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
  const contracts = await fetchCovalentURL<Contract>(`${baseCovalentUrl(network)}/address/${address}/balances_v2/?quote-currency=USD&format=JSON&nft=false&no-nft-fetch=true&key=${COVALENT_API_KEY}`, 0)

  return contracts.map<BalanceParsed>(contract => ({
    timestamp: contract.last_transferred_at,
    name,
    amount: parseNumber(Number(contract.balance),  contract.contract_decimals),
    quote: contract.quote,
    rate: contract.quote_rate || 0,
    symbol: contract.contract_ticker_symbol,
    network: network.name,
    address,
    contractAddress: contract.contract_address
  }))
}

async function main() {
  const rawBalances: BalanceParsed[][] = []

  for (const wallet of Wallets.getAll()) {
    rawBalances.push(await getBalance(wallet))
  }

  const balances = flattenArray(rawBalances).filter(
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