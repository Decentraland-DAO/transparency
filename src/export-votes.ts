import { SnapshotSpace } from './interfaces/GovernanceProposal'
import { Vote } from './interfaces/Vote'
import {
  fetchGraphQLCondition,
  MEMBER_VOTE_VP_THRESHOLD,
  reportToRollbarAndThrow,
  saveToCSV,
  saveToJSON,
  snapshotUrl,
  toISOString
} from './utils'
import { parseVP } from './vp-utils'
import { MemberVP } from './interfaces/Members'

require('dotenv').config()

const SNAPSHOT_API_KEY = process.env.SNAPSHOT_API_KEY

export type VotesParsed = {
  voter: string
  created: string
  choice: number
  vp: number
  snapshot_id: string
  proposal_title: string
  choice_text: string
  weight: number
} & Omit<MemberVP, 'totalVP'>

async function main() {
  // Fetch Snapshot Votes
  const votes = await fetchGraphQLCondition<Vote>({
    url: snapshotUrl(), 
    collection: 'votes', 
    fieldNameCondition: 'created', 
    dataKey: 'id', 
    fields: 'id voter created choice proposal { id title choices scores_total } vp vp_by_strategy', 
    where: `space_in: ["${SnapshotSpace.DCL}"], vp_gt: ${MEMBER_VOTE_VP_THRESHOLD}`,
    apiKey: SNAPSHOT_API_KEY
  })

  const votesParsed: VotesParsed[] = votes.map(vote => {
    const vpSources = parseVP(vote.vp_by_strategy)
    return {
      voter: vote.voter,
      created: toISOString(vote.created),
      choice: vote.choice,
      vp: vote.vp,
      snapshot_id: vote.proposal.id,
      proposal_title: vote.proposal.title,
      choice_text: vote.proposal.choices[vote.choice - 1],
      weight: vote.proposal.scores_total ? vote.vp / vote.proposal.scores_total * 100 : 0,
      manaVP: vpSources.manaVP,
      namesVP: vpSources.namesVP,
      landVP: vpSources.landVP,
      estateVP: vpSources.estateVP,
      delegatedVP: vpSources.delegatedVP,
      l1WearablesVP: vpSources.l1WearablesVP,
      rentalVP: vpSources.rentalVP
    }
  })

  console.log(votesParsed.length, 'votes found.')
  saveToJSON('votes.json', votesParsed)
  await saveToCSV('votes.csv', votesParsed, [
    { id: 'voter', title: 'Member' },
    { id: 'snapshot_id', title: 'Snapshot ID' },
    { id: 'created', title: 'Created' },
    { id: 'proposal_title', title: 'Proposal Title' },
    { id: 'choice', title: 'Choice #' },
    { id: 'choice_text', title: 'Choice' },
    { id: 'weight', title: 'Vote Weight' },
    { id: 'vp', title: 'Total VP' },
    { id: 'manaVP', title: 'MANA VP' },
    { id: 'namesVP', title: 'Names VP' },
    { id: 'landVP', title: 'LAND VP' },
    { id: 'estateVP', title: 'ESTATE VP' },
    { id: 'delegatedVP', title: 'Delegated VP' },
    { id: 'l1WearablesVP', title: 'L1 Wearables VP' },
    { id: 'rentalVP', title: 'Rental VP' }
  ])
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))