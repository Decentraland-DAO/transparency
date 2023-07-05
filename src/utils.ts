import { Tokens } from './entities/Tokens'
import { DataByNetworks, Network, NetworkName } from './entities/Networks'
import BigNumber from 'bignumber.js'
import { createObjectCsvWriter } from 'csv-writer'
import { ObjectStringifierHeader } from 'csv-writer/src/lib/record'
import { existsSync, mkdirSync, writeFileSync } from 'fs'
import 'isomorphic-fetch'
import { Tags } from './entities/Tags'
import { TransactionParsed } from './export-transactions'
import { KPI } from './interfaces/KPIs'
import { Delegation, DelegationInfo, ReceivedDelegations } from './interfaces/Members'
import { TransactionDetails } from './interfaces/Transactions/Transactions'
import { TransferType } from './interfaces/Transactions/Transfers'
import { CovalentResponse } from './interfaces/Covalent'
import { ethers } from 'ethers'
import { TokenPriceAPIData } from './interfaces/Transactions/TokenPrices'
import Path from 'path'
import { rollbar } from './rollbar'

require('dotenv').config()

export const ROLLBAR_ACCESS_TOKEN = process.env.ROLLBAR_ACCESS_TOKEN
export const COVALENT_API_KEY = process.env.COVALENTHQ_API_KEY
export const INFURA_URL = process.env.INFURA_URL
export const DECENTRALAND_DATA_URL = process.env.DECENTRALAND_DATA_URL
export const MEMBER_VOTE_VP_THRESHOLD = 5
const COVALENT_RATE_LIMIT = 12000

export function sum(array: number[]) {
  return array.reduce((prev, curr) => prev + curr, 0)
}

export function avg(array: number[]) {
  return sum(array) / array.length
}

export function median(array: number[]) {
  if (array.length === 0) throw new Error('Median: no inputs')

  const sortedArray = [...array].sort((a, b) => a - b)
  const half = Math.floor(sortedArray.length / 2)

  if (sortedArray.length % 2) {
    return sortedArray[half]
  }

  return (sortedArray[half - 1] + sortedArray[half]) / 2.0
}

export function getChecksumAddress(address: string) {
  return ethers.utils.getAddress(address.toLowerCase())
}

export function isSameAddress(address1: string, address2: string) {
  return getChecksumAddress(address1) === getChecksumAddress(address2)
}

export function parseNumber(n: number, decimals: number) {
  return new BigNumber(n).dividedBy(10 ** decimals).toNumber()
}

export function dayToMillisec(dayAmount: number) {
  return dayAmount * 24 * 60 * 60 * 1000
}

export function getMonthsBetweenDates(startDate: Date, endDate: Date) {
  try {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear()
    const monthDiff = endDate.getMonth() - startDate.getMonth()
    return yearDiff * 12 + monthDiff
  } catch (error) {
    throw new Error(`startDate: ${startDate}, endDate: ${endDate}. ${error}`)
  }
}

export function toISOString(seconds: number) {
  return seconds ? new Date(seconds * 1000).toISOString() : undefined
}

export function baseCovalentUrl(network: Network) {
  return `https://api.covalenthq.com/v1/${network.id}`
}

export function collectionsUrl(network = 'matic') {
  return `https://api.thegraph.com/subgraphs/name/decentraland/collections-${network}-mainnet`
}

export function snapshotUrl() {
  return 'https://hub.snapshot.org/graphql'
}

