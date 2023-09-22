import { TokenPriceAPIData, TokenPriceData } from './interfaces/Transactions/TokenPrices'
import RAW_GRANTS from '../public/grants.json'
import RAW_BALANCES from '../public/balances.json'
import { Network, NetworkName, Networks } from './entities/Networks'
import { Tags, TagType } from './entities/Tags'
import { Tokens, TokenSymbols } from './entities/Tokens'
import { Wallets } from './entities/Wallets'
import { Status } from './interfaces/GovernanceProposal'
import { GrantProposal } from './interfaces/Grant'
import { EventItem } from './interfaces/Transactions/Events'
import { TransactionItem } from './interfaces/Transactions/Transactions'
import { TransferItem, TransferType } from './interfaces/Transactions/Transfers'
import { BalanceParsed } from './export-balances'
import {
  baseCovalentUrl,
  COVALENT_API_KEY,
  DECENTRALAND_DATA_URL,
  fetchCovalentURL,
  fetchURL,
  flattenArray,
  getLatestBlockByToken,
  getPreviousDate,
  getTokenPriceInfo,
  LatestBlocks,
  parseNumber,
  printableLatestBlocks,
  reportToRollbarAndThrow,
  saveToCSV,
  saveToJSON,
  setTransactionTag,
  splitArray
} from './utils'

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

enum Topic {
  ETH_ORDER_TOPIC = '0x695ec315e8a642a74d450a4505eeea53df699b47a7378c7d752e97d5b16eb9bb',
  MATIC_ORDER_TOPIC = '0x77cc75f8061aa168906862622e88c5b05a026a9c06c02d91ec98543e01e7ad33',
}

let priceData: TokenPriceData = {}

const WALLET_ADDRESSES = new Set(Wallets.getAddresses())
const PAGE_SIZE = 1000

const GRANTS: GrantProposal[] = RAW_GRANTS
const GRANTS_VESTING_ADDRESSES = new Set(flattenArray(GRANTS.filter(g => g.status === Status.ENACTED && g.vesting_addresses.length > 0).map(g => g.vesting_addresses.map(address => address.toLowerCase()))))
const GRANTS_ENACTING_TXS = new Set(GRANTS.filter(g => g.status === Status.ENACTED && g.enacting_tx).map(g => g.enacting_tx.toLowerCase()))
const SAB_ADDRESS = '0x0e659a116e161d8e502f9036babda51334f2667e' // Sec Advisory Board
const FACILITATOR_ADDRESS = '0x76fb13f00cdbdd5eac8e2664cf14be791af87cb0'
const OPENSEA_ADDRESSES = new Set([
  '0x9b814233894cd227f561b78cc65891aa55c62ad2',
  '0x2da950f79d8bd7e7f815e1bbc43ecee2c7e7f5d3',
  '0x00000000006c3852cbef3e08e8df289169ede581',
  '0xf715beb51ec8f63317d66f491e37e7bb048fcc2d',
  '0x000000004b5ad44f70781462233d177d32d993f1',
  '0x13c10925bf130e4a9631900d89475d2155b5f9c0',
  '0x0000000000e9c0809c14f4dc1e48f97abd9317f6',
  '0x00000000000001ad428e4906ae43d8f9852d0dd6',
  '0x00000000000000adc04c56bf30ac9d3c0aaf14dc',
  '0xef0b56692f78a44cf4034b07f80204757c31bcc9'
])
const RENTAL_ADDRESSES = new Set([
  '0x3a1469499d0be105d4f77045ca403a5f6dc2f3f5',
  '0xe90636e24d8faf02aa0e01c26d72dab9629865cb'
])

const BALANCES = (RAW_BALANCES as BalanceParsed[]).reduce((accum, balance) => {
  accum[balance.contractAddress] = balance
  return accum
}, {} as { [address: string]: BalanceParsed })

