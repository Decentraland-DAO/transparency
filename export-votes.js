const fs = require('fs');
const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer');

async function main() {
    const votes = [];
    while(true) {
        let skip = votes.length
        const url = 'https://hub.snapshot.org/graphql';
        const query = `query {\n  votes (\n    first: 1000\n    skip: ${skip}\n   where: {\n      space_in: [\"snapshot.dcl.eth\"]\n      vp_gt: 10\n    }\n  ) {\n    voter\n    created\n    choice\n    proposal {\n      id\n      title\n   choices\n   scores_total\n  }\n    vp\n  }\n}`;

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

    console.log(votes.length, 'votes found.');

    votes.forEach(v => {
        v.created = new Date(v.created * 1000).toISOString();
    });

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'public/votes.csv',
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

    const data = votes.map(vote => {
        return {
            'voter': vote.voter,
            'created': vote.created,
            'choice': vote.choice,
            'vp': vote.vp,

            'proposal_id': vote.proposal.id,
            'proposal_title': vote.proposal.title,
            'choice_text': vote.proposal.choices[vote.choice-1],
            'weight': vote.proposal.scores_total ? parseInt(vote.vp / vote.proposal.scores_total * 100): 0,
        }
    })

    csvWriter.writeRecords(data).then(()=> console.log('The CSV file has been saved.'));
    fs.writeFile("public/votes.json", JSON.stringify(data), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("The JSON file has been saved.");
    });
}

main();
