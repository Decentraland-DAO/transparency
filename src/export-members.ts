import snapshot from '@snapshot-labs/snapshot.js'
import Networks from './entities/Networks'
import { SnapshotSpace } from './interfaces/GovernanceProposal'
import { MemberInfo, STRATEGIES, Vote } from './interfaces/Members'
import { fetchGraphQL, flattenArray, parseVP, saveToCSV, saveToJSON, splitArray } from './utils'

const MAX_RETRIES = 20

require('dotenv').config()

const space = SnapshotSpace.DCL
const network = Networks.ETHEREUM.id.toString()
const blockNumber = 'latest'

async function getMembersInfo(addresses: string[], jobId: number) {
  console.log('Started job:', jobId)
  let snapshotScores: { [x: string]: number }[] = []
  let retries = MAX_RETRIES
  do {
    try {
      snapshotScores = await snapshot.utils.getScores(space, STRATEGIES, network, addresses, blockNumber)
    } catch (e) {
      retries -= 1
      console.log('Error', e)
      console.log(`Job: ${jobId} - Retrying score fetch. Retries left ${retries}...`)
    }
  } while (snapshotScores.length === 0 && retries > 0)

  const info: MemberInfo[] = []

  for (const address of addresses) {
    const scores = [0, 0, 0, 0, 0, 0]

    for (const idx in snapshotScores) {
      scores[idx] = snapshotScores[idx][address] || 0
    }

    info.push({
      address,
      avatar: `https://wearable-preview.decentraland.org/?profile=${address}`,
      ...parseVP(scores)
    })
  }

  console.log(`Job: ${jobId} - Fetched: ${info.length}`)
  return info
}

async function main() {
  // Fetch Snapshot Votes
  const url = 'https://hub.snapshot.org/graphql'
  const where = `space_in: ["${space}"], vp_gt: 10`
  const votes = await fetchGraphQL<Vote>(url, 'votes', where, 'created', 'voter', 20000)

  const members = new Set(votes.map(v => v.voter)) // Unique addresses
  console.log('Total Members:', members.size)

  const dividedAddresses = splitArray(Array.from(members), 2000)
  const info = flattenArray(await Promise.all(dividedAddresses.map(getMembersInfo)))

  saveToJSON('members.json', info)
  saveToCSV('members.csv', info, [
    { id: 'address', title: 'Member' },
    { id: 'totalVP', title: 'Total VP' },
    { id: 'manaVP', title: 'MANA VP' },
    { id: 'landVP', title: 'LAND VP' },
    { id: 'namesVP', title: 'NAMES VP' },
    { id: 'delegatedVP', title: 'Delegated VP' },
    { id: 'avatar', title: 'Avatar Preview' }
  ])
}

main()