import { TokenSymbols } from '../entities/Tokens'

export interface Contract {
  contract_decimals: number | null
  contract_name: null | string
  contract_ticker_symbol: TokenSymbols
  contract_address: string
  supports_erc: string[] | null
  logo_url: string
  last_transferred_at: string
  native_token: boolean
  type: string
  balance: string
  balance_24h: string
  quote_rate: number | null
  quote_rate_24h: number | null
  quote: number
  quote_24h: number | null
  nft_data: null
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
