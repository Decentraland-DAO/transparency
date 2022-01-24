const fs = require('fs');
const fetch = require('isomorphic-fetch');
const CSVWritter = require('csv-writer');
const BigNumber = require('bignumber.js');

async function main() {
    let wearables = [];
    while(true) {
        let skip = wearables.length
        const url = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet';
        const query = `query { items( first: 1000, skip: ${skip}, orderBy: \"createdAt\", orderDirection: desc  ) { id creator itemType totalSupply maxSupply rarity creationFee available price beneficiary URI image createdAt updatedAt reviewedAt soldAt sales volume metadata { wearable { name description category}}}}`;

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

        if (!json.data.items.length) break;
        wearables.push(...json.data.items);
    }

    wearables.forEach(w => {
        w.name = w.metadata.wearable.name;
        w.description = w.metadata.wearable.description;
        w.category = w.metadata.wearable.category;
        w.price = BigNumber(w.price).dividedBy(10 ** 18).toNumber() || 0;
        w.creationFee = BigNumber(w.creationFee).dividedBy(10 ** 18).toNumber() || 0;
    });

    console.log(wearables.length, 'wearables found.');

    const csvWriter = CSVWritter.createObjectCsvWriter({
        path: 'public/wearables.csv',
        header: [
          {id: 'id', title: 'Item ID'},
          {id: 'name', title: 'Name'},
          {id: 'description', title: 'Description'},
          {id: 'category', title: 'Category'},
          {id: 'itemType', title: 'Type'},
          {id: 'totalSupply', title: 'Total Supply'},
          {id: 'maxSupply', title: 'Max Supply'},
          {id: 'rarity', title: 'Rarity'},
          {id: 'creationFee', title: 'Creation Fee'},
          {id: 'createdAt', title: 'Created'},
          {id: 'updatedAt', title: 'Updated'},
          {id: 'reviewedAt', title: 'Reviewed'},
          {id: 'available', title: 'Available'},
          {id: 'price', title: 'Price'},
          {id: 'soldAt', title: 'Sold'},
          {id: 'sales', title: 'Sales'},
          {id: 'volume', title: 'Volume'},
          {id: 'creator', title: 'Creator'},
          {id: 'beneficiary', title: 'Beneficiary'},
          {id: 'URI', title: 'URI'},
          {id: 'urn', title: 'URN'},
        ]
      });

    if (!fs.existsSync('./public')) fs.mkdirSync('./public');

    csvWriter.writeRecords(wearables).then(()=> console.log('The CSV file has been saved.'));
 
    fs.writeFile("public/wearables.json", JSON.stringify(wearables), 'utf8', function (err) {
        if (err) {
            console.log("An error occured while writing JSON Object to File.");
            return console.log(err);
        }
        console.log("The JSON file has been saved.");
    });
}

main();
