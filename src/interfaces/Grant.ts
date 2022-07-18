import { Category } from './GovernanceProposal'
import { Token } from './Network'
import { ProposalParsed } from './Proposal'

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
  vesting_token_contract_balance?: number
  vesting_total_amount?: number
  tx_date?: Date
  tx_amount?: number
}

export type GrantProposal = Grant & ProposalParsed