async function getTopicTxs(network: Network, startblock: number, topic: Topic) {
  let block = startblock
  const MAX_BLOCK_RANGE = 1000000
  const response = await fetchCovalentURL<{ height: number }>(`${baseCovalentUrl(network)}/block_v2/latest/?key=${COVALENT_API_KEY}`, PAGE_SIZE)
  const latestBlock = response[0].height
  console.log(`Latest ${JSON.stringify(network)} - start block: ${block} - latest block: ${latestBlock}`)
  const unresolvedEvents: Promise<EventItem[]>[] = []
  
  while(block < latestBlock) {
    const endBlock = block + MAX_BLOCK_RANGE
    const url = `${baseCovalentUrl(network)}/events/topics/${topic}/?key=${COVALENT_API_KEY}&starting-block=${block}&ending-block=${endBlock > latestBlock ? 'latest' : endBlock}`
    console.log('fetch market orders', url)
    unresolvedEvents.push(fetchCovalentURL<EventItem>(url, PAGE_SIZE))
    block = endBlock + 1
  }

  const events = flattenArray(await Promise.all(unresolvedEvents))
  return events.map(e => e.tx_hash)
}

async function getTransactions(name: string, tokenAddress: string, network: Network, address: string, fullFetch: boolean, startBlock?: number) {
  const url = `${baseCovalentUrl(network)}/address/${address}/transfers_v2/?key=${COVALENT_API_KEY}&contract-address=${tokenAddress}${startBlock >= 0 ? `&starting-block=${startBlock + 1}` : ''}`
  const items = await fetchCovalentURL<TransferItem>(url, 100000) // page size has to be high enough to get all the transactions in a reasonable time

  const txs = items.filter(t => t.successful)

  const transactions: TransactionParsed[] = []

  for (const tx of txs) {
    const transfers = tx.transfers.map(txTransfer => {
      const type = (
        WALLET_ADDRESSES.has(txTransfer.from_address) &&
        WALLET_ADDRESSES.has(txTransfer.to_address)
      ) ? TransferType.INTERNAL : txTransfer.transfer_type

      const date = tx.block_signed_at.split('T')[0]
      const contractAddress = txTransfer.contract_address.toLowerCase()
      const usdPrice = fullFetch ? priceData[contractAddress][date] : BALANCES[contractAddress]?.rate
      const amount = parseNumber(Number(txTransfer.delta), BALANCES[contractAddress]?.decimals || txTransfer.contract_decimals)

      const usdValue = usdPrice ? usdPrice * amount : (txTransfer.delta_quote || 0)

      if (!usdPrice) {
        console.log(`No USD value for tx ${tx.tx_hash}, using ${usdValue}`)
      }

      const transfer: TransactionParsed = {
        wallet: name,
        hash: tx.tx_hash,
        date: tx.block_signed_at,
        block: tx.block_height,
        network: network.name,
        type,
        amount,
        symbol: txTransfer.contract_ticker_symbol,
        contract: txTransfer.contract_address,
        quote: usdValue,
        sender: txTransfer.from_address,
        from: txTransfer.from_address,
        to: txTransfer.to_address,
        interactedWith: tx.to_address,
        txFrom: tx.from_address,
        fee: tx.gas_quote
      }

      return transfer
    })
    transactions.push(...transfers)
  }

  return transactions
}

async function findSecondarySalesTag(txs: TransactionParsed[], chunk: number) {
  for (const tx of txs) {
    let fetched = false
    let maxRetries = 10

    do {
      try {
        const data = await fetchCovalentURL<TransactionItem>(`${baseCovalentUrl(Networks.get(tx.network))}/transaction_v2/${tx.hash}/?key=${COVALENT_API_KEY}`, PAGE_SIZE)
        fetched = true

        const log = data[0].log_events.find(log => Tags.isItemContract(log.sender_address))

        if (log) {
          tx.tag = Tags.getSecondarySale(log.sender_address)
        }

      } catch (error) {
        console.log('retrying...')
        maxRetries--
      }
    } while (!fetched && maxRetries > 0)

    if (maxRetries <= 0) {
      console.log('Failed to fetch secondary sale tag, tx:', tx.hash)
    }
  }

  console.log(`Secondary sales tagged: ${txs.length} - Chunk = ${chunk}`)
}

