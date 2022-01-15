const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer')

async function main() {
    const proposals = [];
    while(true) {
        let skip = proposals.length
        const url = 'https://hub.snapshot.org/graphql';
        const query = `query {\n  proposals (\n    first: 1000,\n    skip: ${skip},\n    where: {\n      space_in: [\"snapshot.dcl.eth\"],\n},\n    orderBy: \"created\",\n    orderDirection: desc\n  ) {\n    id\n    title\n    scores_total\n    votes\n    author\n  }\n}`;

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

        if (!json.data.proposals.length) break;
        proposals.push(...json.data.proposals);
    }

    console.log(proposals.length);

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'proposals.csv',
        header: [
          {id: 'id', title: 'Proposal Id'},
          {id: 'title', title: 'Title'},
          {id: 'scores_total', title: 'Total VP'},
          {id: 'votes', title: 'Votes'},
        ]
      });

    csvWriter.writeRecords(proposals).then(()=> console.log('The CSV file was written successfully'));
}

main();
