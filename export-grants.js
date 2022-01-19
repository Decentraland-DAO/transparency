const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer')

async function main() {
    // Fetch Snapshot Proposals
    let proposals = [];
    const proposalVotes = {};
    while(true) {
        let skip = proposals.length
        const url = 'https://hub.snapshot.org/graphql';
        const query = `query {\n  proposals (\n    first: 1000,\n    skip: ${skip},\n    where: {\n      space_in: [\"snapshot.dcl.eth\"],\n},\n    orderBy: \"created\",\n    orderDirection: desc\n  ) {\n    id\n    scores_total\n}\n}`;

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
    proposals.forEach(p => proposalVotes[p.id] = p);

    // Get Gobernance dApp Proposals
    proposals = [];
    while(true) {
        let skip = proposals.length
        const url = `https://governance.decentraland.org/api/proposals?limit=100000&offset=${skip}&type=grant`;
        const res = await fetch(url);
        const json = await res.json();

        if (!json.data.length) break;
        proposals.push(...json.data);
    }

    console.log(proposals.length);

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'grants.csv',
        header: [
          {id: 'id', title: 'Proposal ID'},
          {id: 'snapshot_id', title: 'Snapshot ID'},
          {id: 'user', title: 'Author'},
          
          {id: 'title', title: 'Title'},
          {id: 'status', title: 'Status'},
          {id: 'start_at', title: 'Started'},
          {id: 'finish_at', title: 'Ended'},
          {id: 'required_to_pass', title: 'Threshold'},
          {id: 'scores_total', title: 'Total VP'},
          
          {id: 'grant_category', title: 'Category'},
          {id: 'grant_tier', title: 'Tier'},
          {id: 'grant_size', title: 'Amount USD'},
          {id: 'grant_beneficiary', title: 'Beneficiary'},
        ]
      });

    proposals.forEach(p => {
        pv = proposalVotes[p.snapshot_id];
        p.scores_total = parseInt(pv.scores_total);
        p.grant_category = p.configuration.category;
        p.grant_tier = p.configuration.tier;
        p.grant_size = p.configuration.size;
        p.grant_beneficiary = p.configuration.beneficiary;

    });

    csvWriter.writeRecords(proposals).then(()=> console.log('The CSV file has been saved.'));
}

main();