async function saveTransactionFiles(txs: TransactionParsed[], tagged = false, year?: number) {
  const yearText = year ? `-${year}` : ''
  saveToJSON(`transactions${yearText}.json`, txs)
  await saveToCSV(`transactions${yearText}.csv`, txs, [
    { id: 'date', title: 'Date' },
    { id: 'wallet', title: 'Wallet' },
    { id: 'network', title: 'Network' },
    { id: 'type', title: 'Type' },
    tagged && { id: 'tag', title: 'Tag' },
    { id: 'amount', title: 'Amount' },
    { id: 'symbol', title: 'Token' },
    { id: 'quote', title: 'USD Amount' },
    { id: 'fee', title: 'USD Fee' },
    { id: 'sender', title: 'Sender' },
    { id: 'from', title: 'Transfer From' },
    { id: 'to', title: 'Transfer To' },
    { id: 'block', title: 'Block' },
    { id: 'hash', title: 'Hash' },
    { id: 'contract', title: 'Contract' }
  ])
}

async function saveTransactions(txs: TransactionParsed[], tagged = false) {
  const txsPerYear: Map<number, TransactionParsed[]> = new Map()

  for(const tx of txs) {
    const year = new Date(tx.date).getUTCFullYear()
    const yearTxs = txsPerYear.get(year) || []
    yearTxs.push(tx)
    txsPerYear.set(year, yearTxs)
  }

  for (const [year, yearTxs] of txsPerYear) {
    await saveTransactionFiles(yearTxs, tagged, year)
  }

  await saveTransactionFiles(txs, tagged)
}

async function tagging(txs: TransactionParsed[]) {

  const ethNetwork = Networks.getEth()
  const polygonNetwork = Networks.getPolygon()

  const ethTxs = txs.filter(t => t.network === ethNetwork.name)
  const ethStartblock = ethTxs[ethTxs.length - 1]?.block
  const marketOrdersTxs = new Set(ethStartblock ? await getTopicTxs(ethNetwork, ethStartblock, Topic.ETH_ORDER_TOPIC) : [])
  console.log('Ethereum Orders:', marketOrdersTxs.size)

  const maticTxs = txs.filter(t => t.network === polygonNetwork.name)
  const maticStartblock = maticTxs[maticTxs.length - 1]?.block
  const maticOrdersTxs = new Set(maticStartblock ? await getTopicTxs(polygonNetwork, maticStartblock, Topic.MATIC_ORDER_TOPIC) : [])
  console.log('Matic Orders:', maticOrdersTxs.size)

  const tagger = async (transactions: TransactionParsed[], chunk: number) => {
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i]
      tx.tag = TagType.OTHER

      if (marketOrdersTxs.has(tx.hash)) {
        tx.tag = TagType.ETH_MARKETPLACE
      }

      if (maticOrdersTxs.has(tx.hash)) {
        tx.tag = TagType.MATIC_MARKETPLACE
        continue
      }

      if (tx.from === SAB_ADDRESS || tx.to === SAB_ADDRESS) {
        tx.tag = TagType.SAB_DCL
        continue
      }

      if (tx.type === TransferType.OUT && (GRANTS_VESTING_ADDRESSES.has(tx.to) || GRANTS_ENACTING_TXS.has(tx.hash))) {
        tx.tag = TagType.GRANT
        continue
      }

      if (tx.type === TransferType.IN && GRANTS_VESTING_ADDRESSES.has(tx.from)) {
        tx.tag = TagType.GRANT_REFUND
        continue
      }

      if (tx.type === TransferType.OUT && tx.to === FACILITATOR_ADDRESS) {
        tx.tag = TagType.FACILITATOR
        continue
      }

      const isOpenSeaTransaction = tx.type === TransferType.IN && (
        OPENSEA_ADDRESSES.has(tx.from) ||
        OPENSEA_ADDRESSES.has(tx.txFrom) ||
        OPENSEA_ADDRESSES.has(tx.interactedWith)
      )
      
      if (isOpenSeaTransaction) {
        tx.tag = TagType.OPENSEA
        continue
      }

      const isRentalFeeTransaction = tx.type === TransferType.IN && (
        RENTAL_ADDRESSES.has(tx.from) ||
        RENTAL_ADDRESSES.has(tx.txFrom) ||
        RENTAL_ADDRESSES.has(tx.interactedWith)
      )

      if (isRentalFeeTransaction) {
        tx.tag = TagType.RENTAL_FEE
        continue
      }

      setTransactionTag(tx)
    }

    console.log(`Tagged txns: ${transactions.length} - Chunk = ${chunk}`)
    return transactions
  }

  const dividedTxns = splitArray(txs, 10000)

  let taggedTxns = flattenArray(await Promise.all(dividedTxns.map(tagger)))
  const secondarySales = taggedTxns.filter(tx => tx.tag === TagType.SECONDARY_SALE)

  const dividedSecondarySales = splitArray(secondarySales, 500)

  console.log('TOTAL SECONDARY SALES CHUNKS:', dividedSecondarySales.length)

  await Promise.all(dividedSecondarySales.map(findSecondarySalesTag))
  const taggedsecondarySales = flattenArray(dividedSecondarySales)

  taggedTxns = taggedTxns.map(tx => ({ ...tx, ...taggedsecondarySales.find(ss => tx.hash === ss.hash) }))

  return taggedTxns
}

