import { SnapshotSpace } from './interfaces/GovernanceProposal'
import { Vote } from './interfaces/Vote'
import { errorToRollbar, fetchGraphQLCondition, parseVP, saveToCSV, saveToJSON, snapshotUrl, toISOString } from './utils'

export interface VotesParsed {
  voter: string
  created: string
  choice: number
  vp: number
  proposal_id: string
  proposal_title: string
  choice_text: string
  weight: number
  manaVP: number
  namesVP: number
  landVP: number
  delegatedVP: number
}

async function main() {
  // Fetch Snapshot Votes
  const url = snapshotUrl()
  const where = `space_in: ["${SnapshotSpace.DCL}"], vp_gt: 1`
  const votes = await fetchGraphQLCondition<Vote>(url, 'votes', 'created', 'id', 'id voter created choice proposal { id title choices scores_total } vp vp_by_strategy', where)

  const votesParsed: VotesParsed[] = votes.map(vote => {
    const vpSources = parseVP(vote.vp_by_strategy)
    return {
      voter: vote.voter,
      created: toISOString(vote.created),
      choice: vote.choice,
      vp: vote.vp,
      proposal_id: vote.proposal.id,
      proposal_title: vote.proposal.title,
      choice_text: vote.proposal.choices[vote.choice - 1],
      weight: vote.proposal.scores_total ? vote.vp / vote.proposal.scores_total * 100 : 0,
      manaVP: vpSources.manaVP,
      namesVP: vpSources.namesVP,
      landVP: vpSources.landVP,
      delegatedVP: vpSources.delegatedVP
    }
  })

  console.log(votesParsed.length, 'votes found.')
  saveToJSON('votes.json', votesParsed)
  await saveToCSV('votes.csv', votesParsed, [
    { id: 'voter', title: 'Member' },
    { id: 'proposal_id', title: 'Proposal ID' },
    { id: 'created', title: 'Created' },
    { id: 'proposal_title', title: 'Proposal Title' },
    { id: 'choice', title: 'Choice #' },
    { id: 'choice_text', title: 'Choice' },
    { id: 'weight', title: 'Vote Weight' },
    { id: 'vp', title: 'Total VP' },
    { id: 'manaVP', title: 'MANA VP' },
    { id: 'namesVP', title: 'Names VP' },
    { id: 'landVP', title: 'LAND VP' },
    { id: 'delegatedVP', title: 'Delegated VP' },
  ])
}

main().catch((error) => errorToRollbar(__filename, error))