import path from 'path'
import fs from 'fs'
type FetchResponse = Response
/** CONFIG / CONSTANTS */
const DCL_SUBGRAPH_API_KEY = process.env.DCL_SUBGRAPH_API_KEY
const RENTALS_SUBGRAPH_URL = 'https://subgraph.decentraland.org/rentals-ethereum-mainnet'
const MARKETPLACE_SUBGRAPH_URL = 'https://subgraph.decentraland.org/marketplace'
const COLLECTIONS_POLYGON_SUBGRAPH_URL = 'https://subgraph.decentraland.org/collections-matic-mainnet'

const DCL_RENTALS_FEE_PCT = 0.025
const PRIMARY_SALES_FEE_PCT = 0.025
const LAND_MARKETPLACE_FEE_PCT = 0.025
const NAME_CONTRACT = '0x2a187453064356c898cae034eaed119e1663acb8'.toLowerCase()

const ALCHEMY_ETH_URL = process.env.ALCHEMY_ETH_URL || ''
const ALCHEMY_POLYGON_URL = process.env.ALCHEMY_POLYGON_URL || ''
const NAME_REGISTERED_TOPIC = '0x570313dae523ecb48b1176a4b60272e5ea7ec637f5b2d09983cbc4bf25e7e9e3'
const NAME_MINT_PRICE_MANA = 100

const COINGECKO_MANA_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=decentraland&vs_currencies=usd'

const SECS_30D = 30 * 24 * 60 * 60 // 30d

// ---------------------------------------------EXPENSES
const DAO_TREASURY_ETH = [
  '0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce', // Aragon Agent
  '0x89214c8ca9a49e60a3bfa8e00544f384c93719b1'  // DAO  (Ethereum)
].map((a) => a.toLowerCase())

const DAO_TREASURY_POLYGON = [
  '0xb08e3e7cc815213304d884c88ca476ebc50eaab2' // DAO  (Polygon)
].map((a) => a.toLowerCase())

// // Payment addresses
const CURATORS_PAYMENT_ADDRESSES = [
  '0x5d7846007c1dd6dca25d16ce2f71ec13bcdcf6f0',
  '0x716954738e57686a08902d9dd586e813490fee23',
  '0xc958f028d1b871ab2e32c2abda54f37191efe0c2',
  '0x82d54417fc69681dc74a6c0c68c6dbad5a2857b9',
  '0x9db59920d3776c2d8a3aa0cbd7b16d81fcab0a2b',
  '0x91e222ed7598efbcfe7190481f2fd14897e168c8',
  '0x6cdfdb9a4d99f16b5607cab1d00c792206db554e',
  '0x862f109696d7121438642a78b3caa38f476db08b',
  '0xc8ad6322821b51da766a4b2a82b39fb72b53d276',
  '0xa8c7d5818a255a1856b31177e5c96e1d61c83991',
  '0x336685bb3a96e13b77e909d7c52e8afcff1e859e',
  '0x41eb5f82af60873b3c14fedb898a1712f5c35366',
  '0x470c33abd57166940095d59bd8dd573cbae556c3',
  '0x1dec5f50cb1467f505bb3ddfd408805114406b10',
  '0x5ce9fb617333b8c5a8f7787710f7c07002cb3516',
  '0x805797df0c0d7d70e14230b72e30171d730da55e'
].map((a) => a.toLowerCase())
const CURATORS_PAYMENT_SET = new Set(CURATORS_PAYMENT_ADDRESSES)


interface AlchemyTransfer {
  blockNum: string
  hash: string
  from: string
  to: string
  value: number
  asset: string
  category: string
  uniqueId?: string
  metadata?: {
    blockTimestamp?: string
  }
}

// --------------------------------------------




/** TYPES */
type GraphData = Record<string, unknown> | null

interface GraphQLError { message: string }
interface GraphQLResponse<T> { data?: T; errors?: GraphQLError[] }

interface Rental { pricePerDay: string; rentalDays: string }
interface NFTRef { category?: string; contractAddress?: string; tokenId?: string }
interface Sale { price: string; timestamp: string; nft?: NFTRef }
interface WearableItem { id: string; createdAt: string; creationFee: string }

interface IncomeRow {
  name: string
  description: string
  txCount: number
  manaTotal: number
  usdTotal: number
}
interface LandEstateFees { land: IncomeRow; estate: IncomeRow }

interface ApiJsonShape {
  balances: unknown[]
  income: {
    total: number
    previous: number
    details: { name: string; description: string; value: number }[]
  }
  [k: string]: unknown
}

