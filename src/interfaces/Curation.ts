export interface Curation {
  id: string
  txHash: string
  curator: Curator
  collection: Collection
  isApproved: boolean
  timestamp: string
}

interface Collection {
  id: string
  name: string
  itemsCount: number
  isApproved: boolean
}

export interface Curator {
  address: string
}