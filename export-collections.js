const fetch = require('isomorphic-fetch');
const Utils = require('./utils.js');

async function main() {
    // Fetch Collections
    const url = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet';
    let collections = await Utils.fetchGraphQL(url, 'collections', '', 'createdAt',
        'id itemsCount creator name symbol isCompleted isApproved isEditable createdAt updatedAt reviewedAt', 1000
    );

    collections.forEach(c => {
        c.createdAt = Utils.toISOString(c.createdAt);
        c.updatedAt = Utils.toISOString(c.updatedAt);
        c.reviewedAt = Utils.toISOString(c.reviewedAt);
    });

    console.log(collections.length, 'collections found.');
    
    Utils.saveToJSON('collections.json', collections);
    Utils.saveToCSV('collections.csv', collections, [
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
    ]);
}

main();
