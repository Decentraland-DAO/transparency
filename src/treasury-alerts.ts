// Treasury alerts raised after the daily balances export (run by check-treasury.ts). Pure, so it can be unit
// tested. Alerts are opened as GitHub issues, which the repo's Discord webhook posts to the DAO Discord.
import { createHash } from 'crypto'

// A drop in the treasury that prices don't explain: funds leaving the tracked wallets (a payment, a new wallet
// or a position the balances can't see, like a non-tokenized DeFi deposit)
export const DROP_ALERT_THRESHOLD_USD = 100_000
// A token counted automatically (vault or discovered) that wasn't there in the previous run
export const NEW_ASSET_ALERT_THRESHOLD_USD = 1_000
export const ALERT_ISSUE_TITLE_PREFIX = 'Treasury alert'
const TOP_DROP_CONTRIBUTORS = 5

export type BalanceRow = {
  name: string
  address: string
  network: string
  symbol: string
  contractAddress: string
  amount: number
  quote: number
  rate: number
  // missing in balances.json produced before the balances discovery
  source?: 'curated' | 'vault' | 'discovered'
}

export type UntrackedAsset = {
  walletName: string
  walletAddress: string
  network: string
  contractAddress: string
  rawBalance: string
  reason: string
  code: string
}

export type DropContributor = {
  wallet: string
  network: string
  symbol: string
  contractAddress: string
  amountChange: number
  usdChange: number
}

export type PriceNeutralChange = {
  dropUSD: number
  previousUSD: number
  contributors: DropContributor[]
}

export type TreasuryAlert =
  | { kind: 'untracked'; key: string; asset: UntrackedAsset }
  | { kind: 'new_asset'; key: string; row: BalanceRow }
  | ({ kind: 'drop'; key: string } & PriceNeutralChange)

const rowKey = (row: Pick<BalanceRow, 'network' | 'address' | 'contractAddress'>) =>
  `${row.network}:${row.address.toLowerCase()}:${row.contractAddress.toLowerCase()}`
const assetKey = (network: string, contractAddress: string) => `${network}:${contractAddress.toLowerCase()}`

// Values the previous and the current holdings at today's prices (the previous price for tokens that are gone),
// so market moves don't count as a drop
export function priceNeutralChange(today: BalanceRow[], previous: BalanceRow[]): PriceNeutralChange {
  const priceByAsset = new Map<string, number>()
  previous.forEach(row => priceByAsset.set(assetKey(row.network, row.contractAddress), row.rate || 0))
  today.forEach(row => priceByAsset.set(assetKey(row.network, row.contractAddress), row.rate || 0))

  const holdings = new Map<string, { row: BalanceRow; before: number; after: number }>()
  previous.forEach(row => {
    const holding = holdings.get(rowKey(row)) || { row, before: 0, after: 0 }
    holding.before += row.amount
    holdings.set(rowKey(row), holding)
  })
  today.forEach(row => {
    const holding = holdings.get(rowKey(row)) || { row, before: 0, after: 0 }
    holding.after += row.amount
    holding.row = row
    holdings.set(rowKey(row), holding)
  })

  let previousUSD = 0
  let currentUSD = 0
  const contributors: DropContributor[] = []
  holdings.forEach(({ row, before, after }) => {
    const price = priceByAsset.get(assetKey(row.network, row.contractAddress)) || 0
    previousUSD += before * price
    currentUSD += after * price
    const usdChange = (after - before) * price
    if (usdChange < 0) {
      contributors.push({
        wallet: row.name,
        network: row.network,
        symbol: row.symbol,
        contractAddress: row.contractAddress,
        amountChange: after - before,
        usdChange,
      })
    }
  })
  contributors.sort((a, b) => a.usdChange - b.usdChange)

  return { dropUSD: previousUSD - currentUSD, previousUSD, contributors: contributors.slice(0, TOP_DROP_CONTRIBUTORS) }
}

export function computeTreasuryAlerts({
  today,
  previous,
  untracked,
  date,
}: {
  today: BalanceRow[]
  // the last published balances.json, null when it couldn't be fetched
  previous: BalanceRow[] | null
  untracked: UntrackedAsset[]
  date: string
}): TreasuryAlert[] {
  const alerts: TreasuryAlert[] = untracked.map(asset => ({
    kind: 'untracked',
    key: `untracked:${asset.network}:${asset.walletAddress.toLowerCase()}:${asset.contractAddress.toLowerCase()}`,
    asset,
  }))

  if (!previous) return alerts

  // Before the balances discovery there was no `source`, so the first run after it is the baseline
  if (previous.some(row => row.source)) {
    const previousKeys = new Set(previous.map(rowKey))
    today
      .filter(row => (row.source === 'vault' || row.source === 'discovered') && row.quote >= NEW_ASSET_ALERT_THRESHOLD_USD)
      .filter(row => !previousKeys.has(rowKey(row)))
      .forEach(row => alerts.push({ kind: 'new_asset', key: `new_asset:${rowKey(row)}`, row }))
  }

  const change = priceNeutralChange(today, previous)
  if (change.dropUSD >= DROP_ALERT_THRESHOLD_USD) {
    alerts.push({ kind: 'drop', key: `drop:${date}`, ...change })
  }

  return alerts
}

