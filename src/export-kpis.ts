import GRANTS from '../public/grants.json'
import MEMBERS from '../public/members.json'
import PROPOSALS from '../public/proposals.json'
import TRANSACTIONS from '../public/transactions.json'
import VOTES from '../public/votes.json'
import { GrantProposal } from './export-grants'
import { MemberInfo } from './export-members'
import { ProposalParsed } from './export-proposals'
import { TransactionParsed } from './export-transactions'
import { VotesParsed } from './export-votes'
import { GovernanceProposalType, Status } from './interfaces/GovernanceProposal'
import { KPI } from './interfaces/KPIs'
import { TransferType } from './interfaces/Transactions/Transfers'
import { avg, median, saveToJSON, sum } from './utils'


function main() {
  const proposals = PROPOSALS as ProposalParsed[]
  const members = MEMBERS as MemberInfo[]
  const votes = VOTES as VotesParsed[]
  const grants = GRANTS as GrantProposal[]
  const transactions = TRANSACTIONS as TransactionParsed[]

  const VPSources = Object.keys(members[0]).slice(1)
  const totalVP = sum(members.map(member => member.totalVP))

  const kpis: KPI[] = [
    {
      header: ['Proposals'],
      rows: [
        ['DAO Launch', '5/24/2021', new Date().toLocaleDateString('en-US')],
        ['Proposals created', proposals.length],
      ],
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
      rows: VPSources.map(source => {
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
      header: ['Participation'],
      rows: getParticipationRows(members, proposals, votes)
    },
    {
      header: ['Grants', 'Amount', 'Percentage'],
      rows: getGrantRows(grants)
    },
    {
      header: ['Transactions', 'Amount', 'Total USD'],
      rows: getTransactionRows(transactions)
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

main()


function getRatio(value: number, total: number) {
  const ratio = value / total
  return `${(ratio * 100).toFixed(2)}%`
}

function getRowsByProposalStatus(proposals: ProposalParsed[]) {
  return Object.values(Status).map(status => {
    const count = proposals.filter(p => p.status === status).length
    return [status, count, getRatio(count, proposals.length)]
  })
}

function getVPDistributionRows(members: MemberInfo[], totalVP: number) {
  const rows: any[] = [['Total Members', members.length, '', Math.round(totalVP)]]
  const limits = [1e6, 1e5, 1e4, 1e3]
  const lookup = {
    "M": 1e6,
    "k": 1e3
  }

  for (let idx = 0; idx < limits.length; idx++) {
    const title = `Members w/ >=${limits[idx] === lookup.M ? '1M' : `${limits[idx] / lookup.k}k`} VP`
    const filteredMembers = members.filter(member => member.totalVP >= limits[idx] && (idx > 0 ? member.totalVP < limits[idx - 1] : true))
    const vp = sum(filteredMembers.map(member => member.totalVP))

    rows.push([title, filteredMembers.length, getRatio(filteredMembers.length, members.length), Math.round(vp), getRatio(vp, totalVP)])
  }

  const title = `Members w/ <1k VP`
  const filteredMembers = members.filter(member => member.totalVP < limits[limits.length - 1])
  const vp = sum(filteredMembers.map(member => member.totalVP))
  rows.push([title, filteredMembers.length, getRatio(filteredMembers.length, members.length), Math.round(vp), getRatio(vp, totalVP)])

  return rows
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
    ['Avg VP per proposal', Math.round(avg(proposalVP))],
  ]

}

function getGrantRows(grants: GrantProposal[]) {

  const grantEnacted = grants.filter(g => g.status === Status.ENACTED)
  const fundsGranted = sum(grantEnacted.map(g => g.grant_size))

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
    ['Total Internal', innerTxns.length, sum(innerTxns.map(tx => tx.quote))],
  ]
}

function getTransactionsPerTagRows(transactions: TransactionParsed[], type: TransferType) {
  const group: Record<string, { count: number, total: number }> = {}
  const filteredTxns = transactions.filter(tx => tx.type === type)
  const rows: any[] = []

  for (const tx of filteredTxns) {
    const result = group[tx.tag]
    if (result) {
      group[tx.tag] = {
        count: result.count + 1,
        total: result.total + tx.quote
      }
    }
    else {
      group[tx.tag] = {
        count: 1,
        total: tx.quote
      }
    }
  }

  for (const tag of Object.keys(group)) {
    rows.push([tag, group[tag].count, group[tag].total.toFixed(2)])
  }

  return rows
}
