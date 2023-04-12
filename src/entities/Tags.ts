import { CurationCommittee, DAOCommittee } from "./Teams"

export enum TagType {
  ESTATE_BID_FEE = 'ESTATE fee :: BID',
  LAND_BID_FEE = 'LAND fee :: BID',
  NAME_BID_FEE = 'NAME fee :: BID',
  WEARABLE_BID_FEE = 'Wearable L1 fee :: BID',
  DAO_COMMITTEE = 'DAO Committee Member',
  VESTING_CONTRACT = 'Vesting Contract',
  LOOKSRARE = 'LooksRare',
  SWAP = 'Swap',
  OPENSEA = 'OpenSea',
  SECONDARY_SALE = 'Secondary Sale',
  CURATION_FEE = 'Curation Fee',
  ETH_MARKETPLACE = 'ETH Marketplace',
  MATIC_MARKETPLACE = 'MATIC Marketplace',
  SAB_DCL = 'SAB DCL',
  GRANT = 'Grant',
  GRANT_REFUND = 'Grant Refund/Revoke',
  FACILITATOR = 'Facilitator',
  CURATOR = 'Curator',
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
  ESTATE_MARKETPLACE_SALES,
  LAND_MARKETPLACE_SALES,
  NAME_MARKETPLACE_SALES,
  WEARABLE_MARKETPLACE_SALES,
  LOOKSRARE_MARKETPLACE_FEE,
  OPENSEA_MARKETPLACE_FEE,
  WEARABLE_SUBMISSION_FEE,
  WEARABLES_MINTING_FEE,
  DAO_COMMITTEE,
  GRANTS_PAYOUT,
  CURATORS_COMMITTEE_PAYOUT,
  FACILITATION_PAYOUT,
  VESTING_CONTRACT,
  OTHER,
}

export interface TagCategory {
  name: string
  description: string
}

const TAG_CATEGORIES: Record<keyof typeof TagCategoryType, TagCategory> = {
  ESTATE_MARKETPLACE_SALES: { name: 'ESTATE DCL Marketplace Sales Fee', description: 'Funds corresponding to the 2.5% fee applied to every ESTATE transaction (Minting or secondary)' },
  LAND_MARKETPLACE_SALES: { name: 'LAND  DCL Marketplace Sales Fee', description: 'Funds corresponding to the 2.5% fee applied to every LAND transaction (Minting or secondary)' },
  NAME_MARKETPLACE_SALES: { name: 'NAME DCL Marketplace Sales Fee', description: 'Funds corresponding to the 2.5% fee applied to every NAME transaction (Minting or secondary)' },
  WEARABLE_MARKETPLACE_SALES: { name: 'Wearable L1 Sales Fee', description: 'Funds corresponding to the 2.5% fee applied to every Wearable transaction on Ethereum (Minting or secondary)' },
  LOOKSRARE_MARKETPLACE_FEE: { name: 'LooksRare Marketplace Fee', description: 'Funds corresponding to the 2.5% fee applied to every transaction (ESTATE, LAND, NAME & Wearables) on LooksRare marketplace' },
  OPENSEA_MARKETPLACE_FEE: { name: 'OpenSea Marketplace Fee', description: 'Funds corresponding to the 2.5% fee applied to every transaction (ESTATE, LAND, NAME & Wearables) on OpenSea marketplace' },
  WEARABLE_SUBMISSION_FEE: { name: 'Wearable Submission Fee', description: 'Funds corresponding to the fee applied to every new Wearable submission to the Decentraland Marketplace' },
  WEARABLES_MINTING_FEE: { name: 'Wearables Minting Fee', description: 'Funds corresponding to the 2.5% fee applied to Wearables minting on Polygon network via the Decentraland Marketplace' },
  DAO_COMMITTEE: { name: 'DAO Committee', description: 'Transactions between the DAO Treasury and the DAO Committee wallets (e.g. Transaction gas refunds)' },
  GRANTS_PAYOUT: { name: 'Community Grants Payout', description: 'Transactions corresponding to the funding of the vesting contracts for approved DAO Community Grants projects' },
  CURATORS_COMMITTEE_PAYOUT: { name: 'Wearable Curators Committee Payout', description: 'Transactions corresponding to the payout of compensations for members of the Wearables Curation Committee' },
  FACILITATION_PAYOUT: { name: 'Community Facilitation Payout', description: 'Transactions corresponding to the payout for monthly compensations of the DAO Facilitator role' },
  VESTING_CONTRACT: { name: 'MANA Vesting Contract', description: 'Funds corresponding to the 10-year MANA vesting contract that the DAO holds' },
  OTHER: { name: 'Other', description: 'Non-categorized or one-off transactions' },
}

