const fs = require('fs');
const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer')

async function main() {
    let collections = [];
    while(true) {
        let skip = collections.length
        const url = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet';
        const query = `query {\n  collections (\n    first: 1000,\n    skip: ${skip},\n    orderBy: \"createdAt\",\n    orderDirection: desc\n  ) {\n    id\n   itemsCount\n    creator\n   name\n  symbol\n    isCompleted\n   isApproved\n    isEditable\n    createdAt\n updatedAt\n reviewedAt\n}\n}`;

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

        if (!json.data.collections.length) break;
        collections.push(...json.data.collections);
    }

    console.log(collections.length, 'collections found.');

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'public/collections.csv',
        header: [
          {id: 'id', title: 'Collection ID'},
          {id: 'name', title: 'Name'},
          {id: 'symbol', title: 'Symbol'},
          {id: 'itemsCount', title: 'Items'},
          {id: 'isCompleted', title: 'Completed'},
          {id: 'isApproved', title: 'Approved'},
          {id: 'isEditable', title: 'Editable'},
          {id: 'createdAt', title: 'Created'},
          {id: 'updatedAt', title: 'Updated'},
          {id: 'reviewedAt', title: 'ReviewedAt'},
          {id: 'creator', title: 'Creator'},
        ]
      });

    if (!fs.existsSync('./public')) fs.mkdirSync('./public');

    csvWriter.writeRecords(collections).then(()=> console.log('The CSV file has been saved.'));
 
    fs.writeFile("public/collections.json", JSON.stringify(collections), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("The JSON file has been saved.");
    });
}

main();
