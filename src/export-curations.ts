import { Curation } from './interfaces/Curation'
import { fetchGraphQLCondition, saveToCSV, saveToJSON } from './utils'

interface CurationParsed {
  timestamp: string,
  txHash: string,
  curator: string,
  collectionId: string,
  collectionName: string,
  collectionItems: number,
  collectionApproved: boolean,
}

async function main() {
  // Fetch Curations
  const url = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet'
  let curations: Curation[] = await fetchGraphQLCondition(
    url,
    'curations',
    'timestamp',
    'txHash',
    'id txHash curator { address } collection { id name itemsCount isApproved } isApproved timestamp'
  )

  const curationsParsed: CurationParsed[] = curations.map((c) => {
    return {
      txHash: c.txHash,
      curator: c.curator.address,
      collectionId: c.collection.id,
      collectionName: c.collection.name,
      collectionItems: c.collection.itemsCount,
      collectionApproved: c.collection.isApproved,
      timestamp: new Date(parseInt(c.timestamp) * 1000).toISOString()
    }
  })

  console.log(curationsParsed.length, 'curations found.')

  saveToJSON('curations.json', curationsParsed)
  saveToCSV('curations.csv', curationsParsed, [
    { id: 'timestamp', title: 'Date' },
    { id: 'txHash', title: 'Tx Hash' },
    { id: 'curator', title: 'Curator' },
    { id: 'collectionId', title: 'Collection ID' },
    { id: 'collectionName', title: 'Collection Name' },
    { id: 'collectionItems', title: 'Collection Items' },
    { id: 'collectionApproved', title: 'Collection Approved' },
  ])
}

main()
