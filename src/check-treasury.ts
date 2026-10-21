// Runs after export-balances, before the deploy: compares today's balances with the last published ones and
// opens a GitHub issue when something needs review (see treasury-alerts.ts). The repo's Discord webhook
// posts new issues to the DAO Discord. Without GITHUB_TOKEN it prints the issue instead (dry run).
import fs from 'fs'
import path from 'path'
import { alertMarker, BalanceRow, computeTreasuryAlerts, formatAlertIssue, UntrackedAsset } from './treasury-alerts'

// Still the previous run's data at this point: the deploy is the workflow's last step
const PUBLISHED_BALANCES_URL = 'https://decentraland-dao.github.io/transparency/balances.json'
const GITHUB_API = 'https://api.github.com'

function readPublicJson<T>(name: string, fallback: T): T {
  const file = path.join(process.cwd(), 'public', name)
  return fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, 'utf8')) as T) : fallback
}

async function fetchPublishedBalances(): Promise<BalanceRow[] | null> {
  try {
    const response = await fetch(PUBLISHED_BALANCES_URL, { headers: { 'cache-control': 'no-cache' } })
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const rows = await response.json()
    return Array.isArray(rows) ? (rows as BalanceRow[]) : null
  } catch (error) {
    console.error('[check-treasury] could not fetch the published balances, skipping the comparison:', error)
    return null
  }
}

async function github<T>(token: string, pathname: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${GITHUB_API}${pathname}`, {
    ...init,
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${token}`,
      'x-github-api-version': '2022-11-28',
      'content-type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`GitHub ${init.method || 'GET'} ${pathname} failed: ${response.status} ${await response.text()}`)
  }
  return (await response.json()) as T
}

async function main() {
  const today = readPublicJson<BalanceRow[]>('balances.json', [])
  if (!today.length) {
    console.log('[check-treasury] no public/balances.json, nothing to check')
    return
  }
  const untracked = readPublicJson<UntrackedAsset[]>('untracked-assets.json', [])
  const previous = await fetchPublishedBalances()
  const date = new Date().toISOString().slice(0, 10)

  const alerts = computeTreasuryAlerts({ today, previous, untracked, date })
  console.log(`[check-treasury] ${alerts.length} alert(s):`, alerts.map(alert => alert.key).join(', ') || 'none')
  if (!alerts.length) return

  const issue = formatAlertIssue(alerts, date)
  const token = process.env.GITHUB_TOKEN
  const repo = process.env.GITHUB_REPOSITORY
  if (!token || !repo) {
    console.log('[check-treasury] no GITHUB_TOKEN/GITHUB_REPOSITORY, dry run:\n')
    console.log(`${issue.title}\n\n${issue.body}`)
    return
  }

  // An open issue with the same alerts was already posted: don't post it again every day
  const openIssues = await github<{ number: number; body?: string | null; pull_request?: unknown }[]>(
    token,
    `/repos/${repo}/issues?state=open&per_page=100`
  )
  const existing = openIssues.find(openIssue => !openIssue.pull_request && openIssue.body?.includes(alertMarker(issue.fingerprint)))
  if (existing) {
    console.log(`[check-treasury] already reported in #${existing.number}`)
    return
  }

  const created = await github<{ html_url: string }>(token, `/repos/${repo}/issues`, {
    method: 'POST',
    body: JSON.stringify({ title: issue.title, body: issue.body }),
  })
  console.log(`[check-treasury] opened ${created.html_url}`)
}

main().catch(error => {
  console.error('[check-treasury] failed:', error)
  process.exit(1)
})
