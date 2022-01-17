const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer')

async function main() {
    // Fetch Snapshot Proposals
    let proposals = [];
    while(true) {
        let skip = proposals.length
        const url = 'https://hub.snapshot.org/graphql';
        const query = `query {\n  proposals (\n    first: 1000,\n    skip: ${skip},\n    where: {\n      space_in: [\"snapshot.dcl.eth\"],\n},\n    orderBy: \"created\",\n    orderDirection: desc\n  ) {\n    id\n    scores_total\n   strategies {\n      params \n    }\n    scores_by_strategy\n    votes}\n}`;

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

    const getVP = (p, symbol) => {
        var index = p.strategies.map(s => s.params.symbol).indexOf(symbol);
        if (index == -1) return 0;
        return parseInt(p.scores_by_strategy.reduce((total, choice) => total + choice[index], 0));
    }

    const proposalVotes = {};
    proposals.forEach(p => proposalVotes[p.id] = p);

    // Get Gobernance dApp Proposals
    proposals = [];
    while(true) {
        let skip = proposals.length
        const url = `https://governance.decentraland.org/api/proposals?limit=100000&offset=${skip}`;
        const res = await fetch(url);
        const json = await res.json();

        if (!json.data.length) break;
        proposals.push(...json.data);
    }

    console.log(proposals.length);

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'proposals.csv',
        header: [
          {id: 'id', title: 'Proposal ID'},
          {id: 'snapshot_id', title: 'Snapshot ID'},
          {id: 'user', title: 'Author'},
          
          {id: 'type', title: 'Type'},
          {id: 'title', title: 'Title'},
          {id: 'start_at', title: 'Started'},
          {id: 'finish_at', title: 'Ended'},
          {id: 'required_to_pass', title: 'Threshold'},
          {id: 'status', title: 'Status'},
          
          {id: 'discourse_topic_id', title: 'Forum Topic'},

          {id: 'scores_total', title: 'Total VP'},
          {id: 'manaVP', title: 'MANA VP'},
          {id: 'landVP', title: 'LAND VP'},
          {id: 'namesVP', title: 'NAMES VP'},
          {id: 'delegatedVP', title: 'DELEGATED VP'},
          {id: 'votes', title: 'Votes'},
        ]
      });

    proposals.forEach(p => {
        pv = proposalVotes[p.snapshot_id];
        p.scores_total = parseInt(pv.scores_total);
        p.votes = pv.votes;
        p.manaVP = getVP(pv, "MANA") + getVP(pv, "WMANA");
        p.landVP = getVP(pv, "LAND") + getVP(pv, "ESTATE");
        p.namesVP = getVP(pv, "NAMES");
        p.delegatedVP = getVP(pv, "VP (delegated)");
    });

    csvWriter.writeRecords(proposals).then(()=> console.log('The CSV file was written successfully'));
}

main();
