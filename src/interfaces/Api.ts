export interface BalanceDetails {
  name: string
  value: number
  description: string
}

export interface GovernanceApiResponse<D> {
  ok: boolean;
  error?: string;
  data: D;
};