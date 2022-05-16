import BigNumber from 'bignumber.js';
import GRANTS from '../public/grants.json';
import { GrantProposal } from './export-grants';
import { Status } from './interfaces/GovernanceProposal';
import { Decimals, Network, NetworkID, Token } from './interfaces/Network';
import { APIEvents } from './interfaces/Transactions/Events';
import { APITransfers, TransferType } from './interfaces/Transactions/Transfers';
import { fetchURL, flattenArray, saveToCSV, saveToJSON, setTransactionTag, splitArray, wallets } from './utils';

require('dotenv').config()

export interface TransactionParsed {
  wallet: string
  hash: string
  date: string
  block: number
  network: Network
  type: TransferType
  amount: number
  symbol: Token
  contract: string
  quote: number
  sender: string
  from: string
  to: string
  interactedWith: string
  txFrom: string
  tag?: string
}

enum Topic {
  ETH_ORDER_TOPIC = '0x695ec315e8a642a74d450a4505eeea53df699b47a7378c7d752e97d5b16eb9bb',
  MATIC_ORDER_TOPIC = '0x77cc75f8061aa168906862622e88c5b05a026a9c06c02d91ec98543e01e7ad33',
  MATIC_ORDER_TOPIC2 = '0x6869791f0a34781b29882982cc39e882768cf2c96995c2a110c577c53bc932d5'
}

const walletAddresses = new Set(wallets.map(w => w[1]))

const tokens = {
  '0x0f5d2fb29fb7d3cfee444a200298f468908cc942': [Network.ETHEREUM, Token.MANA, Decimals.MANA],
  '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0': [Network.ETHEREUM, Token.MATIC, Decimals.MATIC],
  '0x6b175474e89094c44da98b954eedeac495271d0f': [Network.ETHEREUM, Token.DAI, Decimals.DAI],
  '0xdac17f958d2ee523a2206206994597c13d831ec7': [Network.ETHEREUM, Token.USDT, Decimals.USDT],
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': [Network.ETHEREUM, Token.USDC, Decimals.USDC],
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': [Network.ETHEREUM, Token.WETH, Decimals.WETH],
  '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4': [Network.POLYGON, Token.MANA, Decimals.MANA],
  '0x8f3cf7ad23cd3cadbd9735aff958023239c6a063': [Network.POLYGON, Token.DAI, Decimals.DAI],
  '0xc2132d05d31c914a87c6611c10748aeb04b58e8f': [Network.POLYGON, Token.USDT, Decimals.USDT],
  '0x2791bca1f2de4661ed88a30c99a7a9449aa84174': [Network.POLYGON, Token.USDC, Decimals.USDC],
  '0x7ceb23fd6bc0add59e62ac25578270cff1b9f619': [Network.POLYGON, Token.WETH, Decimals.WETH],
}

const ethTokens = Object.keys(tokens).filter(a => tokens[a][0] === Network.ETHEREUM)
const maticTokens = Object.keys(tokens).filter(a => tokens[a][0] === Network.POLYGON)

const API_KEY = process.env.COVALENTHQ_API_KEY
const grants: GrantProposal[] = GRANTS
const GRANT_ADDRESSES = new Set(grants.filter(g => g.status === Status.ENACTED || g.status === Status.PASSED).map(g => (g.vesting_address || g.grant_beneficiary).toLowerCase()))
const CURATOR_ADDRESSES = new Set([
  '0x5d7846007c1dd6dca25d16ce2f71ec13bcdcf6f0',
  '0x716954738e57686a08902d9dd586e813490fee23',
  '0xc958f028d1b871ab2e32c2abda54f37191efe0c2',
  '0x82d54417fc69681dc74a6c0c68c6dbad5a2857b9',
  '0x9db59920d3776c2d8a3aa0cbd7b16d81fcab0a2b',
  '0x91e222ed7598efbcfe7190481f2fd14897e168c8',
  '0x9db59920d3776c2d8a3aa0cbd7b16d81fcab0a2b',
  '0x6cdfdb9a4d99f16b5607cab1d00c792206db554e'
])
const SWAP_ADDRESSES = new Set(['0x6d51fdc0c57cbbff6dac4a565b35a17b88c6ceb5', '0x56eddb7aa87536c09ccc2793473599fd21a8b17f'])
const FACILITATOR_ADDRESS = '0x76fb13f00cdbdd5eac8e2664cf14be791af87cb0'
const OPENSEA_ADDRESS = '0x9b814233894cd227f561b78cc65891aa55c62ad2'
const VESTING_CONTRACT_ADDRESS = '0x7a3abf8897f31b56f09c6f69d074a393a905c1ac'
const MULTISIG_DCL_ADDRESS = '0x0e659a116e161d8e502f9036babda51334f2667e'

