export interface GovernanceProposal {
  id: string
  snapshot_id: string
  snapshot_space: SnapshotSpace
  snapshot_proposal: SnapshotProposal
  snapshot_signature: string
  snapshot_network: string
  discourse_id: number
  discourse_topic_id: number
  discourse_topic_slug: string
  user: string
  type: GovernanceProposalType
  status: Status
  title: string
  description: string
  configuration: Configuration
  enacted: boolean
  enacted_description: null | string
  enacting_tx: string | null
  deleted: boolean
  start_at: Date
  finish_at: Date
  created_at: Date
  updated_at: Date
  enacted_by: string | null
  deleted_by: string | null
  required_to_pass: number
  vesting_address: string | null
  textsearch: string
}

export interface Configuration {
  x?: number
  y?: number
  type?: ConfigurationType
  description?: string
  choices: string[]
  title?: string
  abstract?: string
  category?: Category
  tier?: string
  size?: number
  beneficiary?: string
  specification?: string
  personnel?: string
  roadmap?: string
  name?: string
  links?: string[]
  nft_collections?: string
  items?: number
  smart_contract?: string[]
  governance?: string
  motivation?: string
  managers?: string[]
  programmatically_generated?: boolean
  method?: string
  linked_proposal_id?: string
  summary?: string
  impacts?: string
  implementation_pathways?: string
  conclusion?: string
}

export enum Category {
  Community = 'Community',
  ContentCreator = 'Content Creator',
  Gaming = 'Gaming',
  PlatformContributor = 'Platform Contributor',
}

export enum ConfigurationType {
  AddPoi = 'add_poi',
  RemovePoi = 'remove_poi',
}

export interface SnapshotProposal {
  name: string
  body: string
  choices: string[]
  snapshot: number
  end: number
  start: number
  metadata: Metadata
}

export interface Metadata {
  network: string
  strategies: MetadataStrategy[]
}

export interface MetadataStrategy {
  name: Name
  network?: string
  params: MetadataStrategyParams
}

export enum Name {
  DecentralandEstateSize = 'decentraland-estate-size',
  Delegation = 'delegation',
  Erc20BalanceOf = 'erc20-balance-of',
  Erc721WithMultiplier = 'erc721-with-multiplier',
  Multichain = 'multichain',
}

export interface MetadataStrategyParams {
  address?: string
  decimals?: number
  symbol?: Symbol
  multiplier?: number
  name?: Name
  graphs?: Graphs
  strategies?: MetadataStrategy[]
}

export interface Graphs {
  '137': string
}

export enum Symbol {
  ESTATE = 'ESTATE',
  LAND = 'LAND',
  MANA = 'MANA',
  NAMES = 'NAMES',
  VP_DELEGATED = 'VP (delegated)',
  WMANA = 'WMANA',
}

export enum SnapshotSpace {
  SNAPSHOT_DCL_ETH = 'snapshot.dcl.eth',
}

export enum Status {
  ACTIVE = 'active',
  ENACTED = 'enacted',
  FINISHED = 'finished',
  PASSED = 'passed',
  REJECTED = 'rejected',
}

export enum GovernanceProposalType {
  BAN_NAME = 'ban_name',
  DRAFT = 'draft',
  GOVERNANCE = 'governance',
  GRANT = 'grant',
  LINKED_WEARABLES = 'linked_wearables',
  POI = 'poi',
  POLL = 'poll',
  CATALYST = 'catalyst'
}
