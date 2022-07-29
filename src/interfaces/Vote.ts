export interface Vote {
  voter: string
  created: number
  choice: number
  proposal: ProposalData
  vp: number
  vp_by_strategy: number[]
}

export interface ProposalData {
  id: string
  title: string
  choices: string[]
  scores_total: number
}