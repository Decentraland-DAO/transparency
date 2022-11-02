export interface Wearable {
  id: string
  creator: string
  itemType: ItemType
  totalSupply: number
  maxSupply: number
  rarity: Rarity
  creationFee: number
  available: number
  price: number
  beneficiary: string
  URI: string
  image: string
  createdAt: string
  updatedAt: string
  reviewedAt: string
  soldAt?: string
  sales: number
  volume: number
  metadata: Metadata
}

export enum ItemType {
  EmoteV1 = "emote_v1",
  SmartWearableV1 = "smart_wearable_v1",
  WearableV2 = "wearable_v2",
}

export interface Metadata {
  wearable?: WearableData
}

export interface WearableData {
  name: string
  description: string
  category: Category
  network: string
  collection: string
}

export enum Category {
  Earring = "earring",
  Eyebrows = "eyebrows",
  Eyes = "eyes",
  Eyewear = "eyewear",
  FacialHair = "facial_hair",
  Feet = "feet",
  Hair = "hair",
  Hat = "hat",
  Helmet = "helmet",
  LowerBody = "lower_body",
  Mask = "mask",
  Mouth = "mouth",
  Skin = "skin",
  Tiara = "tiara",
  TopHead = "top_head",
  UpperBody = "upper_body",
}

export enum Rarity {
  Common = "common",
  Epic = "epic",
  Legendary = "legendary",
  Mythic = "mythic",
  Rare = "rare",
  Uncommon = "uncommon",
  Unique = "unique",
}