/** Graph helper */
async function graphQuery<T extends GraphData>(
  endpoint: string,
  query: string,
  variables?: Record<string, unknown>
): Promise<T | null> {
  try {
    const res: FetchResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(DCL_SUBGRAPH_API_KEY ? { 'x-api-key': DCL_SUBGRAPH_API_KEY } : {})
      },
      body: JSON.stringify({ query, variables })
    })
    const json = (await res.json()) as GraphQLResponse<T>
    if (!res.ok || json.errors) {
      console.error('graphQuery error:', JSON.stringify(json.errors || res.statusText, null, 2))
      return null
    }
    return (json.data as T) ?? null
  } catch (err: any) {
    console.error('graphQuery failed:', err?.message || String(err))
    return null
  }
}

/** Rentals income */
async function calcRentalsIncomeUSD(startTs: number, endTs: number, manaUsd: number): Promise<IncomeRow> {
  const RENTALS_QUERY = `
    query Rentals($from: Int!, $to: Int!) {
      rentals(
        where: { startedAt_gte: $from, startedAt_lt: $to }
        first: 1000
        orderBy: startedAt
        orderDirection: desc
      ) {
        pricePerDay
        rentalDays
      }
    }
  `
  let feeMana = 0
  let rentalsCount = 0

  type RentalsResp = { rentals: Rental[] }
  const data = await graphQuery<RentalsResp>(RENTALS_SUBGRAPH_URL, RENTALS_QUERY, { from: startTs, to: endTs })

  if (data && data.rentals) {
    rentalsCount = data.rentals.length
    for (const r of data.rentals) {
      const pricePerDayWei = Number(r.pricePerDay) || 0
      const days = Number(r.rentalDays) || 0
      const feeWei = pricePerDayWei * days * DCL_RENTALS_FEE_PCT
      feeMana += feeWei / 1e18
    }
  } else {
    console.warn('rentals subgraph: no data')
  }

  const usdTotal = feeMana * manaUsd
  console.log('[Rentals] txCount:', rentalsCount, 'manaTotal:', feeMana, 'usdTotal:', usdTotal)

  return {
    name: 'LAND Rentals Marketplace Fee',
    description: '2.5% fee on LAND/ESTATE rentals (last 30 days)',
    txCount: rentalsCount,
    manaTotal: feeMana,
    usdTotal
  }
}

/** Names income (marketplace subgraph) */
async function calcNamesIncomeUSD(startTs: number, endTs: number, manaUsd: number): Promise<IncomeRow> {
  const NAMES_QUERY = `
    query SalesWindow($from: BigInt!, $to: BigInt!) {
      sales(
        where: { timestamp_gte: $from, timestamp_lt: $to }
        first: 1000
        orderBy: timestamp
        orderDirection: desc
      ) {
        price
        timestamp
        nft { category contractAddress tokenId }
      }
    }
  `
  type SalesResp = { sales: Sale[] }
  const data = await graphQuery<SalesResp>(MARKETPLACE_SUBGRAPH_URL, NAMES_QUERY, {
    from: String(startTs),
    to: String(endTs)
  })

  let manaTotal = 0
  let txCount = 0

  if (data?.sales) {
    for (const sale of data.sales) {
      const nft = sale.nft || {}
      const cat = (nft.category || '').toLowerCase()
      const addr = (nft.contractAddress || '').toLowerCase()
      const isNameSale = cat === 'names' || addr === NAME_CONTRACT
      if (!isNameSale) continue
      const mana = Number(sale.price) / 1e18
      if (!isNaN(mana)) {
        manaTotal += mana
        txCount += 1
      }
    }
  } else {
    console.warn('marketplace subgraph (names): no data')
  }

  const usdTotal = manaTotal * manaUsd
  console.log('[Names] txCount:', txCount, 'manaTotal:', manaTotal, 'usdTotal:', usdTotal)

  return {
    name: 'Names Minting Fee',
    description: 'Fee collected from Names registrations (last 30 days)',
    txCount,
    manaTotal,
    usdTotal
  }
}

