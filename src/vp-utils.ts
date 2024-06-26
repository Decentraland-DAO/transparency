import { MemberVP } from './interfaces/Members'
import { getChecksumAddress, reportToRollbar } from './utils'

export enum StrategyOrder {
  WrappedMana,
  Land,
  Estate,
  Mana,
  Names,
  Delegation,
  L1Wearables,
  Rental,
}

export const STRATEGIES = [
  {
    'name': 'erc20-balance-of',
    'network': '1',
    'params': {
      'symbol': 'WMANA',
      'address': '0xfd09cf7cfffa9932e33668311c4777cb9db3c9be',
      'decimals': 18
    }
  },
  {
    'name': 'erc721-with-multiplier',
    'network': '1',
    'params': {
      'symbol': 'LAND',
      'address': '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
      'multiplier': 2000
    }
  },
  {
    'name': 'decentraland-estate-size',
    'network': '1',
    'params': {
      'symbol': 'ESTATE',
      'address': '0x959e104e1a4db6317fa58f8295f586e1a978c297',
      'multiplier': 2000
    }
  },
  {
    'name': 'multichain',
    'network': '1',
    'params': {
      'name': 'multichain',
      'graphs': {
        '137': 'https://subgraph.decentraland.org/blocks-matic-mainnet'
      },
      'symbol': 'MANA',
      'strategies': [
        {
          'name': 'erc20-balance-of',
          'params': {
            'address': '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
            'decimals': 18
          },
          'network': '1'
        },
        {
          'name': 'erc20-balance-of',
          'params': {
            'address': '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4',
            'decimals': 18
          },
          'network': '137'
        }
      ]
    }
  },
  {
    'name': 'erc721-with-multiplier',
    'network': '1',
    'params': {
      'symbol': 'NAMES',
      'address': '0x2a187453064356c898cae034eaed119e1663acb8',
      'multiplier': 100
    }
  },
  {
    'name': 'delegation',
    'network': '1',
    'params': {
      'symbol': 'VP (delegated)',
      'strategies': [
        {
          'name': 'erc20-balance-of',
          'params': {
            'symbol': 'WMANA',
            'address': '0xfd09cf7cfffa9932e33668311c4777cb9db3c9be',
            'decimals': 18
          }
        },
        {
          'name': 'erc721-with-multiplier',
          'params': {
            'symbol': 'LAND',
            'address': '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
            'multiplier': 2000
          }
        },
        {
          'name': 'decentraland-estate-size',
          'params': {
            'symbol': 'ESTATE',
            'address': '0x959e104e1a4db6317fa58f8295f586e1a978c297',
            'multiplier': 2000
          }
        },
        {
          'name': 'multichain',
          'params': {
            'name': 'multichain',
            'graphs': {
              '137': 'https://subgraph.decentraland.org/blocks-matic-mainnet'
            },
            'symbol': 'MANA',
            'strategies': [
              {
                'name': 'erc20-balance-of',
                'params': {
                  'address': '0x0f5d2fb29fb7d3cfee444a200298f468908cc942',
                  'decimals': 18
                },
                'network': '1'
              },
              {
                'name': 'erc20-balance-of',
                'params': {
                  'address': '0xa1c57f48f0deb89f569dfbe6e2b7f46d33606fd4',
                  'decimals': 18
                },
                'network': '137'
              }
            ]
          }
        },
        {
          'name': 'erc721-with-multiplier',
          'params': {
            'symbol': 'NAMES',
            'address': '0x2a187453064356c898cae034eaed119e1663acb8',
            'multiplier': 100
          }
        },
        {
          'name': 'decentraland-wearable-rarity',
          'params': {
            'symbol': 'WEARABLE',
            'collections': [
              '0x32b7495895264ac9d0b12d32afd435453458b1c6',
              '0xd35147be6401dcb20811f2104c33de8e97ed6818',
              '0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd',
              '0xc1f4b0eea2bd6690930e6c66efd3e197d620b9c2',
              '0xf64dc33a192e056bb5f0e5049356a0498b502d50',
              '0xc3af02c0fd486c8e9da5788b915d6fff3f049866'
            ],
            'multipliers': {
              'epic': 10,
              'rare': 5,
              'mythic': 1000,
              'uncommon': 1,
              'legendary': 100
            }
          }
        },
        {
          'name': 'decentraland-rental-lessors',
          'params': {
            'symbol': 'RENTAL',
            'addresses': {
              'land': '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
              'estate': '0x959e104e1a4db6317fa58f8295f586e1a978c297'
            },
            'subgraphs': {
              'rentals': 'https://subgraph.decentraland.org/rentals-ethereum-mainnet',
              'marketplace': 'https://subgraph.decentraland.org/marketplace'
            },
            'multipliers': {
              'land': 2000,
              'estateSize': 2000
            }
          }
        }
      ]
    }
  },
  {
    'name': 'decentraland-wearable-rarity',
    'network': '1',
    'params': {
      'symbol': 'WEARABLE',
      'collections': [
        '0x32b7495895264ac9d0b12d32afd435453458b1c6',
        '0xd35147be6401dcb20811f2104c33de8e97ed6818',
        '0xc04528c14c8ffd84c7c1fb6719b4a89853035cdd',
        '0xc1f4b0eea2bd6690930e6c66efd3e197d620b9c2',
        '0xf64dc33a192e056bb5f0e5049356a0498b502d50',
        '0xc3af02c0fd486c8e9da5788b915d6fff3f049866'
      ],
      'multipliers': {
        'epic': 10,
        'rare': 5,
        'mythic': 1000,
        'uncommon': 1,
        'legendary': 100
      }
    }
  },
  {
    'name': 'decentraland-rental-lessors',
    'network': '1',
    'params': {
      'symbol': 'RENTAL',
      'addresses': {
        'land': '0xf87e31492faf9a91b02ee0deaad50d51d56d5d4d',
        'estate': '0x959e104e1a4db6317fa58f8295f586e1a978c297'
      },
      'subgraphs': {
        'rentals': 'https://subgraph.decentraland.org/rentals-ethereum-mainnet',
        'marketplace': 'https://subgraph.decentraland.org/marketplace'
      },
      'multipliers': {
        'land': 2000,
        'estateSize': 2000
      }
    }
  }
]

