import { Token } from "./Network"

export interface Contract {
  contract_decimals: number
  contract_name: string
  contract_ticker_symbol: Token
  contract_address: string
  logo_url: string
  holdings: Holding[]
}

export interface Holding {
  timestamp: Date
  quote_rate: number | null
  open: Details
  high: Details
  low: Details
  close: Details
}

export interface Details {
  balance: string
  quote: number | null
}

export interface APIBalance {
  address: string
  updated_at: Date
  next_update_at: Date
  quote_currency: string
  chain_id: number
  items: Contract[]
}
