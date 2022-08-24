export interface Vote {
  voter: string
}

export interface MemberVP {
  totalVP: number
  manaVP: number
  landVP: number
  namesVP: number
  delegatedVP: number
}

type YesNo = 'Yes' | 'No'

export type MemberInfo = MemberVP & {
  address: string
  avatarPreview: string
  hasDelegated: YesNo
  hasDelegators: YesNo
  delegate?: string
  delegators?: string[]
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
  'peer.dclnodes.io',
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

export const STRATEGIES = [
  {
    "name": "erc20-balance-of",
    "params": {
      "symbol": "WMANA",
      "address": "0xfd09cf7cfffa9932e33668311c4777cb9db3c9be",
      "decimals": 18
    }
  },
  {
    "name": "erc721-with-multiplier",
    "params": {
      "symbol": "LAND",
      "address": "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
      "multiplier": 2000
    }
  },
  {
    "name": "decentraland-estate-size",
    "params": {
      "symbol": "ESTATE",
      "address": "0x959e104e1a4db6317fa58f8295f586e1a978c297",
      "multiplier": 2000
    }
  },
  {
    "name": "multichain",
    "params": {
      "name": "multichain",
      "graphs": {
        "137": "https://api.thegraph.com/subgraphs/name/decentraland/blocks-matic-mainnet"
      },
      "symbol": "MANA",
      "strategies": [
        {
          "name": "erc20-balance-of",
          "params": {
            "address": "0x0f5d2fb29fb7d3cfee444a200298f468908cc942",
            "decimals": 18
          },
          "network": "1"
        },
        {
          "name": "erc20-balance-of",
          "params": {
            "address": "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4",
            "decimals": 18
          },
          "network": "137"
        }
      ]
    }
  },
  {
    "name": "erc721-with-multiplier",
    "params": {
      "symbol": "NAMES",
      "address": "0x2a187453064356c898cae034eaed119e1663acb8",
      "multiplier": 100
    }
  },
  {
    "name": "delegation",
    "params": {
      "symbol": "VP (delegated)",
      "strategies": [
        {
          "name": "erc20-balance-of",
          "params": {
            "symbol": "WMANA",
            "address": "0xfd09cf7cfffa9932e33668311c4777cb9db3c9be",
            "decimals": 18
          }
        },
        {
          "name": "erc721-with-multiplier",
          "params": {
            "symbol": "LAND",
            "address": "0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d",
            "multiplier": 2000
          }
        },
        {
          "name": "decentraland-estate-size",
          "params": {
            "symbol": "ESTATE",
            "address": "0x959e104e1a4db6317fa58f8295f586e1a978c297",
            "multiplier": 2000
          }
        },
        {
          "name": "multichain",
          "params": {
            "name": "multichain",
            "graphs": {
              "137": "https://api.thegraph.com/subgraphs/name/decentraland/blocks-matic-mainnet"
            },
            "symbol": "MANA",
            "strategies": [
              {
                "name": "erc20-balance-of",
                "params": {
                  "address": "0x0f5d2fb29fb7d3cfee444a200298f468908cc942",
                  "decimals": 18
                },
                "network": "1"
              },
              {
                "name": "erc20-balance-of",
                "params": {
                  "address": "0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4",
                  "decimals": 18
                },
                "network": "137"
              }
            ]
          }
        },
        {
          "name": "erc721-with-multiplier",
          "params": {
            "symbol": "NAMES",
            "address": "0x2a187453064356c898cae034eaed119e1663acb8",
            "multiplier": 100
          }
        }
      ]
    }
  }
]