const AVAILABLE_STRATEGIES_COUNT = STRATEGIES.length

function getScore(scores: number[], strategyOrder: number) {
  return scores[strategyOrder] || 0
}

export function parseVP(scores: number[]): MemberVP {
  if (scores.length > AVAILABLE_STRATEGIES_COUNT) {
    reportToRollbar(`New score strategy detected ${scores}`)
  } else if (scores.length !== 4 && scores.length !== 6 && scores.length !== 7 && scores.length !== AVAILABLE_STRATEGIES_COUNT) {
    reportToRollbar(`Invalid VP scores length ${scores}`)
  }

  return {
    totalVP: scores.reduce((acc, val) => acc + val, 0),
    manaVP: getScore(scores, StrategyOrder.WrappedMana) + getScore(scores, StrategyOrder.Mana),
    landVP: getScore(scores, StrategyOrder.Land),
    estateVP: getScore(scores, StrategyOrder.Estate),
    namesVP: getScore(scores, StrategyOrder.Names),
    delegatedVP: getScore(scores, StrategyOrder.Delegation),
    l1WearablesVP: getScore(scores, StrategyOrder.L1Wearables),
    rentalVP: getScore(scores, StrategyOrder.Rental)
  }
}

export function getScoresForAddress(snapshotScores: Record<string, number>[], address: string) {
  const scores: number[] = Array<number>(STRATEGIES.length).fill(0)
  for (const idx in snapshotScores) {
    scores[idx] = snapshotScores[idx][getChecksumAddress(address)] || snapshotScores[idx][address.toLowerCase()] || 0
  }
  return scores
}