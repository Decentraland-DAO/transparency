import { Network, NetworkName } from './entities/Networks'
import { TokenSymbols } from './entities/Tokens'
import { Wallet, Wallets } from './entities/Wallets'
import { Contract } from './interfaces/Balance'
import {
  baseCovalentUrl,
  COVALENT_API_KEY,
  fetchCovalentURL,
  flattenArray,
  getPreviousDate,
  getTokenPriceInfo,
  parseNumber,
  reportToRollbarAndThrow,
  saveToCSV,
  saveToJSON
} from './utils'
import { rollbar } from './rollbar'
import { TokenPriceAPIData } from './interfaces/Transactions/TokenPrices'

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
  decimals: number
}

type PricesMap = Record<string, number>

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

function getBalanceParsed(contract: Contract, walletName: string, walletAddress: string, network: Network, prices: PricesMap): BalanceParsed {
  const amount = parseNumber(Number(contract.balance), contract.contract_decimals)
  const rate = contract.quote_rate || prices[contract.contract_address.toLowerCase()] || 0
  return {
    timestamp: contract.last_transferred_at,
    name: walletName,
    amount,
    quote: amount * rate,
    rate,
    symbol: contract.contract_ticker_symbol,
    network: network.name,
    address: walletAddress,
    contractAddress: contract.contract_address,
    decimals: contract.contract_decimals
  }
}

async function getBalance(wallet: Wallet) {
  const { name, address, network } = wallet
  const unresolvedPrices: Promise<TokenPriceAPIData[]>[] = []
  const today = new Date()
  const aWeekAgo = getPreviousDate(today, 7)
  try {
    const contracts = await fetchCovalentURL<Contract>(`${baseCovalentUrl(network)}/address/${address}/balances_v2/?quote-currency=USD&format=JSON&nft=false&no-nft-fetch=true&key=${COVALENT_API_KEY}`, 0)
    const contractsFiltered = contracts.filter(contract => filterContractByToken(contract, wallet))

    for (const contract of contractsFiltered) {
      if(!contract.quote_rate || contract.quote_rate === 0) {
        unresolvedPrices.push(getTokenPriceInfo(contract.contract_address, network, aWeekAgo, today))
      }
    }

    const rawPrices = flattenArray(await Promise.all(unresolvedPrices))
    const prices = rawPrices.reduce((accumulator, priceData) => {
      accumulator[priceData.contract_address.toLowerCase()] = priceData.prices.length > 0 ? priceData.prices[0].price : 0
      return accumulator
    }, {} as PricesMap)

    return contractsFiltered.map<BalanceParsed>((contract) => getBalanceParsed(contract, name, address, network, prices))
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