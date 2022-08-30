import { Curation } from './interfaces/Curation'
import { collectionsUrl, fetchGraphQLCondition, saveToCSV, saveToJSON } from './utils'

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
  const url = collectionsUrl()
  const curations = await fetchGraphQLCondition<Curation>(
    url,
    'curations',
    'timestamp',
    'txHash',
    'id txHash curator { address } collection { id name itemsCount isApproved } isApproved timestamp',
    1000
  )

  const curationsParsed: CurationParsed[] = curations.map((c) => {
    return {
      txHash: c.txHash,
      curator: c.curator.address,
      collectionId: c.collection.id,
      collectionName: c.collection.name,
      collectionItems: c.collection.itemsCount,
      collectionApproved: c.isApproved,
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
