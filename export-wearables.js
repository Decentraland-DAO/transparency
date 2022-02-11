const fetch = require('isomorphic-fetch');
const BigNumber = require('bignumber.js');
const Utils = require('./utils.js');

async function main() {
    // Fetch Wearables
    const url = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet';
    let wearables = await Utils.fetchGraphQL(url, 'items', '', 'createdAt',
        'id creator itemType totalSupply maxSupply rarity creationFee available price beneficiary URI image createdAt updatedAt reviewedAt soldAt sales volume metadata { wearable { name description category } }'
    );

    wearables.forEach(w => {
        w.name = w.metadata.wearable.name;
        w.description = w.metadata.wearable.description;
        w.category = w.metadata.wearable.category;
        w.price = BigNumber(w.price).dividedBy(10 ** 18).toNumber() || 0;
        w.creationFee = BigNumber(w.creationFee).dividedBy(10 ** 18).toNumber() || 0;

        w.createdAt = w.createdAt && new Date(w.createdAt * 1000).toISOString();
        w.updatedAt = w.updatedAt && new Date(w.updatedAt * 1000).toISOString();
        w.reviewedAt = w.reviewedAt && new Date(w.reviewedAt * 1000).toISOString();
        w.soldAt = w.soldAt && new Date(w.soldAt * 1000).toISOString();
    });

    console.log(wearables.length, 'wearables found.');
    Utils.saveToJSON('public/wearables.json', data);
    Utils.saveToCSV('public/wearables.csv', data, [
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
    ]);
}

main();
