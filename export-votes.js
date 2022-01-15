const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer')

async function main() {
    const votes = [];
    while(true) {
        let skip = votes.length
        const url = 'https://hub.snapshot.org/graphql';
        const query = `query {\n  votes (\n    first: 1000\n    skip: ${skip}\n   where: {\n      space_in: [\"snapshot.dcl.eth\"]\n      vp_gt: 1\n    }\n  ) {\n    voter\n    created\n    choice\n    proposal {\n      id\n      title\n    }\n    vp\n  }\n}`;

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
          {id: 'created', title: 'Created'},
          {id: 'choice', title: 'Choice'},
          {id: 'vp', title: 'VP'},
          {id: 'proposal_title', title: 'Proposal Title'},
          {id: 'proposal_id', title: 'Proposal Id'},
        ]
      });

    votes.forEach(vote => {
        vote.proposal_id = vote.proposal.id;
        vote.proposal_title = vote.proposal.title;
    })

    console.log(votes[0]);

    csvWriter.writeRecords(votes).then(()=> console.log('The CSV file was written successfully'));
}

main();
