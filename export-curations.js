const fs = require('fs');
const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer');
const BigNumber = require('bignumber.js');

async function main() {
    let curations = [];
    while(true) {
        let skip = curations.length
        const url = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet';
        const query = `query { curations( first: 1000, skip: ${skip}, orderBy: \"timestamp\", orderDirection: desc  ) { txHash curator { address } collection { id name itemsCount isApproved } isApproved timestamp }}`;

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

        if (!json.data.curations.length) break;
        curations.push(...json.data.curations);
    }

    curations.forEach(c => {
        c.curator = c.curator.address;
        c.collectionId = c.collection.id;
        c.collectionName = c.collection.name;
        c.collectionItems = c.collection.itemsCount;
        c.collectionApproved = c.collection.isApproved;
        c.timestamp = new Date(c.timestamp * 1000).toISOString();
    });

    console.log(curations.length, 'curations found.');

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'public/curations.csv',
        header: [
          {id: 'timestamp', title: 'Date'},
          {id: 'txHash', title: 'Tx Hash'},
          {id: 'curator', title: 'Curator'},
          {id: 'isApproved', title: 'Approved'},
          {id: 'collectionId', title: 'Collection ID'},
          {id: 'collectionName', title: 'Collection Name'},
          {id: 'collectionItems', title: 'Collection Items'},
          {id: 'collectionApproved', title: 'Collection Approved'},
        ]
      });

    if (!fs.existsSync('./public')) fs.mkdirSync('./public');

    csvWriter.writeRecords(curations).then(()=> console.log('The CSV file has been saved.'));
 
    fs.writeFile("public/curations.json", JSON.stringify(curations), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("The JSON file has been saved.");
    });
}

main();