/** Polygon primary sales fee */
async function calcPolygonPrimarySalesIncomeUSD(
  startTs: number,
  endTs: number,
  manaUsd: number
): Promise<IncomeRow> {
  const POLY_SALES_QUERY = `
    query PolygonSalesPage($from: BigInt!, $to: BigInt!, $first: Int!, $skip: Int!) {
      sales(
        where: { timestamp_gte: $from, timestamp_lt: $to }
        first: $first
        skip: $skip
        orderBy: timestamp
        orderDirection: desc
      ) {
        price
        timestamp
        nft { category contractAddress tokenId }
      }
    }
  `
  const PAGE_SIZE = 1000
  let skip = 0
  let totalManaVolume = 0
  let txCount = 0

  type SalesResp = { sales: Sale[] }
  while (true) {
    const page = await graphQuery<SalesResp>(COLLECTIONS_POLYGON_SUBGRAPH_URL, POLY_SALES_QUERY, {
      from: String(startTs),
      to: String(endTs),
      first: PAGE_SIZE,
      skip
    })
    const salesPage = page?.sales || []
    if (salesPage.length === 0) break

    for (const sale of salesPage) {
      const mana = Number(sale.price) / 1e18
      if (!isNaN(mana)) {
        totalManaVolume += mana
        txCount += 1
      }
    }
    if (salesPage.length < PAGE_SIZE) break
    skip += PAGE_SIZE
  }

  const feeMana = totalManaVolume * PRIMARY_SALES_FEE_PCT
  const usdTotal = feeMana * manaUsd
  console.log('[Polygon Wearable Minting fee] txCount:', txCount, 'feeMana:', feeMana, 'usdTotal:', usdTotal)

  return {
    name: 'Polygon Primary Sales Fee',
    description: '2.5% fee on primary sales in Decentraland Collections on Polygon (last 30 days)',
    txCount,
    manaTotal: feeMana,
    usdTotal
  }
}

/** LAND / ESTATE marketplace fee (L1) */
async function calcLandEstateMarketplaceFeesUSD(
  startTs: number,
  endTs: number,
  manaUsd: number
): Promise<LandEstateFees> {
  const SALES_QUERY = `
    query LandEstateSalesPage($from: BigInt!, $to: BigInt!, $first: Int!, $skip: Int!) {
      sales(
        where: { timestamp_gte: $from, timestamp_lt: $to }
        first: $first
        skip: $skip
        orderBy: timestamp
        orderDirection: desc
      ) {
        price
        timestamp
        nft { category contractAddress tokenId }
      }
    }
  `

  const PAGE_SIZE = 1000
  let skip = 0
  let landVolumeMana = 0
  let estateVolumeMana = 0
  let landTxCount = 0
  let estateTxCount = 0

  type SalesResp = { sales: Sale[] }
  while (true) {
    const page = await graphQuery<SalesResp>(MARKETPLACE_SUBGRAPH_URL, SALES_QUERY, {
      from: String(startTs),
      to: String(endTs),
      first: PAGE_SIZE,
      skip
    })
    const salesPage = page?.sales || []
    if (salesPage.length === 0) break

    for (const sale of salesPage) {
      const cat = (sale.nft?.category || '').toLowerCase()
      const mana = Number(sale.price) / 1e18
      if (isNaN(mana)) continue

      if (cat === 'estate') {
        estateVolumeMana += mana
        estateTxCount += 1
      } else if (cat === 'parcel' || cat === 'parcels' || cat === 'land') {
        landVolumeMana += mana
        landTxCount += 1
      }
    }

    if (salesPage.length < PAGE_SIZE) break
    skip += PAGE_SIZE
  }

  const landFeeMana = landVolumeMana * LAND_MARKETPLACE_FEE_PCT
  const estateFeeMana = estateVolumeMana * LAND_MARKETPLACE_FEE_PCT

  const landFeeUsd = landFeeMana * manaUsd
  const estateFeeUsd = estateFeeMana * manaUsd

  console.log('[LAND Fee] txCount:', landTxCount, 'volumeMana:', landVolumeMana, 'feeMana:', landFeeMana, 'usd:', landFeeUsd)
  console.log('[ESTATE Fee] txCount:', estateTxCount, 'volumeMana:', estateVolumeMana, 'feeMana:', estateFeeMana, 'usd:', estateFeeUsd)

  return {
    land: {
      name: 'LAND  DCL Marketplace Sales Fee',
      description: 'Funds corresponding to the 2.5% fee applied to every LAND transaction (Minting or secondary)',
      txCount: landTxCount,
      manaTotal: landFeeMana,
      usdTotal: landFeeUsd
    },
    estate: {
      name: 'ESTATE DCL Marketplace Sales Fee',
      description:
        'Funds corresponding to the 2.5% fee applied to every ESTATE transaction (Minting or secondary)',
      txCount: estateTxCount,
      manaTotal: estateFeeMana,
      usdTotal: estateFeeUsd
    }
  }
}

/** RPC helpers (Alchemy) */
async function rpc<T = any>(method: string, params: unknown[] = []): Promise<T> {
  const res: FetchResponse = await fetch(ALCHEMY_ETH_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  })
  const json = (await res.json()) as { result?: T; error?: { message: string } }
  if (json.error) throw new Error(`RPC ${method} error: ${json.error.message}`)
  return json.result as T
}
const hexToInt = (h: string) => parseInt(h, 16)
const intToHex = (n: number) => '0x' + n.toString(16)