async function getTokenPrices(latestBlocks?: LatestBlocks) {
  console.log('Getting token prices...')
  const unresolvedPrices: Promise<TokenPriceAPIData[]>[] = []
  const today = new Date()

  const FIRST_TX_DATE = new Date('2020-01-24')

  for (const network of Networks.getAll()) {
    const tokenAddresses = Tokens.getAddresses(network.name)
    for (const address of tokenAddresses) {
      let from = FIRST_TX_DATE
      if (latestBlocks) {
        const blockInfo = latestBlocks[network.name][address]
        if (blockInfo) {
          from = new Date(blockInfo.date)
        } else {
          const aWeekAgo = getPreviousDate(today, 7)
          from = aWeekAgo
        }
      }
      unresolvedPrices.push(getTokenPriceInfo(address, network, from, today))
    }
  }

  const priceData = flattenArray(await Promise.all(unresolvedPrices))
  const prices: TokenPriceData = {}

  for (const priceItem of priceData) {
    prices[priceItem.contract_address.toLowerCase()] = priceItem.prices.reduce((accumulator, info) => {
      accumulator[info.date] = info.price
      return accumulator
    }, {} as Record<string, number>)
  }

  return prices
}

async function main() {
  let latestBlocks: LatestBlocks = {
    [NetworkName.ETHEREUM]: {},
    [NetworkName.POLYGON]: {}
  }
  let lastTransactions: TransactionParsed[] = []
  const unresolvedTransactions: Promise<TransactionParsed[]>[] = []

  const isFirstDayOfTheYear = new Date().getUTCMonth() === 0 && new Date().getUTCDate() === 1
  const fullFetch = process.argv.includes('--full') || isFirstDayOfTheYear

  if (!fullFetch) {
    const currentYear = new Date().getUTCFullYear()
    lastTransactions = await fetchURL(`${DECENTRALAND_DATA_URL}/transactions-${currentYear}.json`)
    latestBlocks = await getLatestBlockByToken(lastTransactions)
    console.log('Latest Blocks:', printableLatestBlocks(latestBlocks))
  } else {
    console.log('\n\n###################### WARNING: fetching all transactions ######################\n\n')
    priceData = await getTokenPrices()
    console.log('Fetched price data...')
  }

  for (const wallet of Wallets.getAll()) {
    const { name, address, network } = wallet
    const tokenAddresses = Tokens.getAddresses(network.name)

    for (const tokenAddress of tokenAddresses) {
      unresolvedTransactions.push(getTransactions(name, tokenAddress, network, address, fullFetch, latestBlocks[network.name][tokenAddress]?.block))
    }
  }

  console.log('Fetching transactions...')
  let transactions = flattenArray(await Promise.all(unresolvedTransactions))

  transactions = transactions.sort((a, b) => a.date > b.date ? -1 : a.date === a.date ? 0 : 1)
  console.log(transactions.length, 'transactions found.')

  console.log('Tagging...')
  const taggedTxns = await tagging(transactions)

  transactions = !fullFetch ? [...taggedTxns, ...lastTransactions] : taggedTxns

  console.log('Saving with tags...')
  await saveTransactions(transactions, true)
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))