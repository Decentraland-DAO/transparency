import { Wallets } from './entities/Wallets'
import { Tokens } from './entities/Tokens'
import { NetworkName } from './entities/Networks'
import { Tags } from './entities/Tags'
import { saveToJSON, saveToCSV } from './utils'

require('dotenv').config()

// ---- CoinGecko price config ----

const COINGECKO_API_KEY = process.env.COIN_GECKO_API_KEY || ''

// Map token symbol → CoinGecko ID (stablecoins = null, price is $1)
const COINGECKO_IDS: Record<string, string | null> = {
  MANA:  'decentraland',
  ETH:   'ethereum',
  WETH:  'weth',
  MATIC: 'matic-network',
  POL:   'matic-network', // Polygon rebranded MATIC → POL in Sep 2023
  DAI:   null,
  USDC:  null,
  USDT:  null,
}

// Fetches daily prices from CoinGecko (primary, requires paid key for full history)
async function fetchFromCoinGecko(geckoId: string, startTs: number, endTs: number): Promise<Record<string, number> | null> {
  const headers: Record<string, string> = { accept: 'application/json' }
  if (COINGECKO_API_KEY) headers['x-cg-demo-api-key'] = COINGECKO_API_KEY

  const url = `https://api.coingecko.com/api/v3/coins/${geckoId}/market_chart/range?vs_currency=usd&from=${startTs}&to=${endTs}`
  const res = await fetch(url, { headers })
  if (!res.ok) return null

  const json = (await res.json()) as { prices?: [number, number][]; error?: any }
  if (json.error) return null

  const result: Record<string, number> = {}
  for (const [tsMs, price] of json.prices || []) {
    const date = new Date(tsMs).toISOString().split('T')[0]
    result[date] = price
  }
  return result
}

// Fetches daily prices from DeFiLlama (fallback, free, full history)
async function fetchFromDefiLlama(geckoId: string, startTs: number, endTs: number): Promise<Record<string, number>> {
  const span = Math.ceil((endTs - startTs) / 86400) + 1
  const url = `https://coins.llama.fi/chart/coingecko:${geckoId}?start=${startTs}&span=${span}&period=1d`
  const res = await fetch(url)
  if (!res.ok) return {}

  const json = (await res.json()) as { coins?: Record<string, { prices?: { timestamp: number; price: number }[] }> }
  const prices = json.coins?.[`coingecko:${geckoId}`]?.prices || []
  const result: Record<string, number> = {}
  for (const { timestamp, price } of prices) {
    const date = new Date(timestamp * 1000).toISOString().split('T')[0]
    result[date] = price
  }
  return result
}

// Fetches daily close prices for a token — tries CoinGecko first, falls back to DeFiLlama
async function fetchDailyPrices(
  symbol: string,
  startTs: number,
  endTs: number
): Promise<Record<string, number>> {
  const geckoId = COINGECKO_IDS[symbol.toUpperCase()]
  if (geckoId === null) return {} // stablecoin, price = 1
  if (!geckoId) return {}

  try {
    const cgResult = await fetchFromCoinGecko(geckoId, startTs, endTs)
    if (cgResult && Object.keys(cgResult).length > 0) {
      console.log(`[CoinGecko] ${symbol}: ${Object.keys(cgResult).length} daily prices fetched`)
      return cgResult
    }
    console.log(`[CoinGecko] ${symbol}: no data, falling back to DeFiLlama...`)
  } catch (err) {
    console.log(`[CoinGecko] ${symbol}: error, falling back to DeFiLlama...`)
  }

  const llamaResult = await fetchFromDefiLlama(geckoId, startTs, endTs)
  console.log(`[DeFiLlama] ${symbol}: ${Object.keys(llamaResult).length} daily prices fetched`)
  return llamaResult
}

