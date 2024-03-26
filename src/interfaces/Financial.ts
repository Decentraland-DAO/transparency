import { GovernanceProposalType } from './GovernanceProposal'

export enum FinancialRecordCateogry {
  TeamCompensation = 'Team Compensation',
  ToolsAndServices = 'Tools & Services',
  Contractors = 'Contractors',
  Marketing = 'Marketing',
  Other = 'Other',
}

export type FinancialRecord = {
  id: string
  update_id: string
  proposal_id: string
  proposal_type: GovernanceProposalType
  proposal_category: string | null
  category: FinancialRecordCateogry
  description: string
  token: string
  amount: number
  receiver: string
  link: string | null
}
