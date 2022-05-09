export interface Collection {
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