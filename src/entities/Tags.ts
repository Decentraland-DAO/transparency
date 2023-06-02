import { CURATION_FEE_CONTRACTS, CURATORS_PAYMENT_ADDRESSES, DAO_COMMITTEE_ADDRESSES, GRANTS_REVENUE_ADDRESSES, SECONDARY_SALE_CONTRACTS, SWAP_CONTRACTS, WEARABLE_CONTRACTS } from "../utils/addresses"
import { CurationCommittee } from "./Teams"

export enum TagType {
  CURATION_FEE = 'Curation Fee',
  CURATOR = 'Curator',
  DAO_COMMITTEE = 'DAO Committee Member',
  ESTATE_BID_FEE = 'ESTATE fee :: BID',
  ETH_MARKETPLACE = 'ETH Marketplace',
  FACILITATOR = 'Facilitator',
  GRANT = 'Grant',
  GRANT_REFUND = 'Grant Refund/Revoke',
  GRANT_REVENUE = 'Revenue from Grantee',
  LAND_BID_FEE = 'LAND fee :: BID',
  LOOKSRARE = 'LooksRare',
  MATIC_MARKETPLACE = 'MATIC Marketplace',
  NAME_BID_FEE = 'NAME fee :: BID',
  OPENSEA = 'OpenSea',
  SAB_DCL = 'SAB DCL',
  SECONDARY_SALE = 'Secondary Sale',
  SWAP = 'Swap',
  VESTING_CONTRACT = 'Vesting Contract',
  WEARABLE_BID_FEE = 'Wearable L1 fee :: BID',
  OTHER = 'OTHER',
}

type ItemTagType = TagType.ESTATE_BID_FEE | TagType.LAND_BID_FEE | TagType.NAME_BID_FEE | TagType.WEARABLE_BID_FEE

export enum SecondarySaleItemTagType {
  ESTATE = 'Secondary Sale :: ESTATE fee',
  LAND = 'Secondary Sale :: LAND fee',
  NAME = 'Secondary Sale :: NAME fee',
  WEARABLE = 'Secondary Sale :: Wearable L1 fee',
}

type ExportedTagType = Exclude<TagType, TagType.SECONDARY_SALE | TagType.SWAP | TagType.ETH_MARKETPLACE | TagType.SAB_DCL | TagType.GRANT_REFUND> | SecondarySaleItemTagType

export enum TagCategoryType {
  CURATORS_COMMITTEE_PAYOUT,
  DAO_COMMITTEE,
  ESTATE_MARKETPLACE_SALES,
  FACILITATION_PAYOUT,
  GRANTS_PAYOUT,
  GRANTS_REVENUE,
  LAND_MARKETPLACE_SALES,
  LOOKSRARE_MARKETPLACE_FEE,
  NAME_MARKETPLACE_SALES,
  OPENSEA_MARKETPLACE_FEE,
  VESTING_CONTRACT,
  WEARABLE_MARKETPLACE_SALES,
  WEARABLE_SUBMISSION_FEE,
  WEARABLES_MINTING_FEE,
  OTHER,
}

export interface TagCategory {
  name: string
  description: string
}