async function getLatestBlockNumber(): Promise<number> {
  const h = await rpc<string>('eth_blockNumber')
  return hexToInt(h)
}
async function getBlock(number: number | string): Promise<{ timestamp: string }> {
  const h = typeof number === 'number' ? intToHex(number) : number
  return rpc('eth_getBlockByNumber', [h, false])
}


async function findBlockAtOrBeforeTimestamp(targetTs: number): Promise<number> {
  const latest = await getLatestBlockNumber()
  const approxBack = Math.ceil((30 * 24 * 3600) / 12) + 20000
  let low = Math.max(0, latest - approxBack)
  let high = latest

  let lowBlock = await getBlock(low)
  while (low > 0 && hexToInt(lowBlock.timestamp) > targetTs) {
    const step = Math.min(low, 50000)
    low -= step
    lowBlock = await getBlock(low)
  }

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    const b = await getBlock(mid)
    const t = hexToInt(b.timestamp)
    if (t <= targetTs) low = mid
    else high = mid - 1
  }
  return low
}

async function rpcPolygon<T = any>(method: string, params: unknown[] = []): Promise<T> {
  const res: FetchResponse = await fetch(ALCHEMY_POLYGON_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params })
  })
  const json = (await res.json()) as { result?: T; error?: { message: string } }
  if (json.error) throw new Error(`Polygon RPC ${method} error: ${json.error.message}`)
  return json.result as T
}

async function getLatestPolygonBlockNumber(): Promise<number> {
  const h = await rpcPolygon<string>('eth_blockNumber')
  return hexToInt(h)
}

async function getPolygonBlock(number: number | string): Promise<{ timestamp: string }> {
  const h = typeof number === 'number' ? intToHex(number) : number
  return rpcPolygon('eth_getBlockByNumber', [h, false])
}

async function findPolygonBlockAtOrBeforeTimestamp(targetTs: number): Promise<number> {
  const latest = await getLatestPolygonBlockNumber()
  
  const approxBack = Math.ceil((30 * 24 * 3600) / 2) + 20000
  let low = Math.max(0, latest - approxBack)
  let high = latest

  let lowBlock = await getPolygonBlock(low)
  while (low > 0 && hexToInt(lowBlock.timestamp) > targetTs) {
    const step = Math.min(low, 50000)
    low -= step
    lowBlock = await getPolygonBlock(low)
  }

  while (low < high) {
    const mid = Math.floor((low + high + 1) / 2)
    const b = await getPolygonBlock(mid)
    const t = hexToInt(b.timestamp)
    if (t <= targetTs) low = mid
    else high = mid - 1
  }
  return low
}


async function calcNamesMintingFeeFromLogsUSD(
  startTs: number,
  endTs: number,
  manaUsd: number
): Promise<IncomeRow> {
  const fromBlock = await findBlockAtOrBeforeTimestamp(startTs)
  const toBlock = await findBlockAtOrBeforeTimestamp(endTs)

  const params = [
    {
      fromBlock: intToHex(fromBlock),
      toBlock: intToHex(toBlock),
      address: NAME_CONTRACT,
      topics: [NAME_REGISTERED_TOPIC]
    }
  ]
  const logs: unknown[] = await rpc('eth_getLogs', params)

  const registrations = logs.length
  const manaTotal = registrations * NAME_MINT_PRICE_MANA
  const usdTotal = manaTotal * manaUsd
  console.log(`[Names logs] txCount: ${registrations} mana: ${manaTotal} usd: ${usdTotal}`)

  return {
    name: 'Names Minting Fee',
    description: '100 MANA por registro de nombre (últimos 30 días, on-chain logs)',
    txCount: registrations,
    manaTotal,
    usdTotal
  }
}

/** Wearable submission fee (subgraph) */
function weiToManaFloat(weiStr: string): number {
  const wei = BigInt(weiStr || '0')
  const WEI_PER_MANA = BigInt(10) ** BigInt(18)
  const whole = wei / WEI_PER_MANA
  const frac = wei % WEI_PER_MANA
  return Number(whole) + Number(frac) / 1e18
}

async function fetchLatestItemCreatedAt(): Promise<number | null> {
  const LATEST_ITEM_QUERY = `
    query LatestItem {
      items(first: 1, orderBy: createdAt, orderDirection: desc) { createdAt }
    }
  `
  type Resp = { items: { createdAt: string }[] }
  const data = await graphQuery<Resp>(COLLECTIONS_POLYGON_SUBGRAPH_URL, LATEST_ITEM_QUERY, {})
  const latest = data?.items?.[0]?.createdAt
  if (!latest) {
    console.warn('collections subgraph: no latest createdAt')
    return null
  }
  return Number(latest)
}