export function governanceUrl() {
  return 'https://governance.decentraland.org/api'
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function fetchURL(url: string, options?: RequestInit, retry?: number): Promise<any> {
  retry = retry === undefined ? 3 : retry
  try {
    const res = await fetch(url, options)
    return await res.json()
  } catch (err) {
    if (retry <= 0) {
      console.error('Fetch Error')
      throw err
    }
    await delay(2000)
    return await fetchURL(url, options, retry - 1)
  }
}

export async function fetchCovalentURL<T>(url: string, pageSize = 10000) {
  let hasNext = true
  const result: T[] = []
  let page = 0
  let retries = 15

  while (hasNext) {
    const response: CovalentResponse<T> = await fetchURL(url + (pageSize === 0 ? '' : `&page-size=${pageSize}&page-number=${page}`), {}, 10)

    if (response.error) {
      if (retries > 0) {
        retries--
        console.log(`Retrying ${url}`)
        await delay(COVALENT_RATE_LIMIT)
        continue
      }
      throw Error(`Failed to fetch ${url} - message: ${response.error_message} - code: ${response.error_code}`)
    }

    result.push(...(response.data.items || response.data))
    page++
    hasNext = response.data.pagination && response.data.pagination.has_more
  }

  return result
}

function removeDuplicates<T>(data: T[], dataKey: string) {
  const dataMap: Record<string, T> = {}
  for (const item of data) {
    dataMap[item[dataKey]] = item
  }

  return Object.values(dataMap)
}

export async function fetchGraphQLCondition<T>(url: string, collection: string, fieldNameCondition: string, dataKey: string, fields: string, where?: string): Promise<T[]> {
  let hasNext = true
  let lastField = 0
  const FIRST = 1000
  const query = `
    query get($lastField: Int!) {
      ${collection} (first: ${FIRST}, where: { ${fieldNameCondition}_gt: $lastField${!!where ? `, ${where}` : ''} }, orderBy: "${fieldNameCondition}", orderDirection: asc) {
        ${fields}
      }
    }
  `

  const elements: T[] = []
  while (hasNext) {
    const json = await fetchURL(url, {
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ 'query': query, 'variables': { lastField } }),
      method: 'POST'
    }, 5)

    if (json.errors) {
      throw Error('GraphQL Condition Fetch Error ' + JSON.stringify(json.errors))
    }

    const currentElements = (json?.data?.[collection] || []) as T[]
    elements.push(...currentElements)

    if (currentElements.length < FIRST) {
      hasNext = false
    } else {
      lastField = Number(elements[elements.length - 1][fieldNameCondition])
    }
  }

  return removeDuplicates(elements, dataKey)
}

export async function fetchDelegations(members: string[], space: string): Promise<DelegationInfo> {
  const snapshotQueryUrl = 'https://api.thegraph.com/subgraphs/name/snapshot-labs/snapshot'

  const where = (members: string[], memberIn: 'delegator' | 'delegate') => `space_in: ["", "${space}"], ${memberIn}_in: ${JSON.stringify(members)}`

  const unresolvedGivenDelegations = fetchGraphQLCondition<Delegation>(snapshotQueryUrl, 'delegations', 'timestamp', 'id', 'id delegator delegate', where(members, 'delegator'))
  const unresolvedReceivedDelegations = fetchGraphQLCondition<Delegation>(snapshotQueryUrl, 'delegations', 'timestamp', 'id', 'id delegator delegate', where(members, 'delegate'))

  const [snapshotGivenDelegations, snapshotReceivedDelegations] = await Promise.all([unresolvedGivenDelegations, unresolvedReceivedDelegations])

  const receivedDelegationsMap = snapshotReceivedDelegations.reduce((accumulator, delegation) => {
    const { delegator, delegate } = delegation
    if (!accumulator[delegate]) {
      accumulator[delegate] = []
    }
    accumulator[delegate].push(delegator)
    return accumulator
  }, {} as Record<string, string[]>)

  const receivedDelegations: ReceivedDelegations[] = Object.entries(receivedDelegationsMap).map(([delegate, delegators]) => ({
    delegate,
    delegators
  }))

  return {
    givenDelegations: snapshotGivenDelegations,
    receivedDelegations
  }
}

export function saveToFile(name: string, data: string) {
  if (!existsSync('./public')) mkdirSync('./public')
  const path = './public/' + name
  writeFileSync(path, data, 'utf8')
}

export function saveToJSON(name: string, data: any) {
  saveToFile(name, JSON.stringify(data))
  console.log('The JSON file has been saved.')
}

export async function saveToCSV(name: string, data: any, header: ObjectStringifierHeader) {
  if (!existsSync('./public')) mkdirSync('./public')
  const path = './public/' + name
  const csvWriter = createObjectCsvWriter({ path, header })
  await csvWriter.writeRecords(data)
  console.log('The CSV file has been saved.')
}