const TAG_CATEGORIES: Record<keyof typeof TagCategoryType, TagCategory> = {
  CURATORS_COMMITTEE_PAYOUT: { name: 'Wearable Curators Committee Payout', description: 'Transactions corresponding to the payout of compensations for members of the Wearables Curation Committee' },
  DAO_COMMITTEE: { name: 'DAO Committee', description: 'Transactions between the DAO Treasury and the DAO Committee wallets (e.g. Transaction gas refunds)' },
  ESTATE_MARKETPLACE_SALES: { name: 'ESTATE DCL Marketplace Sales Fee', description: 'Funds corresponding to the 2.5% fee applied to every ESTATE transaction (Minting or secondary)' },
  FACILITATION_PAYOUT: { name: 'Community Facilitation Payout', description: 'Transactions corresponding to the payout for monthly compensations of the DAO Facilitator role' },
  GRANTS_PAYOUT: { name: 'Community Grants Payout', description: 'Transactions corresponding to the funding of the vesting contracts for approved DAO Community Grants projects' },
  GRANTS_REVENUE: { name: 'Community Grants Revenue', description: 'Funds corresponding to Grant-funded projects that share revenue with the DAO Treasury' },
  LAND_MARKETPLACE_SALES: { name: 'LAND  DCL Marketplace Sales Fee', description: 'Funds corresponding to the 2.5% fee applied to every LAND transaction (Minting or secondary)' },
  LOOKSRARE_MARKETPLACE_FEE: { name: 'LooksRare Marketplace Fee', description: 'Funds corresponding to the 2.5% fee applied to every transaction (ESTATE, LAND, NAME & Wearables) on LooksRare marketplace' },
  NAME_MARKETPLACE_SALES: { name: 'NAME DCL Marketplace Sales Fee', description: 'Funds corresponding to the 2.5% fee applied to every NAME transaction (Minting or secondary)' },
  OPENSEA_MARKETPLACE_FEE: { name: 'OpenSea Marketplace Fee', description: 'Funds corresponding to the 2.5% fee applied to every transaction (ESTATE, LAND, NAME & Wearables) on OpenSea marketplace' },
  VESTING_CONTRACT: { name: 'MANA Vesting Contract', description: 'Funds corresponding to the 10-year MANA vesting contract that the DAO holds' },
  WEARABLE_MARKETPLACE_SALES: { name: 'Wearable L1 Sales Fee', description: 'Funds corresponding to the 2.5% fee applied to every Wearable transaction on Ethereum (Minting or secondary)' },
  WEARABLE_SUBMISSION_FEE: { name: 'Wearable Submission Fee', description: 'Funds corresponding to the fee applied to every new Wearable submission to the Decentraland Marketplace' },
  WEARABLES_MINTING_FEE: { name: 'Wearables Minting Fee', description: 'Funds corresponding to the 2.5% fee applied to Wearables minting on Polygon network via the Decentraland Marketplace' },
  OTHER: { name: 'Other', description: 'Non-categorized or one-off transactions' },
}

const SECONDARY_SALE_TAGS: Record<ItemTagType, SecondarySaleItemTagType> = {
  [TagType.ESTATE_BID_FEE]: SecondarySaleItemTagType.ESTATE,
  [TagType.LAND_BID_FEE]: SecondarySaleItemTagType.LAND,
  [TagType.NAME_BID_FEE]: SecondarySaleItemTagType.NAME,
  [TagType.WEARABLE_BID_FEE]: SecondarySaleItemTagType.WEARABLE,
}

function toRecord(addresses: string[], tag: TagType) {
  return addresses.reduce((accumulator, address) => {
    accumulator[address.toLowerCase()] = tag
    return accumulator
  }, {} as Record<string, TagType>)
}