async function getTopicTxs(network: number, startblock: number, topic: Topic) {
  const events: string[] = []
  let block = startblock
  let url = `https://api.covalenthq.com/v1/${network}/block_v2/latest/?key=${API_KEY}`
  let json = await fetchURL(url)
  const latestBlock: number = json.data.items[0].height
  console.log('Latest', network, block, latestBlock, (latestBlock - block) / 1000000)

  while (block < latestBlock) {
    url = `https://api.covalenthq.com/v1/${network}/events/topics/${topic}/?key=${API_KEY}&starting-block=${block}&ending-block=${block + 1000000}&page-size=1000000000`
    console.log('fetch', url)
    json = await fetchURL(url)
    const data: APIEvents = json.data
    let evs = data.items.map(e => e.tx_hash)
    events.push(...evs)
    block += 1000000
  }

  return events
}

async function getTransactions(name: string, tokenAddress: string, network: number, address: string) {
  let token = tokens[tokenAddress]
  const url = `https://api.covalenthq.com/v1/${network}/address/${address}/transfers_v2/?key=${API_KEY}&contract-address=${tokenAddress}&page-size=500000`
  const json = await fetchURL(url)
  const data: APITransfers = json.data
  const txs = data.items.filter(t => t.successful)

  const transactions: TransactionParsed[] = []

  for (const tx of txs) {
    const transfers = tx.transfers.map(trans => {
      let type = (
        walletAddresses.has(trans.from_address) &&
        walletAddresses.has(trans.to_address)
      ) ? TransferType.INTERNAL : trans.transfer_type

      const transfer: TransactionParsed = {
        wallet: name,
        hash: tx.tx_hash,
        date: tx.block_signed_at,
        block: tx.block_height,
        network: token[0],
        type: type,
        amount: new BigNumber(trans.delta).dividedBy(10 ** trans.contract_decimals).toNumber(),
        symbol: trans.contract_ticker_symbol,
        contract: trans.contract_address,
        quote: trans.delta_quote,
        sender: trans.from_address,
        from: trans.from_address,
        to: trans.to_address,
        interactedWith: tx.to_address,
        txFrom: tx.from_address
      }
      return transfer
    })
    transactions.push(...transfers)
  }

  return transactions
}

async function main() {
  let unresolved_transactions: Promise<TransactionParsed[]>[] = []

  for (let i = 0; i < wallets.length; i++) {
    const network: number = NetworkID[wallets[i][0]]
    const address = wallets[i][1]
    const name = wallets[i][2]
    const tokenAddresses = network === 1 ? ethTokens : maticTokens

    for (const tokenAddress of tokenAddresses) {
      unresolved_transactions.push(getTransactions(name, tokenAddress, network, address))
    }
  }

  let transactions = flattenArray(await Promise.all(unresolved_transactions))

  transactions = transactions.sort((a, b) => a.date > b.date ? -1 : a.date === a.date ? 0 : 1)
  console.log(transactions.length, 'transactions found.')

  saveToJSON('transactions.json', transactions)
  saveToCSV('transactions.csv', transactions, [
    { id: 'date', title: 'Date' },
    { id: 'wallet', title: 'Wallet' },
    { id: 'network', title: 'Network' },
    { id: 'type', title: 'Type' },
    { id: 'amount', title: 'Amount' },
    { id: 'symbol', title: 'Token' },
    { id: 'quote', title: 'USD Amount' },
    { id: 'sender', title: 'Sender' },
    { id: 'from', title: 'Transfer From' },
    { id: 'to', title: 'Transfer To' },
    { id: 'block', title: 'Block' },
    { id: 'hash', title: 'Hash' },
    { id: 'contract', title: 'Contract' },
  ])

  console.log('Tagging...')
  await tagging(transactions)
}

