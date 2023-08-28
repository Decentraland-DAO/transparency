import { MemberVP } from './interfaces/Members'
import { def, get } from 'bdd-lazy-var/getter'
import { getVPDistributionRows, isWithinDistributionLimits, VP_DISTRIBUTION_LIMITS } from './kpis-utils'

describe('isWithinDistributionLimits', () => {
  const distributionLimits = VP_DISTRIBUTION_LIMITS

  describe('for the lower tier', () => {
    def('tierIndex', () => distributionLimits.length - 1)

    it('includes values strictly lower', () => {
      expect(isWithinDistributionLimits(100, get.tierIndex, distributionLimits)).toBe(true)
      expect(isWithinDistributionLimits(999, get.tierIndex, distributionLimits)).toBe(true)
      expect(isWithinDistributionLimits(1000, get.tierIndex, distributionLimits)).toBe(false)
    })
  })

  describe('for a mid level tier', () => {
    def('tierIndex', () => distributionLimits.length - 2)

    it('only includes values equal or greater than the lower limit, and lower than the upper limit', function() {
      expect(isWithinDistributionLimits(100, get.tierIndex, distributionLimits)).toBe(false)
      expect(isWithinDistributionLimits(1000, get.tierIndex, distributionLimits)).toBe(true)
      expect(isWithinDistributionLimits(9999, get.tierIndex, distributionLimits)).toBe(true)
      expect(isWithinDistributionLimits(10000, get.tierIndex, distributionLimits)).toBe(false)
      expect(isWithinDistributionLimits(100000, get.tierIndex, distributionLimits)).toBe(false)
    })
  })

  describe('for the higher level tier', () => {
    def('tierIndex', () => 0)

    it('only includes values equal or greater than the lower limit', function() {
      expect(isWithinDistributionLimits(100, get.tierIndex, distributionLimits)).toBe(false)
      expect(isWithinDistributionLimits(100000, get.tierIndex, distributionLimits)).toBe(false)
      expect(isWithinDistributionLimits(1000000, get.tierIndex, distributionLimits)).toBe(true)
      expect(isWithinDistributionLimits(2000000, get.tierIndex, distributionLimits)).toBe(true)
    })
  })
})

describe('getVPDistributionRows', () => {
  const MEMBER_1: MemberVP = {
    totalVP: 100,
    manaVP: 1,
    landVP: 1,
    namesVP: 1,
    delegatedVP: 1,
    l1WearablesVP: 1,
    estateVP: 1,
    rentalVP: 1
  }
  const MEMBER_2 = { ...MEMBER_1, totalVP: 1000 }
  const MEMBER_3 = { ...MEMBER_1, totalVP: 2000 }
  const MEMBER_4 = { ...MEMBER_1, totalVP: 10000 }
  const MEMBER_5 = { ...MEMBER_1, totalVP: 100000 }
  const MEMBER_6 = { ...MEMBER_1, totalVP: 100001 }
  const MEMBER_7 = { ...MEMBER_1, totalVP: 1000000 }


  def('members', () => [MEMBER_1, MEMBER_2, MEMBER_3, MEMBER_4, MEMBER_5, MEMBER_6, MEMBER_7])
  def('totalVp', () => get.members.map(member => member.totalVP).reduce((a, b) => a + b))

  it('sorts members per distribution range', () => {
    expect(getVPDistributionRows(get.members, get.totalVp)).toStrictEqual(
      [
        ['Total Members', 7, '', get.totalVp],
        ['Members w/ >=1M VP', 1, '14.29%', 1000000, '82.43%'],
        ['Members w/ >=100k VP', 2, '28.57%', 200001, '16.49%'],
        ['Members w/ >=10k VP', 1, '14.29%', 10000, '0.82%'],
        ['Members w/ >=1k VP', 2, '28.57%', 3000, '0.25%'],
        ['Members w/ <1k VP', 1, '14.29%', 100, '0.01%']
      ]
    )
  })

})
