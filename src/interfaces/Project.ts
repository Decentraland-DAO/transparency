import { GovernanceApiResponse } from './Api'
import { TokenSymbols } from '../entities/Tokens'
import { Category, GovernanceProposalType } from './GovernanceProposal'
import { ProposalParsed } from './Proposal'

export interface Updates {
  done_updates: number
  late_updates: number
  missed_updates: number
  update_status?: UpdateStatus
  health?: ProjectHealth
  last_update?: string
  next_update?: string
  pending_updates: number
}

export interface VestingInfo {
  vesting_address: string
  token: TokenSymbols
  vesting_released: number
  vesting_releasable: number
  vesting_start_at: string
  vesting_finish_at: string
  vesting_contract_token_balance: number
  vesting_total_amount: number
  vesting_status: VestingStatus
  duration_in_months: number
}

export interface OneTimePaymentInfo {
  token: TokenSymbols
  tx_date: string
  tx_amount: number
}

type ProjectData = {
  size?: number
  beneficiary?: string
  vesting?: VestingInfo[]
}

type Grant = Partial<Updates> & Partial<OneTimePaymentInfo> & {
  category?: Category
  tier?: string
} & ProjectData

export type GrantProposal = Grant & ProposalParsed
export type BidProposal = ProjectData & ProposalParsed
export type Project = (BidProposal | GrantProposal) & {
  project_id: string
}

export type GrantUpdate = {
  id: string
  proposal_id: string
  health?: ProjectHealth
  introduction?: string
  highlights?: string
  blockers?: string
  next_steps?: string
  additional_notes?: string
  status: UpdateStatus
  due_date?: string
  completion_date?: string
  created_at: string
  updated_at: string
}

export enum UpdateStatus {
  Pending = 'pending',
  Late = 'late',
  Done = 'done',
}

export enum ProjectHealth {
  OnTrack = 'onTrack',
  AtRisk = 'atRisk',
  OffTrack = 'offTrack',
}

export enum VestingStatus {
  Pending = 'Pending',
  InProgress = 'In Progress',
  Finished = 'Finished',
  Paused = 'Paused',
  Revoked = 'Revoked',
}

export type ProjectUpdateResponse = GovernanceApiResponse<{
  publicUpdates: GrantUpdate[]
  pendingUpdates: GrantUpdate[]
  nextUpdate: GrantUpdate | null
  currentUpdate: GrantUpdate | null
}>

export type ProposalProject = {
  id: string
  project_id?: string | null
  status: string
  title: string
  user: string
  size: number
  type: GovernanceProposalType
  about: string
  created_at: number
  updated_at: number
  configuration: {
    category: Category
    tier: string
  }
}