async function fetchWearableFeesWindow(fromTs: number, toTs: number): Promise<{ totalMana: number; totalItems: number }> {
  const PAGE_SIZE = 1000
  let skip = 0
  let totalMana = 0
  let totalItems = 0

  const WEARABLES_WINDOW_QUERY = `
    query NewItemsWindow($from: Int!, $to: Int!, $first: Int!, $skip: Int!) {
      items(
        where: { createdAt_gte: $from, createdAt_lt: $to }
        first: $first
        skip: $skip
        orderBy: createdAt
        orderDirection: asc
      ) {
        id
        createdAt
        creationFee
      }
    }
  `
  type Resp = { items: WearableItem[] }

  while (true) {
    const page = await graphQuery<Resp>(COLLECTIONS_POLYGON_SUBGRAPH_URL, WEARABLES_WINDOW_QUERY, {
      from: fromTs,
      to: toTs,
      first: PAGE_SIZE,
      skip
    })
    const itemsPage = page?.items || []
    if (itemsPage.length === 0) break

    for (const item of itemsPage) {
      const manaFee = weiToManaFloat(item.creationFee)
      if (manaFee > 0) {
        totalMana += manaFee
        totalItems += 1
      }
    }
    if (itemsPage.length < PAGE_SIZE) break
    skip += PAGE_SIZE
  }
  return { totalMana, totalItems }
}

async function calcWearableSubmissionFeeUSD_fromSubgraph(manaUsd: number): Promise<IncomeRow> {
  const latestCreatedAt = await fetchLatestItemCreatedAt()
  if (!latestCreatedAt) {
    return {
      name: 'Wearable Submission Fee',
      description:
        'Funds corresponding to the fee applied to every new Wearable submission to the Decentraland Marketplace (last 30 days, subgraph est.)',
      txCount: 0,
      manaTotal: 0,
      usdTotal: 0
    }
  }
  const toTs = latestCreatedAt
  const fromTs = toTs - SECS_30D
  const { totalMana, totalItems } = await fetchWearableFeesWindow(fromTs, toTs)
  const usdTotal = totalMana * manaUsd
  console.log('[WearableSubmissionFee]', fromTs, '->', toTs, 'items:', totalItems, 'mana:', totalMana, 'usd:', usdTotal)

  return {
    name: 'Wearable Submission Fee',
    description:
      'Funds corresponding to the fee applied to every new Wearable submission to the Decentraland Marketplace (last 30 days, subgraph est.)',
    txCount: totalItems,
    manaTotal: totalMana,
    usdTotal
  }
}




// ------------- EXPENSES

function tokenAmountToUsd(asset: string, amount: number, manaUsd: number): number {
  const sym = (asset || '').toUpperCase()
  if (!Number.isFinite(amount) || amount <= 0) return 0

  if (sym === 'MANA') return amount * manaUsd

  
  if (sym === 'USDC' || sym === 'USDT' || sym === 'DAI') return amount

  console.log('[DAO Comp] skipping unsupported asset', sym, 'amount', amount)
  return 0
}


