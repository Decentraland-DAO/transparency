import { SnapshotSpace } from './interfaces/GovernanceProposal'
import { Vote } from './interfaces/Vote'
import { fetchGraphQL, saveToCSV, saveToJSON, snapshotUrl } from './utils'

export interface VotesParsed {
  voter: string
  created: string
  choice: number
  vp: number
  proposal_id: string
  proposal_title: string
  choice_text: string
  weight: number
}

async function main() {
  // Fetch Snapshot Votes
  const url = snapshotUrl()
  const where = `space_in: ["${SnapshotSpace.DCL}"], vp_gt: 1`
  const votes: Vote[] = await fetchGraphQL(url, 'votes', where, 'created',
    'voter created choice proposal { id title choices scores_total } vp'
  )

  const votesParsed: VotesParsed[] = votes.map(vote => ({
    voter: vote.voter,
    created: new Date(vote.created * 1000).toISOString(),
    choice: vote.choice,
    vp: vote.vp,
    proposal_id: vote.proposal.id,
    proposal_title: vote.proposal.title,
    choice_text: vote.proposal.choices[vote.choice - 1],
    weight: vote.proposal.scores_total ? vote.vp / vote.proposal.scores_total * 100 : 0,
  }))

  console.log(votesParsed.length, 'votes found.')
  saveToJSON('votes.json', votesParsed)
  saveToCSV('votes.csv', votesParsed, [
    { id: 'voter', title: 'Member' },
    { id: 'proposal_id', title: 'Proposal ID' },
    { id: 'created', title: 'Created' },
    { id: 'proposal_title', title: 'Proposal Title' },
    { id: 'choice', title: 'Choice #' },
    { id: 'choice_text', title: 'Choice' },
    { id: 'vp', title: 'VP' },
    { id: 'weight', title: 'Vote Weight' },
  ])
}

main()
