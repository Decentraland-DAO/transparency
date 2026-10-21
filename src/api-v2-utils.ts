// Pure helpers for export-api-v2.ts (kept apart because that script runs on import)

export type GovernanceProjectInList = {
  // pending | in_progress | paused | finished | revoked
  status?: string | null
  configuration?: { size?: number | string | null } | null
  funding?: {
    one_time_payment?: unknown
    vesting?: { total?: number | string | null; released?: number | string | null } | null
  } | null
}

// Percentage change vs the previous window, same semantics as `previous` in the v1 api.json, which the
// governance dapp renders as "X% vs previous 30 days". 0 when there is nothing to compare against.
export function percentChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return 0
  }

  return ((current - previous) * 100) / previous
}

// USD actually paid out to a DAO-funded project (grant or bid of an enacted proposal), valued at the size
// approved in its proposal (so no token prices are needed):
// - finished projects and one-time payments: the whole size
// - pending projects: nothing yet
// - anything else (revoked, in progress, paused): the share of its vesting released so far
// The status is trusted over the vesting `released` amounts for finished projects, because those amounts
// are incomplete for some contracts (e.g. USDC vestings report nothing released).
export function distributedFundingUSD(project: GovernanceProjectInList): number {
  const size = Number(project?.configuration?.size)
  if (!Number.isFinite(size) || size <= 0) return 0

  const status = project.status || ''
  if (status === 'finished') return size
  if (status === 'pending') return 0
  if (project.funding?.one_time_payment) return size

  const total = Number(project.funding?.vesting?.total)
  const released = Number(project.funding?.vesting?.released)
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(released)) return 0

  return size * Math.min(1, Math.max(0, released / total))
}

// The "funds distributed" figure (funding.total). The v1 api.json added up the approved sizes instead, which
// also counted what revoked and pending projects never received.
export function sumDistributedFundingUSD(projects: GovernanceProjectInList[]): number {
  return projects.reduce((acc, project) => acc + distributedFundingUSD(project), 0)
}
