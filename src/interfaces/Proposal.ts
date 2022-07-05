import { Configuration, MetadataStrategyParams, Status } from './GovernanceProposal'

export interface Proposal {
  id: string
  scores_total: number
  strategies: ProposalStrategy[]
  scores_by_strategy: Array<number[]>
  votes: number
}

export interface ProposalStrategy {
  params: MetadataStrategyParams
}

export type ProposalParsed = {
  id: string
  snapshot_id: string
  user: string
  type: string
  title: string
  start_at: Date
  finish_at: Date
  required_to_pass: number
  status: Status
  configuration: Configuration
  discourse_topic_id: number
  scores_total: number
  votes: number
  manaVP: number
  landVP: number
  namesVP: number
  delegatedVP: number
  vesting_address: string | null
  enacting_tx: string | null
}

export type ProposalVotes = {
  [id: string]: Proposal
}