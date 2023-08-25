import BALANCES from '../public/balances.json'
import GRANTS from '../public/grants.json'
import MEMBERS from '../public/members.json'
import PROPOSALS from '../public/proposals.json'
import TRANSACTIONS from '../public/transactions.json'
import VOTES from '../public/votes.json'
import { BalanceParsed } from './export-balances'
import { TransactionParsed } from './export-transactions'
import { VotesParsed } from './export-votes'
import { GovernanceProposalType, Status } from './interfaces/GovernanceProposal'
import { GrantProposal } from './interfaces/Grant'
import { KPI } from './interfaces/KPIs'
import { MemberInfo, MemberVP } from './interfaces/Members'
import { ProposalParsed } from './interfaces/Proposal'
import { FeeDetails } from './interfaces/Transactions/Transactions'
import { TransferType } from './interfaces/Transactions/Transfers'
import { avg, dayToMillisec, getTransactionsPerTag, median, reportToRollbarAndThrow, saveToJSON, sum } from './utils'
import { getDelegatedVPDistributionRows, getRatio, getVPDistributionRows } from './kpis-utils'


function main() {
  const proposals = PROPOSALS as ProposalParsed[]
  const members = MEMBERS as MemberInfo[]
  const votes = VOTES as VotesParsed[]
  const grants = GRANTS as GrantProposal[]
  const transactions = TRANSACTIONS as TransactionParsed[]
  const balances = BALANCES as BalanceParsed[]

  const vpSources: (keyof MemberVP)[] = ['totalVP', 'manaVP', 'landVP', 'namesVP', 'delegatedVP', 'l1WearablesVP', 'rentalVP', 'estateVP']
  const totalVP = sum(members.map(member => member.totalVP))

  const kpis: KPI[] = [
    {
      header: ['Proposals'],
      rows: [
        ['DAO Launch', '5/24/2021', new Date().toLocaleDateString('en-US')],
        ['Proposals created', proposals.length]
      ]
    },
    {
      header: ['Proposals by Status', 'Amount', 'Percentage'],
      rows: getRowsByProposalStatus(proposals)
    },
    {
      header: ['Proposals by Type', 'Amount', 'Percentage'],
      rows: Object.values(GovernanceProposalType).map(type => {
        const count = proposals.filter(p => p.type === type).length
        return [type, count, getRatio(count, proposals.length)]
      })
    },
    {
      header: ['VP sources', 'Members', 'VP Amount', 'VP percentage'],
      rows: vpSources.map(source => {
        if (source === 'totalVP') {
          return [source, '', Math.round(totalVP)]
        }

        const filteredMembers = members.filter(member => member[source] > 0)
        const value = sum(filteredMembers.map(member => member[source]))
        return [source, filteredMembers.length, Math.round(value), getRatio(value, totalVP)]
      })
    },
    {
      header: ['VP Distribution', 'Members', 'Members Percentage', 'Total VP', 'VP percentage'],
      rows: getVPDistributionRows(members, totalVP)
    },
    {
      header: ['Delegated VP Distribution', 'Amount', 'VP percentage'],
      rows: getDelegatedVPDistributionRows(members)
    },
    {
      header: ['Participation'],
      rows: getParticipationRows(members, proposals, votes)
    },
    {
      header: ['Grants', 'Amount', 'Percentage'],
      rows: getGrantRows(grants)
    },
    {
      header: ['Balance Summary', 'Total USD'],
      rows: getBalanceSummaryRows(balances)
    },
    {
      header: ['Transactions', 'Amount', 'Total USD'],
      rows: getTransactionRows(transactions)
    },
    {
      header: ['Out txs fees', 'Number of transactions', 'Total USD', 'Average USD per transaction'],
      rows: getFees(transactions, TransferType.OUT)
    },
    {
      header: ['Income Sources', 'Amount', 'Total USD'],
      rows: getTransactionsPerTagRows(transactions, TransferType.IN)
    },
    {
      header: ['Expenses Destinations', 'Amount', 'Total USD'],
      rows: getTransactionsPerTagRows(transactions, TransferType.OUT)
    }
  ]

  saveToJSON('kpis.json', kpis)
}

try {
  main()
} catch (error) {
  reportToRollbarAndThrow(__filename, error)
}


