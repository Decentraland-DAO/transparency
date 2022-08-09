export interface CovalentResponse<T> {
  data: Data<T>
  error: boolean
  error_message: string | null
  error_code: number | null
}

interface Data<T> {
  updated_at: Date
  items: T[]
  pagination: Pagination | null
}

interface Pagination {
  has_more: boolean
  page_number: number
  page_size: number
}