// Builds a price lookup: { 'SYMBOL:YYYY-MM-DD': usdPrice }
async function buildPriceLookup(
  symbols: string[],
  startTs: number,
  endTs: number
): Promise<Record<string, number>> {
  const lookup: Record<string, number> = {}
  const nonStable = [...new Set(symbols)].filter(s => COINGECKO_IDS[s.toUpperCase()] !== null)

  for (const symbol of nonStable) {
    const prices = await fetchDailyPrices(symbol, startTs, endTs)
    for (const [date, price] of Object.entries(prices)) {
      lookup[`${symbol.toUpperCase()}:${date}`] = price
    }
    // Small delay to respect free tier rate limit
    await new Promise(r => setTimeout(r, 1200))
  }
  return lookup
}

function getUsdPrice(symbol: string, date: string, lookup: Record<string, number>): number {
  const sym = (symbol || '').toUpperCase()
  if (sym === 'DAI' || sym === 'USDC' || sym === 'USDT') return 1
  return lookup[`${sym}:${date}`] || 0
}

const ALCHEMY_ETH_URL = process.env.ALCHEMY_ETH_URL || ''
const ALCHEMY_POLYGON_URL = process.env.ALCHEMY_POLYGON_URL || ''

if (!ALCHEMY_ETH_URL || !ALCHEMY_POLYGON_URL) {
  console.error('Error: Missing ALCHEMY_ETH_URL or ALCHEMY_POLYGON_URL in .env')
  process.exit(1)
}

const WALLET_ADDRESSES = new Set(Wallets.getAddresses().map(a => a.toLowerCase()))

// Known anchor for block estimation: Ethereum and Polygon at 2024-01-01 00:00:00 UTC
const ETH_ANCHOR_BLOCK = 18908895
const ETH_ANCHOR_TS   = 1704067200
const ETH_BLOCK_SECS  = 12

const POLYGON_ANCHOR_BLOCK = 51650000
const POLYGON_ANCHOR_TS   = 1704067200
const POLYGON_BLOCK_SECS  = 2

// ---- Types ----

interface AlchemyTransfer {
  blockNum: string
  hash: string
  from: string
  to: string
  value: number | null
  asset: string | null
  category: string
  rawContract: {
    value: string | null
    address: string | null
    decimal: string | null
  }
  metadata?: { blockTimestamp?: string }
  uniqueId: string
}

export interface TransactionParsed {
  wallet: string
  hash: string
  date: string
  block: number
  network: string
  type: string
  amount: number
  symbol: string
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

// ---- RPC helpers ----

const hexToInt = (h: string) => parseInt(h, 16)
const intToHex = (n: number) => '0x' + n.toString(16)

async function rpcCall<T = any>(url: string, method: string, params: unknown[] = []): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  })
  const json = (await res.json()) as { result?: T; error?: { message: string } }
  if (json.error) throw new Error(`RPC ${method} error: ${json.error.message}`)
  return json.result as T
}

// Finds the last block at or before targetTs using a linear estimate + binary search
async function findBlock(
  url: string,
  targetTs: number,
  anchorBlock: number,
  anchorTs: number,
  blockSecs: number
): Promise<number> {
  const searchWindow = Math.ceil((30 * 24 * 3600) / blockSecs) // ~30 days in blocks

  const latestHex = await rpcCall<string>(url, 'eth_blockNumber')
  const latest = hexToInt(latestHex)

  // If target timestamp is in the future, return latest block
  const latestBlock = await rpcCall<{ timestamp: string }>(url, 'eth_getBlockByNumber', [intToHex(latest), false])
  if (hexToInt(latestBlock.timestamp) <= targetTs) return latest

  const estimated = Math.max(0, Math.min(latest, Math.round(anchorBlock + (targetTs - anchorTs) / blockSecs)))

  let low = Math.max(0, estimated - searchWindow)
  let high = Math.min(latest, estimated + searchWindow)

  // Expand bounds if our estimate is off
  while (low > 0) {
    const b = await rpcCall<{ timestamp: string }>(url, 'eth_getBlockByNumber', [intToHex(low), false])
    if (hexToInt(b.timestamp) <= targetTs) break
    low = Math.max(0, low - searchWindow)
  }
  while (high < latest) {
    const b = await rpcCall<{ timestamp: string }>(url, 'eth_getBlockByNumber', [intToHex(high), false])
    if (hexToInt(b.timestamp) >= targetTs) break
    high = Math.min(latest, high + searchWindow)
  }

  // Binary search
  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    const b = await rpcCall<{ timestamp: string }>(url, 'eth_getBlockByNumber', [intToHex(mid), false])
    if (hexToInt(b.timestamp) <= targetTs) low = mid
    else high = mid - 1
  }

  return low
}

