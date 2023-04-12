import BALANCES from '../public/balances.json'
import GRANTS from '../public/grants.json'
import TRANSACTIONS from '../public/transactions.json'
import { TagCategoryType, Tags } from './entities/Tags'
import { CurationCommittee, DAOCommittee, SABCommittee } from './entities/Teams'
import { TransactionParsed } from './export-transactions'
import { BalanceDetails } from './interfaces/Api'
import { Status } from './interfaces/GovernanceProposal'
import { GrantProposal } from './interfaces/Grant'
import { TransactionDetails } from './interfaces/Transactions/Transactions'
import { TransferType } from './interfaces/Transactions/Transfers'
import { dayToMillisec, getTransactionsPerTag, reportToRollbarAndThrow, saveToJSON } from './utils'

function getTxsDetails(txs: Record<string, TransactionDetails>): BalanceDetails[] {
  const groupedTxs: Record<string, BalanceDetails> = {}

  for (const [tag, values] of Object.entries(txs)) {
    if (!Tags.isExportedTag(tag)) {
      continue
    }

    const tagCategory = Tags.getExportedTagCategory(tag)

    if (!groupedTxs[tagCategory.name]) {
      groupedTxs[tagCategory.name] = { ...tagCategory, value: values.total.toNumber() }
    } else {
      groupedTxs[tagCategory.name].value += values.total.toNumber()
    }
  }

  const sortedDetails = Object.values(groupedTxs).sort((a, b) => b.value - a.value)

  // the "Other" tag is always last
  sortedDetails.push(sortedDetails.splice(sortedDetails.findIndex(detail => detail.name === Tags.getTagCategory(TagCategoryType.OTHER).name), 1)[0])

  return sortedDetails
}

const sumQuote = (txs: TransactionParsed[]) => txs.reduce((total, tx) => total + tx.quote, 0)

async function main() {

  const now = new Date()
  const last30 = new Date(now.getTime() - dayToMillisec(30))
  const last60 = new Date(now.getTime() - dayToMillisec(60))

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
    'committees': [
      SABCommittee.toJson(),
      DAOCommittee.toJson(),
      CurationCommittee.toJson()
    ]
  }

  saveToJSON('api.json', data)
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))