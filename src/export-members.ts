import snapshot from '@snapshot-labs/snapshot.js'
import { STRATEGIES, Vote } from './interfaces/Members'
import { fetchGraphQL, flattenArray, saveToCSV, saveToJSON, splitArray } from './utils'
require('dotenv').config()

interface MemberInfo {
  address: string
  totalVP: number
  manaVP: number
  landVP: number
  namesVP: number
  delegatedVP: number
}

const space = 'snapshot.dcl.eth'

const network = '1'
const blockNumber = 'latest'

async function getMembersInfo(addresses: string[], jobId: number) {
  console.log('Started job:', jobId)
  let snapshotScores: { [x: string]: number }[] = []

  do {
    try {
      snapshotScores = await snapshot.utils.getScores(space, STRATEGIES, network, addresses, blockNumber)
    } catch (e) {
      console.log(`Job: ${jobId} - retrying score fetch...`)
    }
  } while (snapshotScores.length === 0)

  const info: MemberInfo[] = []

  for (const address of addresses) {
    let scores = [0, 0, 0, 0, 0, 0]

    for (const idx in snapshotScores) {
      scores[idx] = snapshotScores[idx][address] || 0
    }

    info.push({
      address,
      totalVP: scores.reduce((a, b) => a + b),
      manaVP: scores[0] + scores[1],
      landVP: scores[2] + scores[3],
      namesVP: scores[4],
      delegatedVP: scores[5],
    })
  }

  console.log(`Job: ${jobId} - Fetched: ${info.length}`)
  return info
}

async function main() {
  // Fetch Snapshot Votes
  const url = 'https://hub.snapshot.org/graphql'
  const where = 'space_in: ["snapshot.dcl.eth"], vp_gt: 10'
  const votes: Vote[] = await fetchGraphQL(url, 'votes', where, 'created', 'voter')

  const members = new Set(votes.map(v => v.voter)) // Unique addresses
  console.log("Total Members:", members.size)

  const dividedAddresses = splitArray(Array.from(members), 2000)
  const info = flattenArray(await Promise.all(dividedAddresses.map(getMembersInfo)))

  saveToJSON('members.json', info)
  saveToCSV('members.csv', info, [
    { id: 'address', title: 'Member' },
    { id: 'dclName', title: 'DCL Name' },
    { id: 'ensName', title: 'ENS Name' },
    { id: 'totalVP', title: 'Total VP' },
    { id: 'manaVP', title: 'MANA VP' },
    { id: 'landVP', title: 'LAND VP' },
    { id: 'namesVP', title: 'NAMES VP' },
    { id: 'delegatedVP', title: 'Delegated VP' },
  ])
}

main()