const SECONDARY_SALE_TAGS: Record<ItemTagType, SecondarySaleItemTagType> = {
  [TagType.ESTATE_BID_FEE]: SecondarySaleItemTagType.ESTATE,
  [TagType.LAND_BID_FEE]: SecondarySaleItemTagType.LAND,
  [TagType.NAME_BID_FEE]: SecondarySaleItemTagType.NAME,
  [TagType.WEARABLE_BID_FEE]: SecondarySaleItemTagType.WEARABLE,
}

const DAO_COMMITTEE_ADDRESSES = [
  '0x521b0fef9cdcf250abaf8e7bc798cbe13fa98692',
  ...DAOCommittee.getMemberAddresses()
]

const SWAP_CONTRACTS = [
  '0x5777d92f208679db4b9778590fa3cab3ac9e2168',
  '0xc176761d388caf2f56cf03329d82e1e7c48ae09c',
  '0xb3c839dbde6b96d37c56ee4f9dad3390d49310aa',
  '0x1111111254fb6c44bac0bed2854e76f90643097d',
  '0x27239549dd40e1d60f5b80b0c4196923745b1fd2',
  '0x3058ef90929cb8180174d74c507176cca6835d73',
  '0x220bda5c8994804ac96ebe4df184d25e5c2196d4',
  '0x5f5207df64b0f7ed56bf0b61733d3be8795f4e5a',
  '0x397ff1542f962076d0bfe58ea045ffa2d347aca0',
  '0x1bec4db6c3bc499f3dbf289f5499c30d541fec97',
  '0xc3d03e4f041fd4cd388c549ee2a29a9e5075882f',
  '0x06da0fd433c1a5d7a4faa01111c044910a184553',
  '0x11b1f53204d03e5529f09eb3091939e4fd8c9cf3',
  '0x2ec255797fef7669fa243509b7a599121148ffba',
  '0x6d51fdc0c57cbbff6dac4a565b35a17b88c6ceb5',
  '0x56eddb7aa87536c09ccc2793473599fd21a8b17f',
  '0x288931fa76d7b0482f0fd0bca9a50bf0d22b9fef',
  '0x8661ae7918c0115af9e3691662f605e9c550ddc9',
  '0xd9ed2b5f292a0e319a04e6c1aca15df97705821c',
  '0x2057cfb9fd11837d61b294d514c5bd03e5e7189a',
  '0x4e68ccd3e89f51c3074ca5072bbac773960dfa36',
  '0x11b815efb8f581194ae79006d24e0d814b7697f6',
  '0x0d4a11d5eeaac28ec3f61d100daf4d40471f1852',
  '0xdab8c0126102db3b5d678475e7f5ff6fbd390a54',
]

const SECONDARY_SALE_CONTRACTS = [
  '0x8e5660b4ab70168b5a6feea0e0315cb49c8cd539',
  '0x388fe75d523963c68f5741700403ca285bda5225',
  '0xf9f68fc85cc9791d264477d1bb1aa649f022e9dc',
  '0xcdd598d1588503e1609ae1e50cdb74473ffb0090',
  '0xb9f46b3c2e79238e01f510a60846bf5dcc981bc3',
  '0x1ea027314c055705ac09d9bc742e6eacc7a1ceb2',
  '0x2a9da28bcbf97a8c008fd211f5127b860613922d',
  '0x7c6eda316fc4abf1efaba8015e6ff04b241fcb35',
]

const CURATION_FEE_CONTRACTS = [
  '0x0babda04f62c549a09ef3313fe187f29c099ff3c',
  '0x9d32aac179153a991e832550d9f96441ea27763a',
]

