import { percentChange, sumProjectsFundingUSD } from './api-v2-utils'

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

describe('sumProjectsFundingUSD', () => {
  it('adds up the size of every project', () => {
    expect(
      sumProjectsFundingUSD([
        { configuration: { size: 1000 } },
        { configuration: { size: '2500' } },
        { configuration: { size: 500 } }
      ])
    ).toBe(4000)
  })

  it('ignores projects without a valid size', () => {
    expect(
      sumProjectsFundingUSD([
        { configuration: { size: 1000 } },
        { configuration: { size: null } },
        { configuration: null },
        {},
        { configuration: { size: 'not a number' } }
      ])
    ).toBe(1000)
  })

  it('returns 0 for no projects', () => {
    expect(sumProjectsFundingUSD([])).toBe(0)
  })
})