// Same alerts, same fingerprint, whatever their order. Asset alerts are stable across days (so a pending one
// isn't reported again), drops include the date.
export function alertsFingerprint(alerts: TreasuryAlert[]): string {
  const keys = alerts.map(alert => alert.key).sort().join('\n')
  return createHash('sha256').update(keys).digest('hex').slice(0, 16)
}

export function alertMarker(fingerprint: string): string {
  return `<!-- treasury-alert:${fingerprint} -->`
}

// placeholder contract address of native tokens (ETH, MATIC) in balances.json
const NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

const usd = (value: number) => `${value < 0 ? '-' : ''}$${Math.abs(Math.round(value)).toLocaleString('en-US')}`
const amount = (value: number) => value.toLocaleString('en-US', { maximumFractionDigits: 4 })

function explorerLink(network: string, address: string): string {
  if (address.toLowerCase() === NATIVE_TOKEN_ADDRESS) return '(native)'
  const base = network.toLowerCase() === 'polygon' ? 'https://polygonscan.com' : 'https://etherscan.io'
  return `[${address}](${base}/address/${address})`
}

export function formatAlertIssue(alerts: TreasuryAlert[], date: string): { title: string; body: string; fingerprint: string } {
  const drop = alerts.find((alert): alert is Extract<TreasuryAlert, { kind: 'drop' }> => alert.kind === 'drop')
  const untracked = alerts.filter((alert): alert is Extract<TreasuryAlert, { kind: 'untracked' }> => alert.kind === 'untracked')
  const newAssets = alerts.filter((alert): alert is Extract<TreasuryAlert, { kind: 'new_asset' }> => alert.kind === 'new_asset')

  const summary = [
    drop && `${usd(drop.dropUSD)} drop not explained by prices`,
    untracked.length && `${untracked.length} asset${untracked.length > 1 ? 's' : ''} that couldn't be valued`,
    newAssets.length && `${newAssets.length} new asset${newAssets.length > 1 ? 's' : ''} counted automatically`,
  ].filter(Boolean)

  const sections: string[] = [
    'The daily treasury check found something to review. Totals: https://decentraland.org/governance/transparency',
  ]

  if (drop) {
    sections.push(
      [
        `### Drop not explained by prices: ${usd(drop.dropUSD)} (from ${usd(drop.previousUSD)})`,
        "Both days are valued at today's prices, so this is funds leaving the tracked wallets, not a market move: a payment, a new wallet, or a position the balances can't see (e.g. a non-tokenized DeFi deposit).",
        '',
        '| Wallet | Network | Token | Change | USD |',
        '|---|---|---|---|---|',
        ...drop.contributors.map(
          c => `| ${c.wallet} | ${c.network} | ${c.symbol} ${explorerLink(c.network, c.contractAddress)} | ${amount(c.amountChange)} | ${usd(c.usdChange)} |`
        ),
      ].join('\n')
    )
  }

  if (untracked.length) {
    sections.push(
      [
        "### Assets that couldn't be valued",
        'Held by DAO wallets and not counted in the treasury total. If they are real positions, add them to `src/entities/Tokens.ts` or a valuation path in `src/treasury-valuation.ts`.',
        '',
        '| Wallet | Network | Token | Reason |',
        '|---|---|---|---|',
        ...untracked.map(
          ({ asset }) =>
            `| ${asset.walletName} (${explorerLink(asset.network, asset.walletAddress)}) | ${asset.network} | ${explorerLink(asset.network, asset.contractAddress)} | ${asset.reason} |`
        ),
      ].join('\n')
    )
  }

  if (newAssets.length) {
    sections.push(
      [
        '### New assets counted automatically',
        'Already included in the treasury total. Consider adding them to `src/entities/Tokens.ts`.',
        '',
        '| Wallet | Network | Token | Amount | USD | Source |',
        '|---|---|---|---|---|---|',
        ...newAssets.map(
          ({ row }) =>
            `| ${row.name} | ${row.network} | ${row.symbol} ${explorerLink(row.network, row.contractAddress)} | ${amount(row.amount)} | ${usd(row.quote)} | ${row.source} |`
        ),
      ].join('\n')
    )
  }

  const fingerprint = alertsFingerprint(alerts)
  sections.push(alertMarker(fingerprint))

  return {
    title: `${ALERT_ISSUE_TITLE_PREFIX} (${date}): ${summary.join(', ')}`,
    body: sections.join('\n\n'),
    fingerprint,
  }
}
