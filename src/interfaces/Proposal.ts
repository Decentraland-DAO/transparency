import { MetadataStrategyParams } from "./GovernanceProposal"

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