const CURATORS = new Set([...CurationCommittee.getMemberAddresses(), ...CURATORS_PAYMENT_ADDRESSES])
const ITEM_CONTRACTS: Record<string, ItemTagType> = {
  '0x959e104e1a4db6317fa58f8295f586e1a978c297': TagType.ESTATE_BID_FEE,
  '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d': TagType.LAND_BID_FEE,
  '0x2a187453064356c898cae034eaed119e1663acb8': TagType.NAME_BID_FEE,
  ...toRecord(WEARABLE_CONTRACTS, TagType.WEARABLE_BID_FEE)
}
const TAGS: Record<string, TagType> = {
  '0x7a3abf8897f31b56f09c6f69d074a393a905c1ac': TagType.VESTING_CONTRACT,
  '0x59728544b08ab483533076417fbbb2fd0b17ce3a': TagType.LOOKSRARE,
  ...ITEM_CONTRACTS,
  ...toRecord(DAO_COMMITTEE_ADDRESSES, TagType.DAO_COMMITTEE),
  ...toRecord(SWAP_CONTRACTS, TagType.SWAP),
  ...toRecord(SECONDARY_SALE_CONTRACTS, TagType.SECONDARY_SALE),
  ...toRecord(CURATION_FEE_CONTRACTS, TagType.CURATION_FEE),
  ...toRecord(GRANTS_REVENUE_ADDRESSES, TagType.GRANT_REVENUE),
}
const TAG_CATEGORY_MAPPING: Record<ExportedTagType, TagCategory> = {
  [TagType.ESTATE_BID_FEE]: TAG_CATEGORIES.ESTATE_MARKETPLACE_SALES,
  [SecondarySaleItemTagType.ESTATE]: TAG_CATEGORIES.ESTATE_MARKETPLACE_SALES,

  [TagType.LAND_BID_FEE]: TAG_CATEGORIES.LAND_MARKETPLACE_SALES,
  [SecondarySaleItemTagType.LAND]: TAG_CATEGORIES.LAND_MARKETPLACE_SALES,

  [TagType.NAME_BID_FEE]: TAG_CATEGORIES.NAME_MARKETPLACE_SALES,
  [SecondarySaleItemTagType.NAME]: TAG_CATEGORIES.NAME_MARKETPLACE_SALES,

  [TagType.WEARABLE_BID_FEE]: TAG_CATEGORIES.WEARABLE_MARKETPLACE_SALES,
  [SecondarySaleItemTagType.WEARABLE]: TAG_CATEGORIES.WEARABLE_MARKETPLACE_SALES,

  [TagType.LOOKSRARE]: TAG_CATEGORIES.LOOKSRARE_MARKETPLACE_FEE,
  [TagType.OPENSEA]: TAG_CATEGORIES.OPENSEA_MARKETPLACE_FEE,
  [TagType.CURATION_FEE]: TAG_CATEGORIES.WEARABLE_SUBMISSION_FEE,
  [TagType.MATIC_MARKETPLACE]: TAG_CATEGORIES.WEARABLES_MINTING_FEE,
  [TagType.DAO_COMMITTEE]: TAG_CATEGORIES.DAO_COMMITTEE,
  [TagType.GRANT]: TAG_CATEGORIES.GRANTS_PAYOUT,
  [TagType.GRANT_REVENUE]: TAG_CATEGORIES.GRANTS_REVENUE,
  [TagType.CURATOR]: TAG_CATEGORIES.CURATORS_COMMITTEE_PAYOUT,
  [TagType.FACILITATOR]: TAG_CATEGORIES.FACILITATION_PAYOUT,
  [TagType.VESTING_CONTRACT]: TAG_CATEGORIES.VESTING_CONTRACT,
  [TagType.OTHER]: TAG_CATEGORIES.OTHER,
}

export class Tags {

  public static get(address: string): string {
    return TAGS[address.toLowerCase()] || ''
  }

  public static getItemContract(address: string): string {
    return ITEM_CONTRACTS[address.toLowerCase()] || ''
  }

  public static isItemContract(address: string): boolean {
    return !!this.getItemContract(address)
  }

  public static getCurator(address: string): string {
    return CURATORS.has(address.toLowerCase()) ? TagType.CURATOR : ''
  }

  public static getSecondarySale(address: string): string {
    if (!this.isItemContract(address)) {
      throw new Error(`Secondary Sale Tag Error: ${address} is not a valid item contract`)
    }

    return SECONDARY_SALE_TAGS[this.getItemContract(address)]
  }

  public static getTagCategory(tag: TagCategoryType): TagCategory {
    return TAG_CATEGORIES[TagCategoryType[tag]]
  }

  public static isExportedTag(tag: string): boolean {
    return !!TAG_CATEGORY_MAPPING[tag]
  }

  public static getExportedTagCategory(tag: string): TagCategory {
    if (!this.isExportedTag(tag)) {
      throw new Error(`Tag Category Error: ${tag} is not a valid tag`)
    }

    return TAG_CATEGORY_MAPPING[tag]
  }

}
