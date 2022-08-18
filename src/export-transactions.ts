import BigNumber from 'bignumber.js'
import GRANTS from '../public/grants.json'
import { Networks, NetworkName, Network } from './entities/Networks'
import { Tags, TagType } from './entities/Tags'
import { Tokens, TokenSymbols } from './entities/Tokens'
import { Wallets } from './entities/Wallets'
import { Status } from './interfaces/GovernanceProposal'
import { GrantProposal } from './interfaces/Grant'
import { APIEvents } from './interfaces/Transactions/Events'
import { APITransactions } from './interfaces/Transactions/Transactions'
import { APITransfers, TransferType } from './interfaces/Transactions/Transfers'
import { COVALENT_API_KEY, fetchURL, flattenArray, saveToCSV, saveToJSON, setTransactionTag, splitArray } from './utils'


require('dotenv').config()
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

const walletAddresses = new Set(Wallets.getAddresses())

const grants: GrantProposal[] = GRANTS
const GRANTS_VESTING_ADDRESSES = new Set(grants.filter(g => g.status === Status.ENACTED && g.vesting_address).map(g => g.vesting_address.toLowerCase()))
const GRANTS_ENACTING_TXS = new Set(grants.filter(g => g.status === Status.ENACTED && g.enacting_tx).map(g => g.enacting_tx.toLowerCase()))
const SAB_ADDRESS = '0x0e659a116e161d8e502f9036babda51334f2667e' // Sec Advisory Board
const FACILITATOR_ADDRESS = '0x76fb13f00cdbdd5eac8e2664cf14be791af87cb0'
const OPENSEA_ADDRESSES = new Set([
  '0x9b814233894cd227f561b78cc65891aa55c62ad2',
  '0x2da950f79d8bd7e7f815e1bbc43ecee2c7e7f5d3',
  '0x00000000006c3852cbef3e08e8df289169ede581',
  '0xf715beb51ec8f63317d66f491e37e7bb048fcc2d'
])

async function getTopicTxs(network: Network, startblock: number, topic: Topic) {
  const events: string[] = []
  let block = startblock
  let url = `https://api.covalenthq.com/v1/${network.id}/block_v2/latest/?key=${COVALENT_API_KEY}`
  let json = await fetchURL(url)
  const latestBlock: number = json.data.items[0].height
  console.log('Latest', network, block, latestBlock, (latestBlock - block) / 1000000)

  while (block < latestBlock) {
    url = `https://api.covalenthq.com/v1/${network.id}/events/topics/${topic}/?key=${COVALENT_API_KEY}&starting-block=${block}&ending-block=${block + 1000000}&page-size=1000000000`
    console.log('fetch', url)
    json = await fetchURL(url)
    const data: APIEvents = json.data
    const eventsTransactions = data.items.map(e => e.tx_hash)
    events.push(...eventsTransactions)
    block += 1000000
  }

  return events
}

async function getTransactions(name: string, tokenAddress: string, network: Network, address: string) {
  const url = `https://api.covalenthq.com/v1/${network.id}/address/${address}/transfers_v2/?key=${COVALENT_API_KEY}&contract-address=${tokenAddress}&page-size=500000`
  const json = await fetchURL(url)
  const data: APITransfers = json.data
  const txs = data.items.filter(t => t.successful)

  const transactions: TransactionParsed[] = []

  for (const tx of txs) {
    const transfers = tx.transfers.map(txTransfer => {
      const type = (
        walletAddresses.has(txTransfer.from_address) &&
        walletAddresses.has(txTransfer.to_address)
      ) ? TransferType.INTERNAL : txTransfer.transfer_type

      const transfer: TransactionParsed = {
        wallet: name,
        hash: tx.tx_hash,
        date: tx.block_signed_at,
        block: tx.block_height,
        network: network.name,
        type,
        amount: new BigNumber(txTransfer.delta).dividedBy(10 ** txTransfer.contract_decimals).toNumber(),
        symbol: txTransfer.contract_ticker_symbol,
        contract: txTransfer.contract_address,
        quote: txTransfer.delta_quote,
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
        const networkId = Networks.get(tx.network).id
        const url = `https://api.covalenthq.com/v1/${networkId}/transaction_v2/${tx.hash}/?key=${COVALENT_API_KEY}`
        const json = await fetchURL(url)
        const data: APITransactions = json.data
        fetched = true

        const log = data.items[0].log_events.find(log => Tags.isItemContract(log.sender_address))

        if (log) {
          tx.tag = Tags.getSecondarySale(log.sender_address)
        }

      } catch (error) {
        console.log("retrying...")
        maxRetries--
      }
    } while (!fetched && maxRetries > 0)
  }

  console.log(`Secondary sales tagged: ${txs.length} - Chunk = ${chunk}`)
}

function saveTransactions(txs: TransactionParsed[], tagged = false) {
  saveToJSON('transactions.json', txs)
  saveToCSV('transactions.csv', txs, [
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

async function main() {
  const unresolvedTransactions: Promise<TransactionParsed[]>[] = []

  for (const wallet of Wallets.getAll()) {
    const { name, address, network } = wallet
    const tokenAddresses = Tokens.getAddresses(network.name)

    for (const tokenAddress of tokenAddresses) {
      unresolvedTransactions.push(getTransactions(name, tokenAddress, network, address))
    }
  }

  let transactions = flattenArray(await Promise.all(unresolvedTransactions))

  transactions = transactions.sort((a, b) => a.date > b.date ? -1 : a.date === a.date ? 0 : 1)
  console.log(transactions.length, 'transactions found.')

  saveTransactions(transactions)

  console.log('Tagging...')
  await tagging(transactions)
}

async function tagging(txs: TransactionParsed[]) {

  const ethNetwork = Networks.getEth()
  const polygonNetwork = Networks.getPolygon()

  const ethTxs = txs.filter(t => t.network === ethNetwork.name)
  const ethStartblock = ethTxs[ethTxs.length - 1].block
  const marketOrdersTxs = new Set(await getTopicTxs(ethNetwork, ethStartblock, Topic.ETH_ORDER_TOPIC))
  console.log('Ethereum Orders:', marketOrdersTxs.size)

  const maticTxs = txs.filter(t => t.network === polygonNetwork.name)
  const maticStartblock = maticTxs[maticTxs.length - 1].block
  const maticOrdersTxs = new Set(await getTopicTxs(polygonNetwork, maticStartblock, Topic.MATIC_ORDER_TOPIC))
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

      if (tx.type === TransferType.OUT && tx.to === FACILITATOR_ADDRESS) {
        tx.tag = TagType.FACILITATOR
        continue
      }

      if (
        tx.type === TransferType.IN && (
          OPENSEA_ADDRESSES.has(tx.from) ||
          OPENSEA_ADDRESSES.has(tx.txFrom) ||
          OPENSEA_ADDRESSES.has(tx.interactedWith)
        )) {
        tx.tag = TagType.OPENSEA
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

  console.log('Saving with tags...')
  saveTransactions(taggedTxns, true)
}

main()