import snapshot from '@snapshot-labs/snapshot.js'
import { STRATEGIES, Vote } from './interfaces/Members'
import { fetchGraphQL, saveToCSV, saveToJSON } from './utils'
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

async function main() {
  // Fetch Snapshot Votes
  const url = 'https://hub.snapshot.org/graphql'
  const where = 'space_in: ["snapshot.dcl.eth"], vp_gt: 10'
  const votes: Vote[] = await fetchGraphQL(url, 'votes', where, 'created', 'voter')

  const allVoters = votes.map(v => v.voter)
  const members = allVoters.filter((elem, pos) => allVoters.indexOf(elem) == pos)
  console.log("Total Members:", members.length)

  const info: MemberInfo[] = []
  let incompleted: string[] = []
  let current: string[]

  current = members

  do {
    incompleted = []

    for (const address of current) {
      let scores = [0, 0, 0, 0, 0, 0]
      try {
        const snapshotScores = await snapshot.utils.getScores(space, STRATEGIES, network, [address], blockNumber)
        scores = snapshotScores.map(score => parseInt(score[address] || 0))
      } catch (e) {
        incompleted.push(address)
      }

      info.push({
        address,
        totalVP: scores.reduce((a, b) => a + b),
        manaVP: scores[0] + scores[1],
        landVP: scores[2] + scores[3],
        namesVP: scores[4],
        delegatedVP: scores[5],
      })
      console.log(info.length, members.length, info.length / members.length * 100);
    }

    console.log(`Fetch members info to retry: ${incompleted.length}`)
    current = [...incompleted]

  } while (incompleted.length !== 0)

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