import { TokenSymbols } from "../../entities/Tokens"

export interface TokenPriceAPIData {
  contract_decimals: number
  contract_name: string
  contract_ticker_symbol: TokenSymbols
  contract_address: string
  supports_erc: string[]
  logo_url: string
  update_at: string
  quote_currency: string
  prices: Price[]
  items: Price[]
}

interface Price {
  contract_metadata: ContractMetadata
  date: string
  price: number
}

interface ContractMetadata {
  contract_decimals: number
  contract_name: string
  contract_ticker_symbol: string
  contract_address: string
  supports_erc: string[]
  logo_url: string
}

export type TokenPriceData = Record<string, Record<string, number>>