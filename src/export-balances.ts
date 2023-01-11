import { Network, NetworkName } from './entities/Networks'
import { TokenSymbols } from './entities/Tokens'
import { Wallet, Wallets } from './entities/Wallets'
import { Contract } from './interfaces/Balance'
import {
  baseCovalentUrl,
  COVALENT_API_KEY,
  fetchCovalentURL,
  flattenArray,
  parseNumber,
  saveToCSV,
  saveToJSON
} from './utils'
import { rollbar } from './rollbar'

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

function filterContractByToken(contract: Contract, wallet: Wallet) {
  if (ALLOWED_SYMBOLS.has(contract.contract_ticker_symbol)) {
    if (contract.contract_decimals === null) {
      rollbar.log(`Contract decimals is null for ${contract.contract_ticker_symbol} on ${wallet.network.name} for ${wallet.name} ${wallet.address}`)
      return false
    } else {
      return true
    }
  }
  return false
}

async function getBalance(wallet: Wallet) {
  const { name, address, network } = wallet
  try {
    const contracts = await fetchCovalentURL<Contract>(`${baseCovalentUrl(network)}/address/${address}/balances_v2/?quote-currency=USD&format=JSON&nft=false&no-nft-fetch=true&key=${COVALENT_API_KEY}`, 0)

    return contracts.filter(contract => filterContractByToken(contract, wallet)).map<BalanceParsed>(contract => ({
      timestamp: contract.last_transferred_at,
      name,
      amount: parseNumber(Number(contract.balance), contract.contract_decimals),
      quote: contract.quote,
      rate: contract.quote_rate || 0,
      symbol: contract.contract_ticker_symbol,
      network: network.name,
      address,
      contractAddress: contract.contract_address
    }))
  } catch (e) {
    rollbar.log(`Unable to fetch balance for wallet ${address}`, e)
    return []
  }
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
    { id: 'contractAddress', title: 'Token' }
  ])
}

main()