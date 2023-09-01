import { Curation } from './interfaces/Curation'
import {
  collectionsUrl,
  fetchGraphQLCondition,
  reportToRollbarAndThrow,
  saveToCSV,
  saveToJSON,
  toISOString
} from './utils'

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
  const curations = await fetchGraphQLCondition<Curation>({
    url: collectionsUrl(),
    collection: 'curations',
    fieldNameCondition: 'timestamp',
    dataKey: 'txHash',
    fields: 'id txHash curator { address } collection { id name itemsCount isApproved } isApproved timestamp'
  })

  const curationsParsed: CurationParsed[] = curations.map((c) => {
    return {
      txHash: c.txHash,
      curator: c.curator.address,
      collectionId: c.collection.id,
      collectionName: c.collection.name,
      collectionItems: c.collection.itemsCount,
      collectionApproved: c.isApproved,
      timestamp: toISOString(parseInt(c.timestamp))
    }
  })

  console.log(curationsParsed.length, 'curations found.')

  saveToJSON('curations.json', curationsParsed)
  await saveToCSV('curations.csv', curationsParsed, [
    { id: 'timestamp', title: 'Date' },
    { id: 'txHash', title: 'Tx Hash' },
    { id: 'curator', title: 'Curator' },
    { id: 'collectionId', title: 'Collection ID' },
    { id: 'collectionName', title: 'Collection Name' },
    { id: 'collectionItems', title: 'Collection Items' },
    { id: 'collectionApproved', title: 'Collection Approved' }
  ])
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))