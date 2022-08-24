import { Collection } from "./interfaces/Collection"
import { collectionsUrl, fetchGraphQL, saveToCSV, saveToJSON, toISOString } from "./utils"

async function main() {
  // Fetch Collections
  const url = collectionsUrl()
  const collections: Collection[] = await fetchGraphQL(url, 'collections', '', 'createdAt',
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
