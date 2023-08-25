export interface Vote {
  voter: string
}

export interface MemberVP {
  totalVP: number
  manaVP: number
  landVP: number
  estateVP: number
  namesVP: number
  delegatedVP: number
  l1WearablesVP: number
  rentalVP: number
}

export type MemberInfo = MemberVP & {
  address: string
  avatarPreview: string
  hasDelegated: boolean
  hasDelegators: boolean
  delegate?: string
  delegators?: string[]
  delegatorsAmount: number
}

export interface DCLMember {
  address: string
  name: string
  avatar: string
}

export interface Delegation {
  delegator: string
  delegate: string
}

export interface ReceivedDelegations {
  delegators: string[]
  delegate: string
}

export interface DelegationInfo {
  givenDelegations: Delegation[]
  receivedDelegations: ReceivedDelegations[]
}

export const CATALYSTS = [
  'peer-ec1.decentraland.org',
  'peer-ec2.decentraland.org',
  'peer-wc1.decentraland.org',
  'peer-eu1.decentraland.org',
  'peer-ap1.decentraland.org',
  'interconnected.online',
  'peer.decentral.io',
  'peer.melonwave.com',
  'peer.kyllian.me',
  'peer.uadevops.com',
  'peer.dclnodes.io'
]

export interface DCLProfile {
  timestamp: number
  avatars: Avatar[]
}

interface Avatar {
  userId?: string
  email?: string
  name?: string
  hasClaimedName: boolean
  description: string
  ethAddress?: string
  version?: number
  avatar: AvatarConfig
  tutorialStep?: number
  interests?: any[]
  unclaimedName?: string
  inventory?: string[]
  snapshots?: Snapshots
  hasConnectedWeb3?: boolean
  muted?: string[]
  blocked?: string[]
}

interface AvatarConfig {
  bodyShape: string
  snapshots: Snapshots
  eyes: Eyes
  hair: Eyes
  skin: Eyes
  wearables: string[]
  version?: number
}

interface Eyes {
  color: Color
}

interface Color {
  r: number
  g: number
  b: number
  a: number
}

interface Snapshots {
  body: string
  face256: string
}

