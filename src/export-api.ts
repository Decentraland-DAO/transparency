import BALANCES from '../public/balances.json'
import GRANTS from '../public/grants.json'
import TRANSACTIONS from '../public/transactions.json'
import { CurationTeam, DAOCommitteeTeam, SABTeam } from './entities/Teams'
import { TransactionParsed } from './export-transactions'
import { Status } from './interfaces/GovernanceProposal'
import { GrantProposal } from './interfaces/Grant'
import { TransactionDetails } from './interfaces/Transactions/Transactions'
import { TransferType } from './interfaces/Transactions/Transfers'
import { dayToMilisec, getTransactionsPerTag, saveToJSON } from './utils'

const sumQuote = (txs: TransactionParsed[]) => txs.reduce((total, tx) => total + tx.quote, 0)
const getTxsDetails = (txs: Record<string, TransactionDetails>) => Object.keys(txs).map(tag => ({
  name: tag,
  value: txs[tag].total
})).sort((a, b) => b.value - a.value)

async function main() {

  const now = new Date()
  const last30 = new Date(now.getTime() - dayToMilisec(30))
  const last60 = new Date(now.getTime() - dayToMilisec(60))

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

  const data = {
    'balances': BALANCES,
    'income': {
      'total': totalIncome30,
      'previous': incomeDelta,
      'details': getTxsDetails(incomeTaggedTxs)
    },
    'expenses': {
      'total': totalExpenses30,
      'previous': expensesDelta,
      'details': getTxsDetails(expensesTaggedTxs)
    },
    'funding': {
      'total': totalFunding
    },
    'teams': [
      SABTeam.get(),
      DAOCommitteeTeam.get(),
      CurationTeam.get(),
    ]
  }

  saveToJSON('api.json', data)
}

main()
