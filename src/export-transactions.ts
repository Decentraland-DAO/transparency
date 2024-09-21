import { NetworkName } from './entities/Networks'
import { Tokens, TokenSymbols } from './entities/Tokens'
import { Wallets } from './entities/Wallets'
import { TransferType } from './interfaces/Transactions/Transfers'
import {
  DECENTRALAND_DATA_URL,
  fetchURL,
  flattenArray,
  getLatestBlockByToken,
  LatestBlocks,
  printableLatestBlocks,
  reportToRollbarAndThrow,
} from './utils'
import { getTokenPrices, getTransactions, saveTransactions, tagging } from './utils/transactions'
import { TokenPriceData } from './interfaces/Transactions/TokenPrices'

export interface TransactionParsed {
  wallet: string
  hash: string
  date: string
  block: number
  network: `${NetworkName}`
  type: TransferType
  amount: number
  symbol: TokenSymbols
  contract: string
  quote: number
  sender: string
  from: string
  to: string
  interactedWith: string
  txFrom: string
  fee: number
  tag?: string
}

let priceData: TokenPriceData = {}

async function main() {
  let latestBlocks: LatestBlocks = {
    [NetworkName.ETHEREUM]: {},
    [NetworkName.POLYGON]: {},
  }
  let lastTransactions: TransactionParsed[] = []
  const unresolvedTransactions: Promise<TransactionParsed[]>[] = []

  const isFirstDayOfTheYear =
    new Date().getUTCMonth() === 0 && new Date().getUTCDate() === 1
  const fullFetch = process.argv.includes('--full') || isFirstDayOfTheYear

  if (!fullFetch) {
    const currentYear = new Date().getUTCFullYear()
    lastTransactions = await fetchURL(
      `${DECENTRALAND_DATA_URL}/transactions-${currentYear}.json`
    )
    latestBlocks = await getLatestBlockByToken(lastTransactions, currentYear)
    console.log('Latest Blocks:', printableLatestBlocks(latestBlocks))
  } else {
    console.log(
      '\n\n###################### WARNING: fetching all transactions ######################\n\n'
    )
    priceData = await getTokenPrices()
    console.log('Fetched price data...')
  }

  for (const wallet of Wallets.getAll()) {
    const { name, address, network } = wallet
    const tokenAddresses = Tokens.getAddresses(network.name)

    for (const tokenAddress of tokenAddresses) {
      unresolvedTransactions.push(
        getTransactions(
          name,
          tokenAddress,
          network,
          address,
          fullFetch,
          latestBlocks[network.name][tokenAddress]?.block,
          priceData
        )
      )
    }
  }

  console.log('Fetching transactions...')
  let transactions = flattenArray(await Promise.all(unresolvedTransactions))

  transactions = transactions.sort((a, b) =>
    a.date > b.date ? -1 : a.date === a.date ? 0 : 1
  )
  console.log(transactions.length, 'transactions found.')

  console.log('Tagging...')
  // hasta acá está ok.
  const taggedTxns = await tagging(transactions)

  console.log('tengo las taggedTxns, vamo para adelante')
  transactions = !fullFetch ? [...taggedTxns, ...lastTransactions] : taggedTxns

  console.log('Saving with tags...')
  await saveTransactions(transactions, true)
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))
