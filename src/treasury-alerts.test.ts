import {
  alertMarker,
  alertsFingerprint,
  BalanceRow,
  computeTreasuryAlerts,
  formatAlertIssue,
  priceNeutralChange,
  UntrackedAsset,
} from './treasury-alerts'

const ARAGON = '0x9a6ebe7e2a7722f8200d0ffb63a1f6406a0d7dce'
const MANDATE = '0xc3bfc8c27e69ade0b852de1524ae1e9d2019303c'
const MANA = '0x0f5d2fb29fb7d3cfee444a200298f468908cc942'
const STETH = '0xae7ab96520de3a18e5e111b5eaab095312d7fe84'
const STEAK_USDC = '0xbeef088055857739c12cd3765f20b7679def0f51'
const NEW_VAULT = '0x1111111111111111111111111111111111111111'

function row(overrides: Partial<BalanceRow> & Pick<BalanceRow, 'symbol' | 'contractAddress' | 'amount' | 'rate'>): BalanceRow {
  return {
    name: 'Aragon Agent',
    address: ARAGON,
    network: 'Ethereum',
    quote: overrides.amount * overrides.rate,
    source: 'curated',
    ...overrides,
  }
}

const mana = (amount: number, rate: number) => row({ symbol: 'MANA', contractAddress: MANA, amount, rate })
const steth = (amount: number, rate: number) =>
  row({ name: 'DAO Treasury Mandate Multisig', address: MANDATE, symbol: 'stETH', contractAddress: STETH, amount, rate })
const vault = (contractAddress: string, quote: number) =>
  row({
    name: 'DAO Treasury Mandate Multisig',
    address: MANDATE,
    symbol: 'vault',
    contractAddress,
    amount: quote,
    rate: 1,
    source: 'vault',
  })

const untrackedVault: UntrackedAsset = {
  walletName: 'DAO Treasury Mandate Multisig',
  walletAddress: MANDATE,
  network: 'Ethereum',
  contractAddress: NEW_VAULT,
  rawBalance: '1000000000000000000',
  reason: 'ERC4626 vault not recognized by DefiLlama',
  code: 'vault_unrecognized',
}

const DATE = '2026-10-22'

describe('priceNeutralChange', () => {
  it('ignores market moves', () => {
    const change = priceNeutralChange([mana(27_000_000, 0.08)], [mana(27_000_000, 0.09)])
    expect(change.dropUSD).toBe(0)
  })

  it("values tokens that are gone at the previous run's price", () => {
    const change = priceNeutralChange([mana(27_000_000, 0.09)], [mana(27_000_000, 0.09), steth(340, 2500)])
    expect(change.dropUSD).toBe(850_000)
    expect(change.contributors).toEqual([
      { wallet: 'DAO Treasury Mandate Multisig', network: 'Ethereum', symbol: 'stETH', contractAddress: STETH, amountChange: -340, usdChange: -850_000 },
    ])
  })

  it('adds up duplicated rows of the same holding', () => {
    const change = priceNeutralChange([mana(100, 1)], [mana(100, 1), mana(100, 1)])
    expect(change.dropUSD).toBe(100)
  })
})

describe('computeTreasuryAlerts', () => {
  describe('when there is no previous run to compare with', () => {
    it('only reports the assets that could not be valued', () => {
      const alerts = computeTreasuryAlerts({ today: [mana(1, 0.09)], previous: null, untracked: [untrackedVault], date: DATE })
      expect(alerts.map(alert => alert.kind)).toEqual(['untracked'])
    })
  })

  describe('when funds leave the wallets', () => {
    it('reports drops of at least $100k', () => {
      const alerts = computeTreasuryAlerts({
        today: [mana(25_000_000, 0.09)],
        previous: [mana(27_000_000, 0.09)],
        untracked: [],
        date: DATE,
      })
      expect(alerts).toEqual([expect.objectContaining({ kind: 'drop', key: `drop:${DATE}`, dropUSD: 180_000 })])
    })

    it('ignores smaller drops', () => {
      const alerts = computeTreasuryAlerts({
        today: [mana(26_000_000, 0.09)],
        previous: [mana(27_000_000, 0.09)],
        untracked: [],
        date: DATE,
      })
      expect(alerts).toEqual([])
    })
  })

  describe('when a new asset is counted automatically', () => {
    it('reports it when it is worth at least $1k', () => {
      const alerts = computeTreasuryAlerts({
        today: [mana(1, 0.09), vault(STEAK_USDC, 221_000), vault(NEW_VAULT, 50_000)],
        previous: [mana(1, 0.09), vault(STEAK_USDC, 221_000)],
        untracked: [],
        date: DATE,
      })
      expect(alerts.map(alert => alert.key)).toEqual([`new_asset:Ethereum:${MANDATE}:${NEW_VAULT}`])
    })

    it('ignores small ones', () => {
      const alerts = computeTreasuryAlerts({
        today: [mana(1, 0.09), vault(NEW_VAULT, 500)],
        previous: [mana(1, 0.09), vault(STEAK_USDC, 0.01)],
        untracked: [],
        date: DATE,
      })
      expect(alerts).toEqual([])
    })

    it('treats the first run after the balances discovery as the baseline', () => {
      const alerts = computeTreasuryAlerts({
        today: [mana(1, 0.09), vault(STEAK_USDC, 221_000)],
        previous: [{ ...mana(1, 0.09), source: undefined }],
        untracked: [],
        date: DATE,
      })
      expect(alerts).toEqual([])
    })
  })
})

describe('alertsFingerprint', () => {
  const untracked = computeTreasuryAlerts({ today: [], previous: null, untracked: [untrackedVault], date: DATE })

  it('is the same for the same alerts, whatever the day', () => {
    const nextDay = computeTreasuryAlerts({ today: [], previous: null, untracked: [untrackedVault], date: '2026-10-23' })
    expect(alertsFingerprint(nextDay)).toBe(alertsFingerprint(untracked))
  })

  it('changes when the alerts change', () => {
    const more = computeTreasuryAlerts({
      today: [],
      previous: null,
      untracked: [untrackedVault, { ...untrackedVault, contractAddress: STEAK_USDC }],
      date: DATE,
    })
    expect(alertsFingerprint(more)).not.toBe(alertsFingerprint(untracked))
  })
})

describe('formatAlertIssue', () => {
  const alerts = computeTreasuryAlerts({
    today: [mana(25_000_000, 0.09)],
    previous: [mana(27_000_000, 0.09)],
    untracked: [untrackedVault],
    date: DATE,
  })
  const issue = formatAlertIssue(alerts, DATE)

  it('summarizes the alerts in the title', () => {
    expect(issue.title).toBe(`Treasury alert (${DATE}): $180,000 drop not explained by prices, 1 asset that couldn't be valued`)
  })

  it('links full addresses and carries the fingerprint marker', () => {
    expect(issue.body).toContain(`[${NEW_VAULT}](https://etherscan.io/address/${NEW_VAULT})`)
    expect(issue.body).toContain(`[${MANA}](https://etherscan.io/address/${MANA})`)
    expect(issue.body).toContain(alertMarker(issue.fingerprint))
  })
})