// ---- Transfer fetching ----

async function fetchTransfersInDirection(
  url: string,
  walletAddress: string,
  direction: 'from' | 'to',
  contractAddresses: string[],
  fromBlock: string,
  toBlock: string
): Promise<AlchemyTransfer[]> {
  const all: AlchemyTransfer[] = []
  let pageKey: string | undefined

  do {
    const params: Record<string, unknown> = {
      fromBlock,
      toBlock,
      category: ['external', 'internal', 'erc20'],
      withMetadata: true,
      excludeZeroValue: true,
      maxCount: '0x3e8' // 1000 per page
    }
    if (direction === 'from') params.fromAddress = walletAddress
    else params.toAddress = walletAddress
    if (contractAddresses.length > 0) params.contractAddresses = contractAddresses
    if (pageKey) params.pageKey = pageKey

    const result = await rpcCall<{ transfers?: AlchemyTransfer[]; pageKey?: string }>(
      url, 'alchemy_getAssetTransfers', [params]
    )
    all.push(...(result.transfers || []))
    pageKey = result.pageKey
    if (pageKey) console.log(`    paginating... (${all.length} so far)`)
  } while (pageKey)

  return all
}

function mapTransfer(t: AlchemyTransfer, walletName: string, networkName: string): TransactionParsed {
  const from = (t.from || '').toLowerCase()
  const to   = (t.to   || '').toLowerCase()

  let type: string
  if (WALLET_ADDRESSES.has(from) && WALLET_ADDRESSES.has(to)) {
    type = 'INTERNAL'
  } else if (WALLET_ADDRESSES.has(to)) {
    type = 'IN'
  } else {
    type = 'OUT'
  }

  const interactedWith = type === 'IN' ? from : to
  const date = t.metadata?.blockTimestamp?.split('T')[0] || ''

  // Tagging: same logic as setTransactionTag in utils.ts
  let tag = Tags.get(interactedWith)
  if (type === 'IN') {
    tag = Tags.get(from) || tag
  } else if (type === 'OUT') {
    tag = Tags.getCurator(to) || Tags.get(to) || tag
  }

  return {
    wallet: walletName,
    hash: t.hash,
    date,
    block: hexToInt(t.blockNum),
    network: networkName,
    type,
    amount: t.value || 0,
    symbol: t.asset || '',
    contract: t.rawContract?.address || '',
    quote: 0,
    sender: from,
    from,
    to,
    interactedWith,
    txFrom: from,
    fee: 0,
    tag: tag || undefined,
  }
}

// ---- Main ----

