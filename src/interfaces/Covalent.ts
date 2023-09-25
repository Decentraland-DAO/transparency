export interface CovalentResponse<T> {
  data: Data<T>
  error: boolean
  error_message: string | null
  error_code: number | null
}

type Data<T> = T[] & {
  updated_at: Date
  items: T[]
  pagination: Pagination | null
}

interface Pagination {
  has_more: boolean
  page_number: number
  page_size: number
}

export interface BlockHeight {
  signed_at: string
  height: number
}
