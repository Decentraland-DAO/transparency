import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { AbiItem } from 'web3-utils'

import PROPOSALS from '../public/proposals.json'
import VESTING_ABI from './abi/vesting.json'
import { ProposalParsed } from './export-proposals'
import { Category, GovernanceProposalType } from './interfaces/GovernanceProposal'
import { Network, Symbols, TOKENS } from './interfaces/Network'
import { saveToCSV, saveToJSON } from './utils'

require('dotenv').config()

interface Grant {
  grant_category?: Category
  grant_tier?: string
  grant_size?: number
  grant_beneficiary?: string
  token?: Symbols
  released?: number
  releasable?: number
}

export type GrantProposal = Grant & ProposalParsed

const web3 = new Web3(process.env.INFURA_URL)

async function main() {
  // Get Governance dApp Proposals
  const proposals: GrantProposal[] = PROPOSALS.filter(p => p.type === GovernanceProposalType.GRANT)

  for (const p of proposals) {
    p.grant_category = p.configuration.category
    p.grant_tier = p.configuration.tier.split(':')[0]
    p.grant_size = p.configuration.size
    p.grant_beneficiary = p.configuration.beneficiary

    if (p.vesting_address) {
      const contract = new web3.eth.Contract(VESTING_ABI as AbiItem[], p.vesting_address)
      const tokenAddress: string = (await contract.methods.token().call()).toLowerCase()
      const decimals = TOKENS[Network.ETHEREUM][tokenAddress].decimals
      p.token = TOKENS[Network.ETHEREUM][tokenAddress].symbol

      p.released = await contract.methods.released().call()
      p.released = new BigNumber(p.released).dividedBy(10 ** decimals).toNumber()

      p.releasable = await contract.methods.releasableAmount().call()
      p.releasable = new BigNumber(p.releasable).dividedBy(10 ** decimals).toNumber()
    }
  }

  console.log(proposals.length, 'grants found.')

  saveToJSON('grants.json', proposals)
  saveToCSV('grants.csv', proposals, [
    { id: 'id', title: 'Proposal ID' },
    { id: 'snapshot_id', title: 'Snapshot ID' },
    { id: 'user', title: 'Author' },

    { id: 'title', title: 'Title' },
    { id: 'status', title: 'Status' },
    { id: 'start_at', title: 'Started' },
    { id: 'finish_at', title: 'Ended' },
    { id: 'required_to_pass', title: 'Threshold' },
    { id: 'scores_total', title: 'Total VP' },

    { id: 'grant_category', title: 'Category' },
    { id: 'grant_tier', title: 'Tier' },
    { id: 'grant_size', title: 'Amount USD' },
    { id: 'grant_beneficiary', title: 'Beneficiary' },
    { id: 'vesting_address', title: 'Vesting Contract' },

    { id: 'token', title: 'Token' },
    { id: 'released', title: 'Released Amount' },
    { id: 'releasable', title: 'Releasable Amount' },
  ])
}

main()
