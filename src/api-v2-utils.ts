// Pure helpers for export-api-v2.ts (kept apart because that script runs on import)

export type GovernanceProjectInList = {
  configuration?: { size?: number | string | null } | null
}

// Percentage change vs the previous window, same semantics as `previous` in the v1 api.json, which the
// governance dapp renders as "X% vs previous 30 days". 0 when there is nothing to compare against.
export function percentChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return 0
  }

  return ((current - previous) * 100) / previous
}

// Total USD size of the DAO-funded projects (grants and bids of enacted proposals), the "funds
// distributed" figure. Same as `funding.total` in the v1 api.json.
export function sumProjectsFundingUSD(projects: GovernanceProjectInList[]): number {
  return projects.reduce((acc, project) => {
    const size = Number(project?.configuration?.size)
    return acc + (Number.isFinite(size) ? size : 0)
  }, 0)
}
