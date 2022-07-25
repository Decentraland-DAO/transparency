import BALANCES from '../public/balances.json'
import GRANTS from '../public/grants.json'
import TRANSACTIONS from '../public/transactions.json'
import { TransactionParsed } from './export-transactions'
import { BalanceDetails } from './interfaces/Api'
import { Status } from './interfaces/GovernanceProposal'
import { GrantProposal } from './interfaces/Grant'
import { TransactionDetails } from './interfaces/Transactions/Transactions'
import { TransferType } from './interfaces/Transactions/Transfers'
import { getTransactionsPerTag, saveToJSON } from './utils'

const tagDescriptions: Record<string, string> = {
  'ESTATE DCL Marketplace Sales Fee': 'Funds corresponding to the 2.5% fee applied to every ESTATE transaction (Minting or secondary)',
  'LAND  DCL Marketplace Sales Fee': 'Funds corresponding to the 2.5% fee applied to every LAND transaction (Minting or secondary)',
  'NAME DCL Marketplace Sales Fee': 'Funds corresponding to the 2.5% fee applied to every NAME transaction (Minting or secondary)',
  'Wearable L1 Sales Fee': 'Funds corresponding to the 2.5% fee applied to every Wearable transaction on Ethereum (Minting or secondary)',
  'LooksRare Marketplace Fee': 'Funds corresponding to the 2.5% fee applied to every transaction (ESTATE, LAND, NAME & Wearables) on LooksRare marketplace',
  'OpenSea Marketplace Fee': 'Funds corresponding to the 2.5% fee applied to every transaction (ESTATE, LAND, NAME & Wearables) on OpenSea marketplace',
  'Wearable Submission Fee': 'Funds corresponding to the fee applied to every new Wearable submission to the Decentraland Marketplace',
  'Wearables Minting Fee': 'Funds corresponding to the 2.5% fee applied to Wearables minting on Polygon network via the Decentraland Marketplace',
  'DAO Committee': 'Transactions between the DAO Treasury and the DAO Committee wallets (e.g. Transaction gas refunds)',
  'Community Grants Payout': 'Transactions corresponding to the funding of the vesting contracts for approved DAO Community Grants projects',
  'Wearable Curators Committee Payout': 'Transactions corresponding to the payout of compensations for members of the Wearables Curation Committee',
  'Community Facilitation Payout': 'Transactions corresponding to the payout for monthly compensations of the DAO Facilitator role',
  'MANA Vesting Contract': 'Funds corresponding to the 10-year MANA vesting contract that the DAO holds',
  'Other': 'Non-categorized or one-off transactions',
}

const tagGrouping: Record<string, string> = {
  'ESTATE fee :: BID': 'ESTATE DCL Marketplace Sales Fee',
  'Secondary Sale :: ESTATE fee': 'ESTATE DCL Marketplace Sales Fee',

  'LAND fee :: BID': 'LAND  DCL Marketplace Sales Fee',
  'Secondary Sale :: LAND fee': 'LAND  DCL Marketplace Sales Fee',

  'NAME fee :: BID': 'NAME DCL Marketplace Sales Fee',
  'Secondary Sale :: NAME fee': 'NAME DCL Marketplace Sales Fee',

  'Wearable L1 fee :: BID': 'Wearable L1 Sales Fee',
  'Secondary Sale :: Wearable L1 fee': 'Wearable L1 Sales Fee',

  'LooksRare': 'LooksRare Marketplace Fee',
  'OpenSea': 'OpenSea Marketplace Fee',
  'Curation fee': 'Wearable Submission Fee',
  'MATIC Marketplace': 'Wearables Minting Fee',
  'DAO Committee Member': 'DAO Committee',
  'Grant': 'Community Grants Payout',
  'Curator': 'Wearable Curators Committee Payout',
  'Facilitator': 'Community Facilitation Payout',
  'Vesting Contract': 'MANA Vesting Contract',
  'OTHER': 'Other',
}

function getTxsDetails(txs: Record<string, TransactionDetails>): BalanceDetails[] {
  const groupedTxs: Record<string, number> = {}
  const availableTags = new Set(Object.keys(tagGrouping))

  for (const [tag, values] of Object.entries(txs)) {
    if (!availableTags.has(tag)) {
      continue
    }

    if (!groupedTxs[tagGrouping[tag]]) {
      groupedTxs[tagGrouping[tag]] = values.total
    }
    else {
      groupedTxs[tagGrouping[tag]] += values.total
    }
  }

  const sortedDetails = Object.entries(groupedTxs).map<BalanceDetails>(([tag, value]) => ({
    name: tag,
    value,
    description: tagDescriptions[tag] || '',
  })).sort((a, b) => b.value - a.value)

  // the "Other" tag is always last
  sortedDetails.push(sortedDetails.splice(sortedDetails.findIndex(d => d.name === 'Other'), 1)[0])

  return sortedDetails
}

