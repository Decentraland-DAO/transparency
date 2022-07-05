import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'

import PROPOSALS from '../public/proposals.json'
import VESTING_ABI from './abi/vesting.json'
import { ProposalParsed } from './export-proposals'
import { Category, GovernanceProposalType } from './interfaces/GovernanceProposal'
import { Decimals, Network, NetworkID, Token } from './interfaces/Network'
import { COVALENT_API_KEY, fetchURL, saveToCSV, saveToJSON } from './utils'
import { APITransactions, Decoded, ParamName, TransactionItem } from './interfaces/Transactions/Transactions'


require('dotenv').config()

interface Grant {
  category?: Category
  tier?: string
  size?: number
  beneficiary?: string
  token?: Token
  vesting_released?: number
  vesting_releasable?: number
  vesting_start_at?: Date
  vesting_finish_at?: Date
  tx_date?: Date
  tx_amount?: number
}

export type GrantProposal = Grant & ProposalParsed

const web3 = new Web3(process.env.INFURA_URL)

const DECIMALS = {
  '0x0f5d2fb29fb7d3cfee444a200298f468908cc942': [Token.MANA, Decimals.MANA],
  '0x6b175474e89094c44da98b954eedeac495271d0f': [Token.DAI, Decimals.DAI],
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': [Token.USDC, Decimals.USDC],
  '0xdac17f958d2ee523a2206206994597c13d831ec7': [Token.USDT, Decimals.USDT]
}

function parseNumber(n: number, decimals: number) {
  return new BigNumber(n).dividedBy(10 ** decimals).toNumber()
}

function findTxAmount(decodedLogEvent: Decoded, proposal: Grant & ProposalParsed, decimals: number) {
  decodedLogEvent.params.forEach(param => {
    if (param.name === ParamName.Value) {
      proposal.tx_amount = parseNumber(Number(param.value), decimals)
    }
  })
}

async function fillVestingContractData(proposal: Grant & ProposalParsed) {
  try {
    const contract = new web3.eth.Contract(VESTING_ABI as AbiItem[], proposal.vesting_address)
    const token: string = (await contract.methods.token().call()).toLowerCase()
    const decimals: number = DECIMALS[token][1]
    proposal.token = DECIMALS[token][0]

    proposal.vesting_released = await contract.methods.released().call()
    proposal.vesting_released = parseNumber(proposal.vesting_released, decimals)

    proposal.vesting_releasable = await contract.methods.releasableAmount().call()
    proposal.vesting_releasable = parseNumber(proposal.vesting_releasable, decimals)

    const contractStart: number = await contract.methods.start().call()
    const contractDuration: number = await contract.methods.duration().call()
    const contractEndsTimestamp = Number(contractStart) + Number(contractDuration)
    proposal.vesting_start_at = new Date(contractStart * 1000)
    proposal.vesting_finish_at = new Date(contractEndsTimestamp * 1000)
  } catch (e) {
    console.log(`Error trying to get vesting data for proposal ${proposal.id}`, e)
  }
}

async function fillEnactingTxData(proposal: Grant & ProposalParsed) {
  try {
    const url = `https://api.covalenthq.com/v1/${NetworkID[Network.ETHEREUM]}/transaction_v2/${proposal.enacting_tx}/?key=${COVALENT_API_KEY}`
    const json = await fetchURL(url)
    if (json.error) {
      console.log(`Error trying to get contract data for proposal ${proposal.id}`, json)
      return
    }
    const data: APITransactions = json.data
    const transactions: TransactionItem = data.items[0]

    transactions.log_events.forEach(logEvent => {
      const decodedLogEvent = logEvent.decoded
      if (decodedLogEvent) {
        if (decodedLogEvent.name === 'Transfer') {
          const txMatchesBeneficiary = decodedLogEvent.params.some(param =>
            param.name === ParamName.To && String(param.value).toLowerCase() === proposal.beneficiary.toLowerCase())
          if (txMatchesBeneficiary) {
            proposal.token = DECIMALS[logEvent.sender_address][0]
            const decimals: number = DECIMALS[logEvent.sender_address][1]
            proposal.tx_date = logEvent.block_signed_at
            findTxAmount(decodedLogEvent, proposal, decimals)
          }
        }
      }
    })
  } catch (e) {
    console.log(`Error trying to get contract data for proposal ${proposal.id}`, e)
  }
}

async function main() {
  // Get Governance dApp Proposals
  const proposals: GrantProposal[] = PROPOSALS.filter(p => p.type === GovernanceProposalType.GRANT)

  for (const proposal of proposals) {
    proposal.category = proposal.configuration.category
    proposal.tier = proposal.configuration.tier.split(':')[0]
    proposal.size = proposal.configuration.size
    proposal.beneficiary = proposal.configuration.beneficiary

    if (proposal.vesting_address) {
      await fillVestingContractData(proposal)
    }
    if (proposal.enacting_tx) {
      await fillEnactingTxData(proposal)
    }
    if (proposal.vesting_address === null && proposal.enacting_tx === null) {
      console.log(`A proposal without vesting address and enacting tx has been found. Id ${proposal.id}`)
    }
  }

  console.log(proposals.length, 'grants found.')

  saveToJSON('grants.json', proposals)
  await saveToCSV('grants.csv', proposals, [
    { id: 'id', title: 'Proposal ID' },
    { id: 'snapshot_id', title: 'Snapshot ID' },
    { id: 'user', title: 'Author' },

    { id: 'title', title: 'Title' },
    { id: 'status', title: 'Status' },
    { id: 'start_at', title: 'Started' },
    { id: 'finish_at', title: 'Ended' },
    { id: 'required_to_pass', title: 'Threshold' },
    { id: 'scores_total', title: 'Total VP' },

    { id: 'category', title: 'Category' },
    { id: 'tier', title: 'Tier' },
    { id: 'size', title: 'Amount USD' },
    { id: 'beneficiary', title: 'Beneficiary' },
    { id: 'token', title: 'Token' },

    { id: 'vesting_address', title: 'Vesting Contract' },
    { id: 'vesting_released', title: 'Vesting Released Amount' },
    { id: 'vesting_releasable', title: 'Vesting Releasable Amount' },
    { id: 'vesting_start_at', title: 'Vesting Start At' },
    { id: 'vesting_finish_at', title: 'Vesting Finish At' },

    { id: `enacting_tx`, title: 'Enacting Transaction' },
    { id: 'tx_date', title: 'Transaction Date' },
    { id: 'tx_amount', title: 'Transaction Amount' }
  ])
}

main()