async function main() {
  // Parse --year argument: ts-node getAllTransactions.ts --year 2024
  const yearIdx = process.argv.indexOf('--year')
  const yearArg = yearIdx !== -1 ? process.argv[yearIdx + 1] : undefined
  const year = yearArg ? parseInt(yearArg) : new Date().getUTCFullYear()

  if (isNaN(year) || year < 2020 || year > 2030) {
    console.error('Usage: npx ts-node ./src/getAllTransactions.ts --year 2024')
    process.exit(1)
  }

  console.log(`\n=== Fetching all DAO transactions for year ${year} ===\n`)

  const startTs = Math.floor(new Date(`${year}-01-01T00:00:00Z`).getTime() / 1000)
  const endTs   = Math.floor(new Date(`${year + 1}-01-01T00:00:00Z`).getTime() / 1000) - 1

  console.log('Finding block ranges...')
  const [ethFromBlock, ethToBlock, polyFromBlock, polyToBlock] = await Promise.all([
    findBlock(ALCHEMY_ETH_URL,     startTs, ETH_ANCHOR_BLOCK,     ETH_ANCHOR_TS,     ETH_BLOCK_SECS),
    findBlock(ALCHEMY_ETH_URL,     endTs,   ETH_ANCHOR_BLOCK,     ETH_ANCHOR_TS,     ETH_BLOCK_SECS),
    findBlock(ALCHEMY_POLYGON_URL, startTs, POLYGON_ANCHOR_BLOCK, POLYGON_ANCHOR_TS, POLYGON_BLOCK_SECS),
    findBlock(ALCHEMY_POLYGON_URL, endTs,   POLYGON_ANCHOR_BLOCK, POLYGON_ANCHOR_TS, POLYGON_BLOCK_SECS),
  ])

  console.log(`ETH blocks:     ${ethFromBlock} -> ${ethToBlock}`)
  console.log(`Polygon blocks: ${polyFromBlock} -> ${polyToBlock}`)

  const seenIds = new Set<string>()
  const allTransactions: TransactionParsed[] = []

  for (const wallet of Wallets.getAll()) {
    const { name, address, network } = wallet
    const addr    = address.toLowerCase()
    const isEth   = network.name === NetworkName.ETHEREUM
    const url         = isEth ? ALCHEMY_ETH_URL     : ALCHEMY_POLYGON_URL
    const fromBlockHex = intToHex(isEth ? ethFromBlock  : polyFromBlock)
    const toBlockHex   = intToHex(isEth ? ethToBlock    : polyToBlock)
    const contractAddresses = Tokens.getAddresses(network.name)

    console.log(`\n[${network.name}] ${name} (${addr})`)

    for (const direction of ['from', 'to'] as const) {
      process.stdout.write(`  fetching ${direction === 'from' ? 'outgoing' : 'incoming'}... `)
      const transfers = await fetchTransfersInDirection(url, addr, direction, contractAddresses, fromBlockHex, toBlockHex)
      let added = 0
      for (const t of transfers) {
        if (seenIds.has(t.uniqueId)) continue
        seenIds.add(t.uniqueId)
        allTransactions.push(mapTransfer(t, name, network.name))
        added++
      }
      console.log(`${transfers.length} fetched, ${added} new`)
    }
  }

  allTransactions.sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0))

  console.log(`\nTotal unique transactions for ${year}: ${allTransactions.length}`)

  // Fetch historical USD prices from CoinGecko
  console.log('\nFetching historical USD prices from CoinGecko...')
  const uniqueSymbols = [...new Set(allTransactions.map(t => t.symbol).filter(Boolean))]
  const priceLookup = await buildPriceLookup(uniqueSymbols, startTs, endTs)

  // Apply USD prices
  for (const tx of allTransactions) {
    const price = getUsdPrice(tx.symbol, tx.date, priceLookup)
    tx.quote = price > 0 ? Math.round(tx.amount * price * 100) / 100 : 0
  }

  saveToJSON(`transactions-${year}.json`, allTransactions)
  await saveToCSV(`transactions-${year}.csv`, allTransactions, [
    { id: 'date',          title: 'Date'          },
    { id: 'wallet',        title: 'Wallet'        },
    { id: 'network',       title: 'Network'       },
    { id: 'type',          title: 'Type'          },
    { id: 'tag',           title: 'Tag'           },
    { id: 'amount',        title: 'Amount'        },
    { id: 'symbol',        title: 'Token'         },
    { id: 'quote',         title: 'USD Amount'    },
    { id: 'fee',           title: 'USD Fee'       },
    { id: 'sender',        title: 'Sender'        },
    { id: 'from',          title: 'Transfer From' },
    { id: 'to',            title: 'Transfer To'   },
    { id: 'block',         title: 'Block'         },
    { id: 'hash',          title: 'Hash'          },
    { id: 'contract',      title: 'Contract'      },
  ])

  console.log(`\nSaved to ./public/transactions-${year}.json and ./public/transactions-${year}.csv`)
}

main().catch(err => {
  console.error('\nFailed:', err)
  process.exit(1)
})