async function calcWearableCuratorsCommitteePayoutUSD(
  startTs: number,
  endTs: number,
  manaUsd: number
): Promise<IncomeRow> {
  if (!ALCHEMY_ETH_URL && !ALCHEMY_POLYGON_URL) {
    console.warn('No Alchemy URL is set, Wearable Curators Committee Payout will be 0')
    return {
      name: 'Wearable Curators Committee Payout',
      description: 'Compensation paid from the DAO treasury to Wearable Curators Committee members (last 30 days)',
      txCount: 0,
      manaTotal: 0,
      usdTotal: 0
    }
  }

  const fromBlockNum = await findBlockAtOrBeforeTimestamp(startTs)
  const toBlockNum = await findBlockAtOrBeforeTimestamp(endTs)
  const fromBlockHex = intToHex(fromBlockNum)
  const toBlockHex = intToHex(toBlockNum)

  const allTransfers: AlchemyTransfer[] = []

  const fromBlockNumPolygon = await findPolygonBlockAtOrBeforeTimestamp(startTs)
  const toBlockNumPolygon = await findPolygonBlockAtOrBeforeTimestamp(endTs)
  const fromBlockHexPolygon = intToHex(fromBlockNumPolygon)
  const toBlockHexPolygon = intToHex(toBlockNumPolygon)

  
  for (const fromAddr of DAO_TREASURY_ETH) {
    for (const toAddr of CURATORS_PAYMENT_ADDRESSES) {
      console.log('[WCC Payout ETH] query', { fromAddr, toAddr })
      const params = [
        {
          fromBlock: fromBlockHex,
          toBlock: toBlockHex,
          fromAddress: fromAddr,
          toAddress: toAddr,
          category: ['external', 'erc20'],
          withMetadata: true,
          maxCount: '0x3e8'
        }
      ]

      try {
        const result = await rpc<{ transfers?: AlchemyTransfer[] }>(
          'alchemy_getAssetTransfers',
          params as unknown[]
        )
        if (result?.transfers?.length) {
          allTransfers.push(...result.transfers)
        }
      } catch (err: any) {
        console.error(
          '[WCC Payout ETH] alchemy_getAssetTransfers failed for',
          fromAddr,
          '->',
          toAddr,
          err?.message || String(err)
        )
      }
    }
  }

  for (const fromAddr of DAO_TREASURY_POLYGON) {
  for (const toAddr of CURATORS_PAYMENT_ADDRESSES) {
    console.log('[WCC Payout POLYGON] query', { fromAddr, toAddr })
    const params = [
      {
        fromBlock: fromBlockHexPolygon,
        toBlock: toBlockHexPolygon,
        fromAddress: fromAddr,
        toAddress: toAddr,
        category: ['external', 'erc20'],
        withMetadata: true,
        maxCount: '0x3e8'
      }
    ]

    try {
      const result = await rpcPolygon<{ transfers?: AlchemyTransfer[] }>(
        'alchemy_getAssetTransfers',
        params as unknown[]
      )
      if (result?.transfers?.length) {
        allTransfers.push(...result.transfers)
      }
    } catch (err: any) {
      console.error(
        '[WCC Payout POLYGON] alchemy_getAssetTransfers failed for',
        fromAddr,
        '->',
        toAddr,
        err?.message || String(err)
      )
    }
  }
}

  const seen = new Set<string>()
  let usdTotal = 0
  let manaTotal = 0

  for (const tr of allTransfers) {
    const key = tr.uniqueId || `${tr.hash}:${tr.asset}:${tr.value}`
    if (seen.has(key)) continue
    seen.add(key)

    const amount = Number(tr.value) || 0
    const asset = tr.asset || ''

    if (!amount || !asset) continue

    const usd = tokenAmountToUsd(asset, amount, manaUsd)
    usdTotal += usd

    if ((asset || '').toUpperCase() === 'MANA') {
      manaTotal += amount
    }
  }

  const txCount = seen.size

  console.log(
   '[Wearable Curators Committee Payout]',
    'txCount:',
    txCount,
    'manaTotal:',
    manaTotal,
    'usdTotal:',
    usdTotal
  )

  return {
    name: 'Wearable Curators Committee Payout',
    description: 'Compensation paid from the DAO treasury to Wearable Curators Committee members (last 30 days)',
    txCount,
    manaTotal,
    usdTotal
  }
}