const sumQuote = (txs: TransactionParsed[]) => txs.reduce((total, tx) => total + tx.quote, 0)

async function main() {

  const now = new Date()
  const last30 = new Date(now.getTime() - (1000 * 3600 * 24 * 30))
  const last60 = new Date(now.getTime() - (1000 * 3600 * 24 * 60))

  const txs = TRANSACTIONS as TransactionParsed[]

  const incomeTxs = txs.filter(tx => tx.type === TransferType.IN)
  const incomeTxs30 = incomeTxs.filter(tx => new Date(tx.date) >= last30)
  const totalIncome30 = sumQuote(incomeTxs30)

  const incomeTxs60 = incomeTxs.filter(tx => new Date(tx.date) >= last60 && new Date(tx.date) < last30)
  const totalIncome60 = sumQuote(incomeTxs60)
  const incomeDelta = (totalIncome30 - totalIncome60) * 100 / totalIncome60

  const incomeTaggedTxs = getTransactionsPerTag(incomeTxs30)

  const expensesTxs = txs.filter(tx => tx.type === TransferType.OUT)
  const expensesTxs30 = expensesTxs.filter(tx => new Date(tx.date) >= last30)
  const totalExpenses30 = sumQuote(expensesTxs30)

  const expensesTxs60 = expensesTxs.filter(tx => new Date(tx.date) >= last60 && new Date(tx.date) < last30)
  const totalExpenses60 = sumQuote(expensesTxs60)
  const expensesDelta = (totalExpenses30 - totalExpenses60) * 100 / totalExpenses60

  const expensesTaggedTxs = getTransactionsPerTag(expensesTxs30)

  const grants = GRANTS as GrantProposal[]
  const totalFunding = grants.filter(g => g.status === Status.ENACTED).reduce((a, g) => a + g.size, 0)

  const incomeDetails = getTxsDetails(incomeTaggedTxs)
  const expensesDetails = getTxsDetails(expensesTaggedTxs)

  const data = {
    'balances': BALANCES,
    'income': {
      'total': incomeDetails.reduce((acc, cur) => acc + cur.value, 0),
      'previous': incomeDelta,
      'details': incomeDetails
    },
    'expenses': {
      'total': expensesDetails.reduce((acc, cur) => acc + cur.value, 0),
      'previous': expensesDelta,
      'details': expensesDetails
    },
    'funding': {
      'total': totalFunding
    },
    'teams': [
      {
        'name': 'Security Advisory Board',
        'description': 'Responsable to overview the sensible operations of the DAO, with the power to halt operations initiated by the DAO Committee or the Community. They advise in the best course of action for technical operations involving the DAO\'s smart contracts.',
        'members': [
          {
            'address': '0xbcac4dafb7e215f2f6cb3312af6d5e4f9d9e7eda',
            'name': 'Ignacio',
            'avatar': 'https://decentraland.org/images/male.png'
          },
          {
            'address': '0xfc4ef0903bb924d06db9cbaba1e4bda6b71d2f82',
            'name': 'Brett',
            'avatar': 'https://decentraland.org/images/male.png'
          },
          {
            'address': '0x48850327b81D0c924Ad212891C7223c2ea5Cd426',
            'name': 'Kyllian',
            'avatar': 'https://peer.decentraland.org/content/contents/QmawhssHwbFsSNfW47bvkUtXq7CzitxQ3idzYoWeZBaYJX'
          },
          {
            'address': '0x42ebd2ab698ba74eec1d2a81c376ea2c38c05249',
            'name': 'Agustin',
            'avatar': 'https://decentraland.org/images/male.png'
          },
          {
            'address': '0x759605f5497c578988d167e2f66d4955d35e77af',
            'name': 'Ariel',
            'avatar': 'https://decentraland.org/images/male.png'
          }
        ]
      },
      {
        'name': 'DAO Committee',
        'description': 'Their principal responsibility is to enact binding proposals on-chain like listing Point of Interests, sending Grants, and any other operations involving the DAO\'s smart contracts.',
        'members': [
          {
            'address': '0xfe91C0c482E09600f2d1DBCA10FD705BC6de60bc',
            'name': 'Yemel',
            'avatar': 'https://peer.decentraland.org/content/contents/QmUvDC3wSSTg7Hnej2A6sp3KZPqSULtvkJfvMBJBrLSb8p'
          },
          {
            'address': '0xBef99f5f55CF7cDb3a70998C57061B7e1386a9b0',
            'name': 'Kyllian',
            'avatar': 'https://decentraland.org/images/male.png'
          }
        ]
      },
      {
        'name': 'Wearable Curation Team',
        'description': 'Responsible for reviewing new wearable submissions ensuring they are glitch-free and compliant with the design guidelines. They also rise warnings about IP infringement and violent content.',
        'members': [
          {
            'address': '0x8938d1f65abe7750b0777206ee26c974a6721194',
            'name': 'Shibu',
            'avatar': 'https://peer.decentraland.org/content/contents/Qma12zSYqq3zN6kRdVG57fE1L1ejwFaGVoWesWvJQ5nwsQ'
          },
          {
            'address': '0x7a3891acf4f3b810992c4c6388f2e37357d7d3ab',
            'name': 'JP',
            'avatar': 'https://peer.decentraland.org/content/contents/QmSP9nM8bWDCWnSZry7bveufHyXAYNc7WKmkcvMdfd6vy7'
          },
          {
            'address': '0x5d7846007c1dd6dca25d16ce2f71ec13bcdcf6f0',
            'name': 'Lau',
            'avatar': 'https://peer.decentraland.org/content/contents/QmPKxjopunHgfp9ezgTUdpDTNv6EWuJnvijMqixrSM7tGE'
          },
          {
            'address': '0x716954738e57686a08902d9dd586e813490fee23',
            'name': 'Hirotokai',
            'avatar': 'https://peer.decentraland.org/content/contents/QmToWDDeMkpnpjZq2wQzE4JYLGSHkfL3QVQkHNk97ZsXv7'
          },
          {
            'address': '0x82d54417fc69681dc74a6c0c68c6dbad5a2857b9',
            'name': 'Malloy',
            'avatar': 'https://peer.decentraland.org/content/contents/QmRUop9sik6BmusbhYHymeMwyntiZwECexPksTJNzFu5jB'
          },
          {
            'address': '0x91e222ed7598efbcfe7190481f2fd14897e168c8',
            'name': 'Chestnutbruze',
            'avatar': 'https://peer.decentraland.org/content/contents/QmdAsk9UwnZZgSmcUjY1rb1WeeGRiPznmyqQCXqesHyqx7'
          },
          {
            'address': '0x5E382071464A6F9EA29708A045983dc265B0D86d',
            'name': 'Sango',
            'avatar': 'https://peer.decentraland.org/content/contents/QmU4qcD3x92H5jQ8djuFE8SPYjcLXpQnVELuqhdmR5oVUy'
          },
          {
            'address': '0xc8ad6322821b51da766a4b2a82b39fb72b53d276',
            'name': 'Grimey',
            'avatar': 'https://peer.decentraland.org/content/contents/QmevxQr6eBno2s5yjNpXhyTANx2gQ8xKr3JzcvkTL5DqYA'
          },
          {
            'address': '0xa8c7d5818A255A1856b31177E5c96E1D61c83991',
            'name': 'AndreusAs',
            'avatar': 'https://peer.decentraland.org/content/contents/QmaX2fHvNWNbsGw4sLbaArip9HNk4QjEEdWB7N9uupm2cM'
          },
          {
            'address': '0x336685bb3A96E13B77E909d7C52e8AfCfF1E859E',
            'name': 'Mitch Todd',
            'avatar': 'https://peer.decentraland.org/content/contents/QmXKhoqxauJRUQsghcXULzNBkwyEVw6DFrRhNxmVTnFy8y'
          },
          {
            'address': '0x41eb5F82af60873b3C14fEDB898A1712f5c35366',
            'name': 'Kristian',
            'avatar': 'https://peer.decentraland.org/content/contents/QmTdAJJ2ccL75GUp3kdjkkUvAtqPtEkHhDqXJV57bFAf8V'
          },
          {
            'address': '0x470c33aBD57166940095d59BD8Dd573cBae556c3',
            'name': 'James Guard',
            'avatar': 'https://peer.decentraland.org/content/contents/Qmc8Ff1FtvnkDYY3JCBjyZgT5okeudJPUhF89RtG62oQhV'
          },
          {
            'address': '0x1DeC5f50cB1467F505BB3ddFD408805114406b10',
            'name': 'Fabeeo Breen',
            'avatar': 'https://peer.decentraland.org/content/contents/QmQAUCheYJyaj7T2Uk9rwAqVYabDxpm1AiMxGD4KgLosmu'
          },
          {
            'address': '0x805797Df0c0d7D70E14230b72E30171d730DA55e',
            'name': 'Yannakis',
            'avatar': 'https://peer.decentraland.org/content/contents/QmeobCJZze79Nye5KCaUtAfZ7Z1wkE9Z7youUaDG4TzqbV'
          }
        ]
      }
    ]
  }

  saveToJSON('api.json', data)
}

main()
