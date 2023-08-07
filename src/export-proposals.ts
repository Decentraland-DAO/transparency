import { GovernanceProposal, SnapshotSpace, Symbol } from './interfaces/GovernanceProposal'
import { Proposal, ProposalParsed, ProposalVotes } from './interfaces/Proposal'
import {
  fetchGraphQLCondition,
  fetchURL,
  governanceUrl,
  reportToRollbarAndThrow,
  saveToCSV,
  saveToJSON,
  snapshotUrl
} from './utils'

async function main() {
  // Fetch Snapshot Proposals
  const url = snapshotUrl()
  const where = `space_in: ["${SnapshotSpace.DCL}"]`
  const proposals = await fetchGraphQLCondition<Proposal>(url, 'proposals', 'created', 'id', 'id scores_total strategies { params } scores_by_strategy votes created', where)

  const proposalVotes: ProposalVotes = {}
  proposals.forEach(p => proposalVotes[p.id] = p)

  const getVP = (p: Proposal, symbol: Symbol) => {
    const index = p.strategies.map(s => s.params.symbol).indexOf(symbol)
    if (index === -1) return 0
    return p.scores_by_strategy.reduce((total, choice) => total + choice[index], 0)
  }

  // Get Governance dApp Proposals
  const governanceProposals: GovernanceProposal[] = []
  while (true) {
    const skip = governanceProposals.length
    const url = `${governanceUrl()}/proposals?limit=100&offset=${skip}`
    const json = await fetchURL(url)

    if (!json.data.length) break
    governanceProposals.push(...json.data)
  }

  const data = governanceProposals.map(p => {
    const pv = proposalVotes[p.snapshot_id]
    const proposal: ProposalParsed = {
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
      scores_total: pv.scores_total,
      votes: pv.votes,
      manaVP: getVP(pv, Symbol.MANA) + getVP(pv, Symbol.WMANA),
      landVP: getVP(pv, Symbol.LAND) + getVP(pv, Symbol.ESTATE),
      namesVP: getVP(pv, Symbol.NAMES),
      delegatedVP: getVP(pv, Symbol.VP_DELEGATED),
      vesting_addresses: p.vesting_addresses,
      enacting_tx: p.enacting_tx
    }

    return proposal
  })

  console.log(data.length, 'proposals found.')

  saveToJSON('proposals.json', data)
  await saveToCSV('proposals.csv', data, [
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
    { id: 'votes', title: 'Votes' }
  ])
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))