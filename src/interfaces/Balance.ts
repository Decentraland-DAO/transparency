import { TokenSymbols } from "../entities/Tokens"

export interface Contract {
  contract_decimals: number
  contract_name: string
  contract_ticker_symbol: TokenSymbols
  contract_address: string
  logo_url: string
  holdings: Holding[]
}

export interface Holding {
  timestamp: string
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
  updated_at: string
  next_update_at: string
  quote_currency: string
  chain_id: number
  items: Contract[]
}
