import { fetchGraphQL, fetchURL, saveToCSV, saveToJSON } from "./utils"

export type Proposal = {
  id: string
  snapshot_id: string
  user: string
  type: string
  title: string
  start_at: string
  finish_at: string
  required_to_pass: number
  status: string
  configuration: any
  discourse_topic_id: number
  scores_total: number
  votes: number
  manaVP: number
  landVP: number
  namesVP: number
  delegatedVP: number
  vesting_address: string | null
}

async function main() {
  // Fetch Snapshot Proposals
  const url = 'https://hub.snapshot.org/graphql'
  const where = 'space_in: ["snapshot.dcl.eth"]'
  let proposals = await fetchGraphQL(url, 'proposals', where, 'created',
    'id scores_total strategies { params } scores_by_strategy votes'
  )

  const proposalVotes = {}
  proposals.forEach(p => proposalVotes[p.id] = p)

  const getVP = (p, symbol: string) => {
    let index = p.strategies.map(s => s.params.symbol).indexOf(symbol)
    if (index == -1) return 0
    return parseInt(p.scores_by_strategy.reduce((total, choice) => total + choice[index], 0))
  }

  // Get Gobernance dApp Proposals
  proposals = []
  while (true) {
    let skip = proposals.length
    const url = `https://governance.decentraland.org/api/proposals?limit=100000&offset=${skip}`
    const json = await fetchURL(url)

    if (!json.data.length) break
    proposals.push(...json.data)
  }

  const data: Proposal[] = proposals.map(p => {
    const pv = proposalVotes[p.snapshot_id]
    const proposal: Proposal = {
      id: p.id,
      snapshot_id: p.snapshot_id,
      user: p.user,
      type: p.type,
      title: p.title,
      start_at: p.start_at,
      finish_at: p.finish_at,
      required_to_pass: p.required_to_pass,
      status: p.status,
      configuration: p.configuration,
      discourse_topic_id: p.discourse_topic_id,
      scores_total: parseInt(pv.scores_total),
      votes: pv.votes,
      manaVP: getVP(pv, "MANA") + getVP(pv, "WMANA"),
      landVP: getVP(pv, "LAND") + getVP(pv, "ESTATE"),
      namesVP: getVP(pv, "NAMES"),
      delegatedVP: getVP(pv, "VP (delegated)"),
      vesting_address: p.vesting_address,
    }

    return proposal
  })

  console.log(data.length, 'proposals found.')

  saveToJSON('proposals.json', data)
  saveToCSV('proposals.csv', data, [
    { id: 'id', title: 'Proposal ID' },
    { id: 'snapshot_id', title: 'Snapshot ID' },
    { id: 'user', title: 'Author' },

    { id: 'type', title: 'Type' },
    { id: 'title', title: 'Title' },
    { id: 'start_at', title: 'Started' },
    { id: 'finish_at', title: 'Ended' },
    { id: 'required_to_pass', title: 'Threshold' },
    { id: 'status', title: 'Status' },

    { id: 'discourse_topic_id', title: 'Forum Topic' },

    { id: 'scores_total', title: 'Total VP' },
    { id: 'manaVP', title: 'MANA VP' },
    { id: 'landVP', title: 'LAND VP' },
    { id: 'namesVP', title: 'NAMES VP' },
    { id: 'delegatedVP', title: 'DELEGATED VP' },
    { id: 'votes', title: 'Votes' },
  ])
}

main()
