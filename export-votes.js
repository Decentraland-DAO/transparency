const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer')

async function main() {
    // Fetch all snapshot proposals



    const votes = [];
    while(true) {
        let skip = votes.length
        const url = 'https://hub.snapshot.org/graphql';
        const query = `query {\n  votes (\n    first: 1000\n    skip: ${skip}\n   where: {\n      space_in: [\"snapshot.dcl.eth\"]\n      vp_gt: 1\n    }\n  ) {\n    voter\n    created\n    choice\n    proposal {\n      id\n      title\n   choices\n   scores_total\n  }\n    vp\n  }\n}`;

        const res = await fetch(
            url,
            {
                headers: {
                'content-type': 'application/json'
                },
                body: JSON.stringify({"query": query, "variables": null}),
                method: 'POST'
            }
        );
        const json = await res.json();

        if (!json.data.votes.length) break;
        votes.push(...json.data.votes);
    }

    console.log(votes.length);

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'votes.csv',
        header: [
          {id: 'voter', title: 'Member'},
          {id: 'proposal_id', title: 'Proposal ID'},
          {id: 'created', title: 'Created'},
          {id: 'proposal_title', title: 'Proposal Title'},
          {id: 'choice', title: 'Choice #'},
          {id: 'choice_text', title: 'Choice'},
          {id: 'vp', title: 'VP'},
          {id: 'weight', title: 'Vote Weight'},
        ]
      });

    votes.forEach(vote => {
        vote.proposal_id = vote.proposal.id;
        vote.proposal_title = vote.proposal.title;
        vote.choice_text = vote.proposal.choices[vote.choice-1];
        vote.weight = vote.proposal.scores_total ? parseInt(vote.vp / vote.proposal.scores_total * 100): 0;
    })

    csvWriter.writeRecords(votes).then(()=> console.log('The CSV file was written successfully'));
}

main();
