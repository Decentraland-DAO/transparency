import BigNumber from "bignumber.js"
import { Wearable, WearableData } from "./interfaces/Wearable"
import { collectionsUrl, fetchGraphQLCondition, saveToCSV, saveToJSON } from "./utils"

type WearableParsed = Wearable & WearableData

const networks = ['ethereum', 'matic']

async function main() {
  const wearables: WearableParsed[] = []

  for (const network of networks) {
    // Fetch Wearables
    const url = collectionsUrl(network)
    const networkWearables = await fetchGraphQLCondition<WearableParsed>(
      url, 'items', 'createdAt', 'id',
      'id creator itemType totalSupply maxSupply rarity creationFee available price beneficiary URI image createdAt updatedAt reviewedAt soldAt sales volume metadata { wearable { name description category } }',
      1000
    )

    for (const w of networkWearables) {
      w.name = w.metadata.wearable?.name
      w.description = w.metadata.wearable?.description
      w.category = w.metadata.wearable?.category
      w.network = network
      w.price = new BigNumber(w.price).dividedBy(10 ** 18).toNumber() || 0
      w.creationFee = new BigNumber(w.creationFee).dividedBy(10 ** 18).toNumber() || 0

      w.createdAt = w.createdAt && new Date(parseInt(w.createdAt) * 1000).toISOString()
      w.updatedAt = w.updatedAt && new Date(parseInt(w.updatedAt) * 1000).toISOString()
      w.reviewedAt = w.reviewedAt && new Date(parseInt(w.reviewedAt) * 1000).toISOString()
      w.soldAt = w.soldAt && new Date(parseInt(w.soldAt) * 1000).toISOString()
    }

    wearables.push(...networkWearables)
  }

  console.log(wearables.length, 'wearables found.')
  saveToJSON('wearables.json', wearables)
  saveToCSV('wearables.csv', wearables, [
    { id: 'id', title: 'Item ID' },
    { id: 'name', title: 'Name' },
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
    { id: 'urn', title: 'URN' },
  ])
}

main()
