import { fetchGraphQL, saveToCSV, saveToJSON } from "./utils";

async function main() {
  // Fetch Snapshot Votes
  const url = 'https://hub.snapshot.org/graphql';
  const where = 'space_in: ["snapshot.dcl.eth"], vp_gt: 10';
  let votes = await fetchGraphQL(url, 'votes', where, 'created',
    'voter created choice proposal { id title choices scores_total } vp'
  );

  votes = votes.map(vote => ({
    'voter': vote.voter,
    'created': new Date(vote.created * 1000).toISOString(),
    'choice': vote.choice,
    'vp': vote.vp,
    'proposal_id': vote.proposal.id,
    'proposal_title': vote.proposal.title,
    'choice_text': vote.proposal.choices[vote.choice - 1],
    'weight': vote.proposal.scores_total ? vote.vp / vote.proposal.scores_total * 100 : 0,
  }));

  console.log(votes.length, 'votes found.');
  saveToJSON('votes.json', votes);
  saveToCSV('votes.csv', votes, [
    { id: 'voter', title: 'Member' },
    { id: 'proposal_id', title: 'Proposal ID' },
    { id: 'created', title: 'Created' },
    { id: 'proposal_title', title: 'Proposal Title' },
    { id: 'choice', title: 'Choice #' },
    { id: 'choice_text', title: 'Choice' },
    { id: 'vp', title: 'VP' },
    { id: 'weight', title: 'Vote Weight' },
  ]);
}

main();
