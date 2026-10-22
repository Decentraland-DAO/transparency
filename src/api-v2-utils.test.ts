import { distributedFundingUSD, percentChange, sumDistributedFundingUSD } from './api-v2-utils'

describe('percentChange', () => {
  it('returns the percentage change vs the previous value', () => {
    expect(percentChange(150, 100)).toBe(50)
    expect(percentChange(50, 100)).toBe(-50)
    expect(percentChange(100, 100)).toBe(0)
  })

  it('returns 0 when there is nothing to compare against', () => {
    expect(percentChange(3206, 0)).toBe(0)
    expect(percentChange(0, 0)).toBe(0)
    expect(percentChange(100, NaN)).toBe(0)
  })
})

describe('distributedFundingUSD', () => {
  it('counts the whole size of finished projects, whatever their vesting reports', () => {
    expect(distributedFundingUSD({ status: 'finished', configuration: { size: 50000 }, funding: { vesting: { total: 50000, released: 0 } } })).toBe(50000)
  })

  it('counts nothing for pending projects', () => {
    expect(distributedFundingUSD({ status: 'pending', configuration: { size: 175000 }, funding: {} })).toBe(0)
  })

  it('counts the released share of revoked projects', () => {
    expect(distributedFundingUSD({ status: 'revoked', configuration: { size: 120000 }, funding: { vesting: { total: 1000000, released: 250000 } } })).toBe(30000)
  })

  it('counts the released share of projects still vesting', () => {
    expect(distributedFundingUSD({ status: 'in_progress', configuration: { size: '60000' }, funding: { vesting: { total: '60000', released: '20000' } } })).toBe(20000)
  })

  it('counts one-time payments in full', () => {
    expect(distributedFundingUSD({ status: 'revoked', configuration: { size: 10000 }, funding: { one_time_payment: { enacting_tx: '0x93d975befd48fd208099f63db7cca4289159d574d4e8d7d57dc318b873d9673b' } } })).toBe(10000)
  })

  it('caps the released share at the whole size', () => {
    expect(distributedFundingUSD({ status: 'paused', configuration: { size: 1000 }, funding: { vesting: { total: 100, released: 150 } } })).toBe(1000)
  })

  it('counts nothing without a valid size or vesting data', () => {
    expect(distributedFundingUSD({ status: 'finished', configuration: { size: null } })).toBe(0)
    expect(distributedFundingUSD({ status: 'revoked', configuration: { size: 1000 }, funding: {} })).toBe(0)
    expect(distributedFundingUSD({ status: 'revoked', configuration: { size: 1000 }, funding: { vesting: { total: 0, released: 0 } } })).toBe(0)
  })
})

describe('sumDistributedFundingUSD', () => {
  it('adds up what every project received', () => {
    expect(
      sumDistributedFundingUSD([
        { status: 'finished', configuration: { size: 1000 } },
        { status: 'revoked', configuration: { size: 2000 }, funding: { vesting: { total: 100, released: 50 } } },
        { status: 'pending', configuration: { size: 5000 } }
      ])
    ).toBe(2000)
  })

  it('returns 0 for no projects', () => {
    expect(sumDistributedFundingUSD([])).toBe(0)
  })
})