function getRowsByProposalStatus(proposals: ProposalParsed[]) {
  return Object.values(Status).map(status => {
    const count = proposals.filter(p => p.status === status).length
    return [status, count, getRatio(count, proposals.length)]
  })
}

function getParticipationRows(members: MemberInfo[], proposals: ProposalParsed[], votes: VotesParsed[]) {
  const proposalVotes = proposals.map(p => p.votes)
  const proposalVP = proposals.map(p => p.scores_total)

  return [
    ['Active members', members.length],
    ['Total Votes', votes.length],
    ['Max votes in a proposal', Math.max(...proposalVotes)],
    ['Max VP in a proposal', Math.round(Math.max(...proposalVP))],
    ['Median votes per proposal', Math.round(median(proposalVotes))],
    ['Avg votes per proposal', Math.round(avg(proposalVotes))],
    ['Median VP per proposal', Math.round(median(proposalVP))],
    ['Avg VP per proposal', Math.round(avg(proposalVP))]
  ]

}

function getGrantRows(grants: GrantProposal[]) {

  const grantEnacted = grants.filter(g => g.status === Status.ENACTED)
  const fundsGranted = sum(grantEnacted.map(g => g.size))

  return [['Grants Submitted', grants.length]]
    .concat(getRowsByProposalStatus(grants))
    .concat([['Total Funds Granted', fundsGranted]])
}

function getTransactionRows(transactions: TransactionParsed[]) {
  const inTxns = transactions.filter(tx => tx.type === TransferType.IN)
  const outTxns = transactions.filter(tx => tx.type === TransferType.OUT)
  const innerTxns = transactions.filter(tx => tx.type === TransferType.INTERNAL)

  return [
    ['Total Txs', transactions.length, sum(transactions.map(tx => tx.quote))],
    ['Total In', inTxns.length, sum(inTxns.map(tx => tx.quote))],
    ['Total Out', outTxns.length, sum(outTxns.map(tx => tx.quote))],
    ['Total Internal', innerTxns.length, sum(innerTxns.map(tx => tx.quote))]
  ]
}

function getTransactionsPerTagRows(transactions: TransactionParsed[], type: TransferType) {
  const filteredTxns = transactions.filter(tx => tx.type === type)
  const group = getTransactionsPerTag(filteredTxns)

  return Object.keys(group).map(tag => [tag, group[tag].count, group[tag].total.toFixed(2)])
}

function getFees(transactions: TransactionParsed[], type: TransferType) {
  const filteredTxns = transactions.filter(tx => tx.type === type)
  const uniqueTxns: Record<string, FeeDetails> = {}
  const today = new Date()

  type DateFilter = (details: FeeDetails) => boolean

  const filterDays = (details: FeeDetails, days: number) => {
    const minDate = new Date(today.getTime() - dayToMillisec(days))
    return details.date >= minDate
  }

  const filters: Record<string, DateFilter> = {
    'Last year': (details) => filterDays(details, 365),
    'Last 6 months': (details) => filterDays(details, 180),
    'Last 60 days': (details) => filterDays(details, 60),
    'Last 30 days': (details) => filterDays(details, 30),
    [`This month (${today.toLocaleString('en-US', { month: 'short' })})`]: (details) => details.date.getMonth() === today.getMonth()
  }

  for (const tx of filteredTxns) {
    uniqueTxns[tx.hash] = { date: new Date(tx.date), fee: tx.fee }
  }

  let rows: any[] = []

  let feeDetails = Object.values(uniqueTxns)

  for (const key of Object.keys(filters)) {
    let fees = 0
    let count = 0
    const currentDetails: FeeDetails[] = []

    for (const details of feeDetails) {
      if (filters[key](details)) {
        fees += details.fee
        count += 1
        currentDetails.push(details)
      }
    }

    feeDetails = [...currentDetails]

    rows = [[key, count, fees.toFixed(2), count > 0 ? (fees / count).toFixed(2) : 0], ...rows]
  }

  return rows
}

function getBalanceSummaryRows(balances: BalanceParsed[]) {
  const wallets: Record<string, number> = {}
  for (const balance of balances) {
    const key = `${balance.name} - ${balance.network}`
    if (wallets[key]) {
      wallets[key] += balance.quote
    } else {
      wallets[key] = balance.quote
    }
  }

  return Object.keys(wallets).map(name => [name, wallets[name].toFixed(2)])
}