//---- other expense 
async function calcOtherExpensesUSD(
  startTs: number,
  endTs: number,
  manaUsd: number
): Promise<IncomeRow> {
  
  if (!ALCHEMY_ETH_URL && !ALCHEMY_POLYGON_URL) {
    console.warn('No Alchemy URLs are set, Other expenses will be 0')
    return {
      name: 'Other',
      description:
        'Other expenses from the DAO treasuries not categorized under specific committees (last 30 days)',
      txCount: 0,
      manaTotal: 0,
      usdTotal: 0
    }
  }

  const allTransfers: AlchemyTransfer[] = []

  // ---- ETH ----
  if (ALCHEMY_ETH_URL) {
    const fromBlockNum = await findBlockAtOrBeforeTimestamp(startTs)
    const toBlockNum = await findBlockAtOrBeforeTimestamp(endTs)
    const fromBlockHex = intToHex(fromBlockNum)
    const toBlockHex = intToHex(toBlockNum)

    for (const fromAddr of DAO_TREASURY_ETH) {
      console.log('[Other ETH] query', { fromAddr })
      const params = [
        {
          fromBlock: fromBlockHex,
          toBlock: toBlockHex,
          fromAddress: fromAddr,
          
          category: ['external', 'erc20'],
          withMetadata: true,
          maxCount: '0x3e8'
        }
      ]

      try {
        const result = await rpc<{ transfers?: AlchemyTransfer[] }>(
          'alchemy_getAssetTransfers',
          params as unknown[]
        )
        if (result?.transfers?.length) {
          allTransfers.push(...result.transfers)
        }
      } catch (err: any) {
        console.error(
          '[Other ETH] alchemy_getAssetTransfers failed for',
          fromAddr,
          err?.message || String(err)
        )
      }
    }
  }

  // ---- POLYGON ----
  if (ALCHEMY_POLYGON_URL) {
    const fromBlockNumPolygon = await findPolygonBlockAtOrBeforeTimestamp(startTs)
    const toBlockNumPolygon = await findPolygonBlockAtOrBeforeTimestamp(endTs)
    const fromBlockHexPolygon = intToHex(fromBlockNumPolygon)
    const toBlockHexPolygon = intToHex(toBlockNumPolygon)

    for (const fromAddr of DAO_TREASURY_POLYGON) {
      console.log('[Other POLYGON] query', { fromAddr })
      const params = [
        {
          fromBlock: fromBlockHexPolygon,
          toBlock: toBlockHexPolygon,
          fromAddress: fromAddr,
          category: ['external', 'erc20'],
          withMetadata: true,
          maxCount: '0x3e8'
        }
      ]

      try {
        const result = await rpcPolygon<{ transfers?: AlchemyTransfer[] }>(
          'alchemy_getAssetTransfers',
          params as unknown[]
        )
        if (result?.transfers?.length) {
          allTransfers.push(...result.transfers)
        }
      } catch (err: any) {
        console.error(
          '[Other POLYGON] alchemy_getAssetTransfers failed for',
          fromAddr,
          err?.message || String(err)
        )
      }
    }
  }

  
  const seen = new Set<string>()
  let usdTotal = 0
  let manaTotal = 0
  let txCount = 0

  for (const tr of allTransfers) {
    const key = tr.uniqueId || `${tr.hash}:${tr.asset}:${tr.value}`
    if (seen.has(key)) continue
    seen.add(key)

    const amount = Number(tr.value) || 0
    const asset = tr.asset || ''
    const toAddrLower = (tr.to || '').toLowerCase()

    if (!amount || !asset || !toAddrLower) continue

  
    if (CURATORS_PAYMENT_SET.has(toAddrLower)) continue

    const usd = tokenAmountToUsd(asset, amount, manaUsd)
    if (!usd) continue

    usdTotal += usd
    if (asset.toUpperCase() === 'MANA') {
      manaTotal += amount
    }
    txCount += 1
  }

  console.log(
    '[Other Expenses]',
    'txCount:',
    txCount,
    'manaTotal:',
    manaTotal,
    'usdTotal:',
    usdTotal
  )

  return {
    name: 'Other',
    description:
      'Other expenses from the DAO treasuries not categorized under specific committees (last 30 days)',
    txCount,
    manaTotal,
    usdTotal
  }
}


/** Build ./public/api-v2.json income section */

/** Build ./public/api-v2.json income + expenses section */

async function getManaPriceUsdWithRetry(retries = 3, delayMs = 1000): Promise<number> {
  let lastErr: unknown
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(COINGECKO_MANA_PRICE_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const priceJson = (await res.json()) as any
      const price = Number(priceJson?.decentraland?.usd)
      if (!Number.isFinite(price) || price <= 0) throw new Error('Invalid price')
      return price
    } catch (err) {
      lastErr = err
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs))
      }
    }
  }
  throw new Error(
    `Failed to fetch MANA price after ${retries} attempts: ${String(
      (lastErr as any)?.message || lastErr
    )}`
  )
}