export function flattenArray<Type>(arr: Type[][]): Type[] {
  return arr.reduce((acc, val) => acc.concat(val), [])
}

export function splitArray<Type>(array: Type[], chunkSize: number) {
  return Array(Math.ceil(array.length / chunkSize)).fill(null).map(function(_, i) {
    return array.slice(i * chunkSize, i * chunkSize + chunkSize)
  })
}

export function setTransactionTag(tx: TransactionParsed) {
  const interactedWith = tx.interactedWith.toLowerCase()
  let tag = Tags.get(interactedWith)

  if (tx.type === TransferType.IN) {
    tag = Tags.get(tx.from) || tag
  } else if (tx.type === TransferType.OUT) {
    tag = Tags.getCurator(tx.to) || Tags.get(tx.to) || tag
  }

  if (tag) {
    tx.tag = tag
  }
}

export function getTransactionsPerTag(transactions: TransactionParsed[]) {
  const group: Record<string, TransactionDetails> = {}

  for (const tx of transactions) {
    const result = group[tx.tag]
    if (result) {
      group[tx.tag] = {
        count: result.count + 1,
        total: result.total.plus(tx.quote)
      }
    } else {
      group[tx.tag] = {
        count: 1,
        total: new BigNumber(tx.quote)
      }
    }
  }

  return group
}

export function parseKPIs(kpis: KPI[]) {
  const result: any[] = []

  for (const kpi of kpis) {
    result.push(kpi.header)
    for (const row of kpi.rows) {
      result.push(row)
    }
    result.push([])
  }

  return result
}

export type LatestBlocks = DataByNetworks<Record<string, { block: number, date: string }>>

export function getLatestBlockByToken(txs: TransactionParsed[]): LatestBlocks {
  const latestBlocks: LatestBlocks = {
    [NetworkName.ETHEREUM]: {},
    [NetworkName.POLYGON]: {}
  }

  for (const network of Object.values(NetworkName)) {
    for (const tokenAddress of Tokens.getAddresses(network)) {
      const latestBlock = txs
        .filter(tx => tx.network === network && tx.contract.toLowerCase() === tokenAddress)
        .map(tx => ({ block: tx.block, date: tx.date.split('T')[0] }))
        .sort((a, b) => b.block - a.block)[0]

      if (latestBlock) {
        latestBlocks[network][tokenAddress] = latestBlock
      }
    }
  }

  return latestBlocks
}

export function printableLatestBlocks(latestBlocks: LatestBlocks) {
  return Object.entries(latestBlocks).reduce((acc, [network, blocks]) => {
    for (const [tokenAddress, latestBlock] of Object.entries(blocks)) {
      acc[network] = acc[network] || {}
      acc[network][Tokens.get(network as NetworkName, tokenAddress).symbol] = latestBlock
    }
    return acc
  }, {} as LatestBlocks)
}

export async function getTokenPriceInfo(tokenAddress: string, network: Network, from: Date, to: Date) {
  const fromString = from.toISOString().split('T')[0]
  const toString = to.toISOString().split('T')[0]
  const url = `https://api.covalenthq.com/v1/pricing/historical_by_addresses_v2/${network.id}/USD/${tokenAddress}/?quote-currency=USD&format=JSON&from=${fromString}&to=${toString}&key=${COVALENT_API_KEY}`
  return fetchCovalentURL<TokenPriceAPIData>(url, 10000)
}

export function getPreviousDate(base: Date, daysAmount: number) {
  return new Date(new Date().setDate(base.getDate() - daysAmount))
}

export function getFileName(filename: string) {
  return Path.basename(filename)
}

export function reportToRollbar(errorMsg: string, error?: any) {
  if (ROLLBAR_ACCESS_TOKEN) {
    rollbar.error(errorMsg, error)
  } else {
    console.log('Rollbar access token not found.')
  }
  console.error(errorMsg, error)
}

export function reportToRollbarAndThrow(filename: string, error: any) {
  const errorMsg = `Error running the script ${getFileName(filename)}`
  reportToRollbar(errorMsg, error)
  throw new Error(error)
}