import path from 'path'
import fs from 'fs'
// import fetch, { Response as FetchResponse } from 'node-fetch'
type FetchResponse = Response
/** CONFIG / CONSTANTS */
const DCL_SUBGRAPH_API_KEY = process.env.DCL_SUBGRAPH_API_KEY || 'b53c670e2e03f823f46ab1b2087835c6'

const RENTALS_SUBGRAPH_URL = 'https://subgraph.decentraland.org/rentals-ethereum-mainnet'
const MARKETPLACE_SUBGRAPH_URL = 'https://subgraph.decentraland.org/marketplace'
const COLLECTIONS_POLYGON_SUBGRAPH_URL = 'https://subgraph.decentraland.org/collections-matic-mainnet'

const DCL_RENTALS_FEE_PCT = 0.025
const PRIMARY_SALES_FEE_PCT = 0.025
const NAME_CONTRACT = '0x2a187453064356c898cae034eaed119e1663acb8'.toLowerCase()

const ALCHEMY_ETH_URL = process.env.ALCHEMY_ETH_URL || 'https://eth-mainnet.g.alchemy.com/v2/25n756T7F5Lfxjx34PSfX'
const NAME_REGISTERED_TOPIC = '0x570313dae523ecb48b1176a4b60272e5ea7ec637f5b2d09983cbc4bf25e7e9e3'
const NAME_MINT_PRICE_MANA = 100

const COINGECKO_MANA_PRICE_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=decentraland&vs_currencies=usd'

const SECS_30D = 30 * 24 * 60 * 60 // 30d

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

  const landFeeMana = landVolumeMana * 0.025
  const estateFeeMana = estateVolumeMana * 0.025

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

// mayor bloque con timestamp <= targetTs
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

/** Build ./public/api-v2.json income section */
// Reemplazá la función updateIncome completa por esta:
async function updateIncome(): Promise<void> {
  const OUT_PATH = path.join(process.cwd(), 'public', 'api-v2.json')
  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true })

  // 1) Cargar base actual (la que pegaste del api.json original)
  let base: any = { balances: [], income: { total: 0, previous: 0, details: [] }, expenses: { total: 0, previous: 0, details: [] }, funding: { total: 0 }, committees: [] }
  if (fs.existsSync(OUT_PATH)) {
    base = JSON.parse(fs.readFileSync(OUT_PATH, 'utf8'))
  }

  // 2) Ventana y precio MANA
  const now = new Date()
  const startTs = Math.floor((now.getTime() - 30 * 24 * 60 * 60 * 1000) / 1000)
  const endTs = Math.floor(now.getTime() / 1000)

  let manaUsd = 0
  try {
    const priceRes = await fetch(COINGECKO_MANA_PRICE_URL)
    const priceJson = await priceRes.json() as any
    manaUsd = Number(priceJson?.decentraland?.usd) || 0
  } catch (err: any) {
    console.error('failed to fetch MANA price:', err?.message || String(err))
  }

  // 3) Cálculos
  const wearableRow       = await calcWearableSubmissionFeeUSD_fromSubgraph(manaUsd)
  const rentalsRow        = await calcRentalsIncomeUSD(startTs, endTs, manaUsd)
  const polygonRow        = await calcPolygonPrimarySalesIncomeUSD(startTs, endTs, manaUsd)
  const landEstate        = await calcLandEstateMarketplaceFeesUSD(startTs, endTs, manaUsd)
  const namesMintingRow   = await calcNamesMintingFeeFromLogsUSD(startTs, endTs, manaUsd)

  // 4) Traer valores previos para las entradas que NO calculamos (con esos nombres exactos)
  const prevMap: Record<string, number> = {}
  if (Array.isArray(base?.income?.details)) {
    for (const d of base.income.details) {
      if (d && typeof d.name === 'string') prevMap[d.name] = Number(d.value) || 0
    }
  }

  // 5) Construir details con el ORDEN y DESCRIPCIONES EXACTAS del ejemplo
  const details = [
    {
      name: 'Wearable Submission Fee',
      description: 'Funds corresponding to the fee applied to every new Wearable submission to the Decentraland Marketplace',
      value: wearableRow.usdTotal || 0
    },
    {
      name: 'Names Minting Fee',
      description: 'Funds corresponding to the fee applied to Names minting',
      value: namesMintingRow.usdTotal || 0
    },
    {
      name: 'ESTATE DCL Marketplace Sales Fee',
      description: 'Funds corresponding to the 2.5% fee applied to every ESTATE transaction (Minting or secondary)',
      value: landEstate.estate.usdTotal || 0
    },
    {
      name: 'LAND  DCL Marketplace Sales Fee',
      description: 'Funds corresponding to the 2.5% fee applied to every LAND transaction (Minting or secondary)',
      value: landEstate.land.usdTotal || 0
    },
    {
      name: 'Wearables Minting Fee',
      description: 'Funds corresponding to the 2.5% fee applied to Wearables minting on Polygon network via the Decentraland Marketplace',
      value: polygonRow.usdTotal || 0
    },
    {
      name: 'DAO Wallets Transactions',
      description: 'Transactions between the DAO Treasury and the DAO Committee wallets (e.g. Transaction gas refunds)',
      value: prevMap['DAO Wallets Transactions'] || 0
    },
    {
      name: 'LAND Rentals Marketplace Fee',
      description: 'Funds corresponding to the 2.5% fee applied to every LAND or ESTATE rental transaction',
      value: rentalsRow.usdTotal || 0
    },
    {
      name: 'NAME DCL Marketplace Sales Fee',
      description: 'Funds corresponding to the 2.5% fee applied to every NAME transaction (Minting or secondary)',
      value: prevMap['NAME DCL Marketplace Sales Fee'] || 0
    }
  ]

  // 6) Mantener previous; recalcular total
  const previous = Number(base?.income?.previous) || 0
  const total = details.reduce((acc, d) => acc + (Number(d.value) || 0), 0)

  
  const out = {
    ...base,
    income: { total, previous, details }
  }

  fs.writeFileSync(OUT_PATH, JSON.stringify(out, null, 2))
  console.log('[updateIncome] income actualizado en', OUT_PATH)
}


/** MAIN (one-shot) */
;(async () => {
  try {
    await updateIncome()
    // logs de cada cálculo ya salen por consola (como en tu versión server)
  } catch (err) {
    console.error('export-api-v2 failed:', err)
    process.exit(1)
  }
  process.exit(0)
})()
