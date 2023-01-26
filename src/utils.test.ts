import { def, get } from 'bdd-lazy-var/getter'
import { parseVP } from './vp-utils'
import * as utils from './utils'

describe('parseVP', () => {
  describe('for scores with all available strategies', () => {
    def('scores', () => [22, 30, 44, 55, 66, 77, 81, 99])

    it('returns an object with the sum of vp, and the vp for each strategy', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 74,
        manaVP: 77,
        namesVP: 66,
        delegatedVP: 77,
        L1WearablesVp: 81,
        rentalVp: 99,
        totalVP: 474
      })
    })

    it('does not report an error', () => {
      const reportToRollbar = jest.spyOn(utils, 'reportToRollbar')
      parseVP(get.scores)
      expect(reportToRollbar).not.toHaveBeenCalled()
    })
  })

  describe('for scores with the first four strategies', () => {
    def('scores', () => [22, 30, 44, 55])

    it('returns an object with the sum of vp from land and mana', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 74,
        manaVP: 77,
        namesVP: 0,
        delegatedVP: 0,
        rentalVp: 0,
        L1WearablesVp: 0,
        totalVP: 151
      })
    })
  })

  describe('for scores with six strategies', () => {
    def('scores', () => [22, 30, 44, 55, 66, 77])

    it('returns an object with the sum of vp, no rental vp and no wearables vp', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 74,
        manaVP: 77,
        namesVP: 66,
        delegatedVP: 77,
        rentalVp: 0,
        L1WearablesVp: 0,
        totalVP: 294
      })
    })
  })

  describe('for scores with more strategies than expected', () => {
    def('scores', () => [22, 30, 44, 55, 66, 77, 88, 99, 100])

    it('returns an object with the sum of all vp, and the vp for each known strategy', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 74,
        manaVP: 77,
        namesVP: 66,
        delegatedVP: 77,
        rentalVp: 99,
        L1WearablesVp: 88,
        totalVP: 581
      })
    })

    it('reports the error to rollbar', () => {
      const reportToRollbar = jest.spyOn(utils, 'reportToRollbar')
      parseVP(get.scores)
      expect(reportToRollbar).toHaveBeenCalled()
    })
  })

  describe('for scores with less strategies than expected', () => {
    def('scores', () => [22, 30, 44, 55, 66])

    it('returns an object with the sum of all vp, and the vp for each known strategy', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 74,
        manaVP: 77,
        namesVP: 66,
        delegatedVP: 0,
        rentalVp: 0,
        L1WearablesVp: 0,
        totalVP: 217
      })
    })

    it('reports the error to rollbar', () => {
      const reportToRollbar = jest.spyOn(utils, 'reportToRollbar')
      parseVP(get.scores)
      expect(reportToRollbar).toHaveBeenCalled()
    })
  })

})