async function updateIncome(): Promise<void> {
  const OUT_PATH = path.join(process.cwd(), 'public', 'api-v2.json')
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })

  let base: any = {
    balances: [],
    income: { total: 0, previous: 0, details: [] },
    expenses: { total: 0, previous: 0, details: [] },
    funding: { total: 0 },
    committees: []
  }

  if (fs.existsSync(OUT_PATH)) {
    base = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'))
  }

  const now = new Date()


  // Last-30-days 
  const endDate = new Date() 
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  const startTs = Math.floor(startDate.getTime() / 1000)
  const endTs   = Math.floor(endDate.getTime() / 1000)

  const manaUsd = await getManaPriceUsdWithRetry()

  
  const [wearableRow, rentalsRow, polygonRow, landEstate, namesMintingRow] = await Promise.all([
    calcWearableSubmissionFeeUSD_fromSubgraph(manaUsd),
    calcRentalsIncomeUSD(startTs, endTs, manaUsd),
    calcPolygonPrimarySalesIncomeUSD(startTs, endTs, manaUsd),
    calcLandEstateMarketplaceFeesUSD(startTs, endTs, manaUsd),
    calcNamesMintingFeeFromLogsUSD(startTs, endTs, manaUsd)
  ])

  // 2) DAO Committee Compensation (expenses)
  const wearableCuratorComitteeRow = await calcWearableCuratorsCommitteePayoutUSD(startTs, endTs, manaUsd)
  const otherExpensesRow = await calcOtherExpensesUSD(startTs, endTs, manaUsd)

     

  // -------- INCOME --------
  const prevIncomeMap: Record<string, number> = {}
  if (Array.isArray(base?.income?.details)) {
    for (const d of base.income.details) {
      if (d && typeof d.name === 'string') prevIncomeMap[d.name] = Number(d.value) || 0
    }
  }

  const incomeDetails = [
    {
      name: 'Wearable Submission Fee',
      description:
        'Funds corresponding to the fee applied to every new Wearable submission to the Decentraland Marketplace',
      value: wearableRow.usdTotal || 0
    },
    {
      name: 'Names Minting Fee',
      description: 'Funds corresponding to the fee applied to Names minting',
      value: namesMintingRow.usdTotal || 0
    },
    {
      name: 'ESTATE DCL Marketplace Sales Fee',
      description:
        'Funds corresponding to the 2.5% fee applied to every ESTATE transaction (Minting or secondary)',
      value: landEstate.estate.usdTotal || 0
    },
    {
      name: 'LAND  DCL Marketplace Sales Fee',
      description:
        'Funds corresponding to the 2.5% fee applied to every LAND transaction (Minting or secondary)',
      value: landEstate.land.usdTotal || 0
    },
    {
      name: 'Wearables Minting Fee',
      description:
        'Funds corresponding to the 2.5% fee applied to Wearables minting on Polygon network via the Decentraland Marketplace',
      value: polygonRow.usdTotal || 0
    },
    {
      name: 'DAO Wallets Transactions',
      description:
        'Transactions between the DAO Treasury and the DAO Committee wallets (e.g. Transaction gas refunds)',
      value: prevIncomeMap['DAO Wallets Transactions'] || 0
    },
    {
      name: 'LAND Rentals Marketplace Fee',
      description:
        'Funds corresponding to the 2.5% fee applied to every LAND or ESTATE rental transaction',
      value: rentalsRow.usdTotal || 0
    },
    {
      name: 'NAME DCL Marketplace Sales Fee',
      description:
        'Funds corresponding to the 2.5% fee applied to every NAME transaction (Minting or secondary)',
      value: prevIncomeMap['NAME DCL Marketplace Sales Fee'] || 0
    }
  ]

    const previousIncome = Number(base?.income?.previous) || 0
    const totalIncome =
      typeof base?.income?.total === 'number'
        ? base.income.total
        : incomeDetails.reduce((acc, d) => acc + (Number(d.value) || 0), 0)


  // -------- EXPENSES --------
  const prevExpensesDetails: { name: string; description: string; value: number }[] =
    Array.isArray(base?.expenses?.details) ? base.expenses.details : []

  const getPrevExpense = (name: string) =>
    prevExpensesDetails.find((d) => d?.name === name) || null

  const daoPrev = getPrevExpense('DAO Committee Compensation')
  const wccPrev = getPrevExpense('Wearable Curators Committee Payout')
  const otherPrev = getPrevExpense('Other')

  const expenseDetails: { name: string; description: string; value: number }[] = []

  // 1) DAO Committee Compensation 
  expenseDetails.push({
  name: 'DAO Committee Compensation',
  description:
    daoPrev?.description ||
    'Deprecated committee. Kept for historical reasons, always 0.',
  value: 0
})

// 2) Wearable Curators Committee Payout 
if (wccPrev) {
  expenseDetails.push({
    name: 'Wearable Curators Committee Payout',
    description:
      wccPrev?.description ||
      'Compensation paid from the DAO treasury to Wearable Curators Committee members (last 30 days)',
    value: wearableCuratorComitteeRow.usdTotal || 0
  })
}

  // 3) Other 

  expenseDetails.push({
    name: 'Other',
    description:
      otherPrev?.description ||
      'Other expenses from the DAO treasuries not categorized under specific committees (last 30 days)',
    value: otherExpensesRow.usdTotal || 0
  })

  const previousExpenses = Number(base?.expenses?.previous) || 0
  const totalExpenses = expenseDetails.reduce((acc, d) => acc + (Number(d.value) || 0), 0)

  const out = {
    ...base,
    income: { total: totalIncome, previous: previousIncome, details: incomeDetails },
    expenses: { total: totalExpenses, previous: previousExpenses, details: expenseDetails }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2))
  console.log('[updateIncome] income & expenses updated in', OUT_PATH)
}


/** MAIN (one-shot) */
;(async () => {
  try {
    await updateIncome()
    
  } catch (err) {
    console.error('export-api-v2 failed:', err)
    process.exit(1)
  }
  process.exit(0)
})()
