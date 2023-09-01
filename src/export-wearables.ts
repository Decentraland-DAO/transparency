import { Wearable, WearableData } from './interfaces/Wearable'
import {
  collectionsUrl,
  fetchGraphQLCondition,
  parseNumber,
  reportToRollbarAndThrow,
  saveToCSV,
  saveToJSON,
  toISOString
} from './utils'

type WearableParsed = Wearable & WearableData

const networks = ['ethereum', 'matic']

async function main() {
  const wearables: WearableParsed[] = []

  for (const network of networks) {
    // Fetch Wearables
    const networkWearables = await fetchGraphQLCondition<WearableParsed>({
      url: collectionsUrl(network), 
      collection: 'items', 
      fieldNameCondition: 'createdAt', 
      dataKey: 'id',
      fields: 'id creator itemType totalSupply maxSupply rarity creationFee available price beneficiary URI image createdAt updatedAt reviewedAt soldAt sales volume metadata { wearable { name description category collection } }'
    })

    for (const w of networkWearables) {
      w.name = w.metadata.wearable?.name
      w.description = w.metadata.wearable?.description
      w.category = w.metadata.wearable?.category
      w.network = network
      w.collection = w.metadata.wearable?.collection
      w.price = parseNumber(w.price, 18) || 0
      w.creationFee = parseNumber(w.creationFee, 18) || 0

      w.createdAt = toISOString(parseInt(w.createdAt))
      w.updatedAt = toISOString(parseInt(w.updatedAt))
      w.reviewedAt = toISOString(parseInt(w.reviewedAt))
      w.soldAt = toISOString(parseInt(w.soldAt))
    }

    wearables.push(...networkWearables)
  }

  console.log(wearables.length, 'wearables found.')
  saveToJSON('wearables.json', wearables)
  await saveToCSV('wearables.csv', wearables, [
    { id: 'id', title: 'Item ID' },
    { id: 'name', title: 'Name' },
    { id: 'collection', title: 'Collection' },
    { id: 'description', title: 'Description' },
    { id: 'category', title: 'Category' },
    { id: 'network', title: 'Network' },
    { id: 'itemType', title: 'Type' },
    { id: 'totalSupply', title: 'Total Supply' },
    { id: 'maxSupply', title: 'Max Supply' },
    { id: 'rarity', title: 'Rarity' },
    { id: 'creationFee', title: 'Creation Fee' },
    { id: 'createdAt', title: 'Created' },
    { id: 'updatedAt', title: 'Updated' },
    { id: 'reviewedAt', title: 'Reviewed' },
    { id: 'available', title: 'Available' },
    { id: 'price', title: 'Price' },
    { id: 'soldAt', title: 'Sold' },
    { id: 'sales', title: 'Sales' },
    { id: 'volume', title: 'Volume' },
    { id: 'creator', title: 'Creator' },
    { id: 'beneficiary', title: 'Beneficiary' },
    { id: 'URI', title: 'URI' },
    { id: 'urn', title: 'URN' }
  ])
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))