async function tagging(txs: TransactionParsed[]) {

  const ethTxs = txs.filter(t => t.network === Network.ETHEREUM)
  const ethStartblock = ethTxs[ethTxs.length - 1].block
  const marketOrdersTxs = new Set(await getTopicTxs(NetworkID[Network.ETHEREUM], ethStartblock, Topic.ETH_ORDER_TOPIC))
  console.log('Ethereum Orders:', marketOrdersTxs.size)

  const maticTxs = txs.filter(t => t.network === Network.POLYGON)
  const maticStartblock = maticTxs[maticTxs.length - 1].block
  const maticOrdersTxs = new Set(await getTopicTxs(NetworkID[Network.POLYGON], maticStartblock, Topic.MATIC_ORDER_TOPIC))
  console.log('Matic Orders:', maticOrdersTxs.size)

  const tagger = async (transactions: TransactionParsed[], chunk: number) => {
    for (let i = 0; i < transactions.length; i++) {
      let tx = transactions[i]
      tx.tag = 'OTHER'

      if (marketOrdersTxs.has(tx.hash)) {
        tx.tag = 'ETH Marketplace'
      }

      if (maticOrdersTxs.has(tx.hash)) {
        tx.tag = 'MATIC Marketplace'
        continue
      }

      if (tx.from === MULTISIG_DCL_ADDRESS || tx.to === MULTISIG_DCL_ADDRESS) {
        tx.tag = 'Multisig DCL'
        continue
      }

      if (tx.type === TransferType.OUT && GRANT_ADDRESSES.has(tx.to)) {
        tx.tag = 'Grant'
        continue
      }

      if (tx.type === TransferType.OUT && CURATOR_ADDRESSES.has(tx.to)) {
        tx.tag = 'Curator'
        continue
      }

      if (tx.type === TransferType.OUT && tx.to === FACILITATOR_ADDRESS) {
        tx.tag = 'Facilitator'
        continue
      }

      if (tx.type === TransferType.IN && tx.from === VESTING_CONTRACT_ADDRESS) {
        tx.tag = 'Vesting Contract'
        continue
      }

      if (tx.type === TransferType.IN && tx.from === '0x2da950f79d8bd7e7f815e1bbc43ecee2c7e7f5d3') {
        tx.tag = 'EOA 0x2da95'
        continue
      }

      if (tx.type === TransferType.IN && (tx.from === OPENSEA_ADDRESS || tx.txFrom === OPENSEA_ADDRESS)) {
        tx.tag = 'OpenSea'
        continue
      }

      if (tx.type === TransferType.IN && SWAP_ADDRESSES.has(tx.from)) {
        tx.tag = 'Swap'
        continue
      }

      setTransactionTag(tx)
    }

    console.log(`Tagged txns: ${transactions.length} - Chunk = ${chunk}`)
    return transactions
  }

  const dividedTxns = splitArray(txs, 10000)

  const taggedTxns = flattenArray(await Promise.all(dividedTxns.map((t, idx) => tagger(t, idx))))

  console.log('Saving with tags...')
  saveToJSON('transactions.json', taggedTxns)
  saveToCSV('transactions.csv', taggedTxns, [
    { id: 'date', title: 'Date' },
    { id: 'wallet', title: 'Wallet' },
    { id: 'network', title: 'Network' },
    { id: 'type', title: 'Type' },
    { id: 'tag', title: 'Tag' },
    { id: 'amount', title: 'Amount' },
    { id: 'symbol', title: 'Token' },
    { id: 'quote', title: 'USD Amount' },
    { id: 'sender', title: 'Sender' },
    { id: 'from', title: 'Transfer From' },
    { id: 'to', title: 'Transfer To' },
    { id: 'block', title: 'Block' },
    { id: 'hash', title: 'Hash' },
    { id: 'contract', title: 'Contract' },
  ])
}

main()