const WEARABLE_CONTRACTS = [
  '0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd', // ExclusiveMasksCollection
  '0xc1f4b0eea2bd6690930e6c66efd3e197d620b9c2', // Halloween2019Collection
  '0xc3af02c0fd486c8e9da5788b915d6fff3f049866', // Xmas2019Collection
  '0xf64dc33a192e056bb5f0e5049356a0498b502d50', // MCHCollection
  '0x32b7495895264ac9d0b12d32afd435453458b1c6', // CommunityContestCollection
  '0xd35147be6401dcb20811f2104c33de8e97ed6818', // DCLLaunchCollection
  '0x3163d2cfee3183f9874e2869942cc62649eeb004', // DCGCollection
  '0x201c3af8c471e5842428b74d1e7c0249adda2a92', // StaySafeCollection
  '0x6a99abebb48819d2abe92c5e4dc4f48dc09a3ee8', // Moonshot2020Collection
  '0x1e1d4e6262787c8a8783a37fee698bd42aa42bec', // DappcraftMoonminerCollection
  '0xbf53c33235cbfc22cef5a61a83484b86342679c5', // DGSummer2020Collection
  '0x75a3752579dc2d63ca229eebbe3537fbabf85a12', // PMOuttathisworldCollection
  '0x574f64ac2e7215cba9752b85fc73030f35166bc0', // DgtbleHeadspaceCollection
  '0x34ed0aa248f60f54dd32fbc9883d6137a491f4f3', // WonderzoneMeteorchaserCollection
  '0xa8ee490e4c4da48cc1653502c1a77479d4d818de', // BinanceUsCollection
  '0x09305998a531fade369ebe30adf868c96a34e813', // PMDreamverseEminence
  '0x24d538a6265b006d4b53c45ba91af5ef60dca6cb', // CybermikeCyberSoldier
  '0xe7a64f6a239ed7f5bf18caa1ce2920d0c1278129', // DCMeta
  '0x5df4602e7f38a91ea7724fc167f0c67f61604b1e', // WZWonderbot
  '0x7038e9d2c6f5f84469a84cf9bc5f4909bb6ac5e0', // DGFall2020
  '0x30d3387ff3de2a21bef7032f82d00ff7739e403c', // MFSammichgamer
  '0xb5d14052d1e2bce2a2d7459d0379256e632b855d', // SugarclubYumi
  '0x54266bcf2ffa841af934f003d144957d5934f3ab', // EtheremonWearables
  '0x60d8271c501501c4b8cd9ed5343ac59d1b79d993', // MLPekingopera
  '0x90958d4531258ca11d18396d4174a007edbc2b42', // ChinaFlying
  '0x480a0f4e360e8964e68858dd231c2922f1df45ef', // TechTribalMarc0matic
  '0x5cf39e64392c615fd8086838883958752a11b486', // DigitalAlchemy
  '0xc3ca6c364b854fd0a653a43f8344f8c22ddfdd26', // CZMercenaryMTZ
  '0xb96697fa4a3361ba35b774a42c58daccaad1b8e1', // WonderzoneSteampunk
  '0x102daabd1e9d294d4436ec4c521dce7b1f15499e', // DCNiftyblocksmith
  '0xfeb52cbf71b9adac957c6f948a6cf9980ac8c907', // Halloween2020Collection
  '0xecf073f91101ce5628669c487aee8f5822a101b1', // Xmas2020Collection
  '0x1a57f6afc902d25792c53b8f19b7e17ef84222d5', // MemeDontBuyThis
  '0xffc5043d9a00865d089d5eefa5b3d1625aec6763', // ReleaseTheKraken
  '0xe1ecb4e5130f493551c7d6df96ad19e5b431a0a9', // 3LAUBasics
  '0xdd9c7bc159dacb19c9f6b9d7e23948c87aa2397f', // XmashUp2020
  '0x0b1c6c75d511fae05e7dc696f4cf14129a9c43c9', // MLLiondance
  '0x4c290f486bae507719c562b6b524bdb71a2570c9', // AtariLaunch
  '0x6b47e7066c7db71aa04a1d5872496fe05c4c331f', // RTFKTXAtari
  '0x68e139552c4077ce5c9ab929c7e18ca721ffff00', // RACBasics
  '0xc82a864a94db3550bc71fcb4ce07228bcec21f1a', // WinklevossCapital
  '0x51e0b1afe5da0c038fc93a3fc8e11cf7a238b40b', // DGAtariDillonFranci
]

function toRecord(addresses: string[], tag: TagType) {
  return addresses.reduce((accumulator, address) => {
    accumulator[address.toLowerCase()] = tag
    return accumulator
  }, {} as Record<string, TagType>)
}

const CURATORS_PAYMENT_ADDRESSES = [
  '0x5d7846007c1dd6dca25d16ce2f71ec13bcdcf6f0',
  '0x716954738e57686a08902d9dd586e813490fee23',
  '0xc958f028d1b871ab2e32c2abda54f37191efe0c2',
  '0x82d54417fc69681dc74a6c0c68c6dbad5a2857b9',
  '0x9db59920d3776c2d8a3aa0cbd7b16d81fcab0a2b',
  '0x91e222ed7598efbcfe7190481f2fd14897e168c8',
  '0x6cdfdb9a4d99f16b5607cab1d00c792206db554e',
  '0x862f109696d7121438642a78b3caa38f476db08b',
  '0xc8ad6322821b51da766a4b2a82b39fb72b53d276',
  '0xa8c7d5818a255a1856b31177e5c96e1d61c83991',
  '0x336685bb3a96e13b77e909d7c52e8afcff1e859e',
  '0x41eb5f82af60873b3c14fedb898a1712f5c35366',
  '0x470c33abd57166940095d59bd8dd573cbae556c3',
  '0x1dec5f50cb1467f505bb3ddfd408805114406b10',
  '0x5ce9fb617333b8c5a8f7787710f7c07002cb3516',
  '0x805797df0c0d7d70e14230b72e30171d730da55e'
]
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
