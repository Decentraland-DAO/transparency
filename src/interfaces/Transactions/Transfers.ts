import { Symbols } from "../Network"

export interface APITransfers {
  address: string
  updated_at: Date
  next_update_at: Date
  quote_currency: string
  chain_id: number
  items: TransferItem[]
}

export interface TransferItem {
  block_signed_at: string
  block_height: number
  tx_hash: string
  tx_offset: number
  successful: boolean
  from_address: string
  from_address_label: null
  to_address: string
  to_address_label: null
  value: string
  value_quote: number
  gas_offered: number
  gas_spent: number
  gas_price: number
  fees_paid: null
  gas_quote: number
  gas_quote_rate: number
  transfers: Transfer[]
}

export interface Transfer {
  block_signed_at: Date
  tx_hash: string
  from_address: string
  from_address_label: string | null
  to_address: string
  to_address_label: string | null
  contract_decimals: number
  contract_name: string
  contract_ticker_symbol: Symbols
  contract_address: string
  logo_url: string
  transfer_type: TransferType
  delta: string
  balance: null
  quote_rate: number
  delta_quote: number
  balance_quote: null
  method_calls: null
}

export enum TransferType {
  IN = "IN",
  OUT = "OUT",
  INTERNAL = 'INTERNAL',
}