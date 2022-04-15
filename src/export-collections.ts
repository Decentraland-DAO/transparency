import { fetchGraphQL, saveToCSV, saveToJSON, toISOString } from "./utils"

type Collection = {
  id: string
  itemsCount: number
  creator: string
  name: string
  symbol: string
  isCompleted: boolean
  isApproved: boolean
  isEditable: boolean
  createdAt: string
  updatedAt: string
  reviewedAt: string
}

async function main() {
  // Fetch Collections
  const url = 'https://api.thegraph.com/subgraphs/name/decentraland/collections-matic-mainnet'
  let collections: Collection[] = await fetchGraphQL(url, 'collections', '', 'createdAt',
    'id itemsCount creator name symbol isCompleted isApproved isEditable createdAt updatedAt reviewedAt', 1000
  )

  collections.forEach(c => {
    c.createdAt = toISOString(parseInt(c.createdAt))
    c.updatedAt = toISOString(parseInt(c.updatedAt))
    c.reviewedAt = toISOString(parseInt(c.reviewedAt))
  })

  console.log(collections.length, 'collections found.')

  saveToJSON('collections.json', collections)
  saveToCSV('collections.csv', collections, [
    { id: 'id', title: 'Collection ID' },
    { id: 'name', title: 'Name' },
    { id: 'symbol', title: 'Symbol' },
    { id: 'itemsCount', title: 'Items' },
    { id: 'isCompleted', title: 'Completed' },
    { id: 'isApproved', title: 'Approved' },
    { id: 'isEditable', title: 'Editable' },
    { id: 'createdAt', title: 'Created' },
    { id: 'updatedAt', title: 'Updated' },
    { id: 'reviewedAt', title: 'ReviewedAt' },
    { id: 'creator', title: 'Creator' },
  ])
}

main()
