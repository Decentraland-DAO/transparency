export interface APIEvents {
  updated_at: Date
  items: EventItem[]
}

export interface EventItem {
  block_signed_at: Date
  block_height: number
  tx_offset: number
  log_offset: number
  tx_hash: string
  raw_log_topics: string[]
  sender_contract_decimals: number
  sender_name: null
  sender_contract_ticker_symbol: null
  sender_address: string
  sender_address_label: null
  sender_logo_url: string
  raw_log_data: string
  decoded: Decoded
}

export interface Decoded {
  name: string
  signature: string
  params: Param[]
}

export interface Param {
  name: ParamName
  type: ParamType
  indexed: boolean
  decoded: boolean
  value: string
}

export enum ParamName {
  AssetID = "assetId",
  Buyer = "buyer",
  ID = "id",
  NftAddress = "nftAddress",
  Seller = "seller",
  TotalPrice = "totalPrice",
}

export enum ParamType {
  Address = "address",
  Bytes32 = "bytes32",
  Uint256 = "uint256",
}