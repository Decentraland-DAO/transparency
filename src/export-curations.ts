import { fetchGraphQL, saveToCSV, saveToJSON } from "./utils"

async function main() {
  // Fetch Curations
  const url = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet'
  let curations = await fetchGraphQL(url, 'curations', '', 'timestamp',
    'id txHash curator { address } collection { id name itemsCount isApproved } isApproved timestamp')

  console.log(curations)

  curations.forEach(c => {
    c.curator = c.curator.address
    c.collectionId = c.collection.id
    c.collectionName = c.collection.name
    c.collectionItems = c.collection.itemsCount
    c.collectionApproved = c.collection.isApproved
    c.timestamp = new Date(c.timestamp * 1000).toISOString()
  })

  console.log(curations.length, 'curations found.')

  saveToJSON('curations.json', curations)
  saveToCSV('curations.csv', curations, [
    { id: 'timestamp', title: 'Date' },
    { id: 'txHash', title: 'Tx Hash' },
    { id: 'curator', title: 'Curator' },
    { id: 'isApproved', title: 'Approved' },
    { id: 'collectionId', title: 'Collection ID' },
    { id: 'collectionName', title: 'Collection Name' },
    { id: 'collectionItems', title: 'Collection Items' },
    { id: 'collectionApproved', title: 'Collection Approved' },
  ])
}

main()
