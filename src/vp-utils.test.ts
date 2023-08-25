import { def, get } from 'bdd-lazy-var/getter'
import { getScoresForAddress, parseVP } from './vp-utils'
import * as utils from './utils'

describe('parseVP', () => {
  describe('for scores with all available strategies', () => {
    def('scores', () => [22, 30, 44, 55, 66, 77, 81, 99])

    it('returns an object with the sum of vp, and the vp for each strategy', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 30,
        estateVP: 44,
        manaVP: 77,
        namesVP: 66,
        delegatedVP: 77,
        l1WearablesVP: 81,
        rentalVP: 99,
        totalVP: 474
      })
    })

    it('does not report an error', () => {
      const reportToRollbar = jest.spyOn(utils, 'reportToRollbar').mockImplementation(() => {
      })
      parseVP(get.scores)
      expect(reportToRollbar).not.toHaveBeenCalled()
    })
  })

  describe('for scores with the first four strategies', () => {
    def('scores', () => [22, 30, 44, 55])

    it('returns an object with the sum of vp from land and mana', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 30,
        estateVP: 44,
        manaVP: 77,
        namesVP: 0,
        delegatedVP: 0,
        rentalVP: 0,
        l1WearablesVP: 0,
        totalVP: 151
      })
    })
  })

  describe('for scores with six strategies', () => {
    def('scores', () => [22, 30, 44, 55, 66, 77])

    it('returns an object with the sum of vp, no rental vp and no wearables vp', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 30,
        estateVP: 44,
        manaVP: 77,
        namesVP: 66,
        delegatedVP: 77,
        rentalVP: 0,
        l1WearablesVP: 0,
        totalVP: 294
      })
    })
  })

  describe('for scores with more strategies than expected', () => {
    def('scores', () => [22, 30, 44, 55, 66, 77, 88, 99, 100])

    it('returns an object with the sum of all vp, and the vp for each known strategy', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 30,
        estateVP: 44,
        manaVP: 77,
        namesVP: 66,
        delegatedVP: 77,
        rentalVP: 99,
        l1WearablesVP: 88,
        totalVP: 581
      })
    })

    it('reports the error to rollbar', () => {
      const reportToRollbar = jest.spyOn(utils, 'reportToRollbar').mockImplementation(() => {
      })
      parseVP(get.scores)
      expect(reportToRollbar).toHaveBeenCalled()
    })
  })

  describe('for scores with less strategies than expected', () => {
    def('scores', () => [22, 30, 44, 55, 66])

    it('returns an object with the sum of all vp, and the vp for each known strategy', () => {
      expect(parseVP(get.scores)).toEqual({
        landVP: 30,
        estateVP: 44,
        manaVP: 77,
        namesVP: 66,
        delegatedVP: 0,
        rentalVP: 0,
        l1WearablesVP: 0,
        totalVP: 217
      })
    })

    it('reports the error to rollbar', () => {
      const reportToRollbar = jest.spyOn(utils, 'reportToRollbar').mockImplementation(() => {
      })
      parseVP(get.scores)
      expect(reportToRollbar).toHaveBeenCalled()
    })
  })

})

describe('getScoresForAddress', () => {

  describe('when the scores index uses the same address with different cases', () => {
    const snapshotScores = [
      {},
      {
        '0xa2efa94766ee867c91f71e8020a3c97ae687e5c3': 62000,
        '0x1ec9e5273128aaecf510846913e5d1be682b820f': 2000
      },
      {
        '0xA2efa94766ee867C91f71e8020A3c97aE687E5c3': 32000,
        '0x1Ec9e5273128aAeCF510846913e5D1BE682b820F': 8000
      },
      {
        '0x52109ee547f7611f4207e2873adc6b31bbc1428d': 15.741370052473732,
        '0x55fd9ab823d5c28128818da3d2a2d144244406b2': 1.1108839515502895,
        '0x53f5dfc33e7cc4b66f5d5086038dfe338e60dd59': 0.46433612196506313,
        '0x9b7df2a8fd78923bb5e3329aa7e024a613a92d5f': 33.49217394116018,
        '0xa2efa94766ee867c91f71e8020a3c97ae687e5c3': 58.57167748282024,
        '0x3b17dbf36abfd4c62d71a2b62cc72d954727a841': 2.5203977156073294,
        '0x6b24b88e31c1b883f6a9e6377d647d472eb3626a': 1.34,
        '0x1f83fef0548aba235df24f77acde2381176c0ca0': 26.000002283723358,
        '0xf605e3257c5662406b8baa9e6040dc393d05922f': 3.4259196162188053,
        '0xea12a4825195d8b6ec3afbf347f37abdf57cd6cd': 0.000089976697666824,
        '0x36b983dddc5e086b4a49cdf978656880387468d7': 15.84383117733089,
        '0x31aa403b53f4ac3747eb8bfda8c2b5bdef67fa08': 755.9925,
        '0xf78108c9bbaf466dd96be41be728fe3220b37119': 1.529761e-12,
        '0x77f241c0549e91ee1b36d0438c8a5186cb3be3c6': 2.8,
        '0x1ec9e5273128aaecf510846913e5d1be682b820f': 6.491471130000787
      },
      {
        '0x97dc6bf9873020953127f94794171f54e6310192': 200,
        '0x7bbd4eb693dd5b08e13c9da9d54d8ecd49d9b654': 100,
        '0x9b7df2a8fd78923bb5e3329aa7e024a613a92d5f': 100,
        '0xa2efa94766ee867c91f71e8020a3c97ae687e5c3': 100,
        '0xf605e3257c5662406b8baa9e6040dc393d05922f': 100,
        '0xf78108c9bbaf466dd96be41be728fe3220b37119': 100,
        '0x1ec9e5273128aaecf510846913e5d1be682b820f': 100
      },
      {},
      {
        '0x97dC6Bf9873020953127f94794171F54e6310192': 217,
        '0x9b7df2A8Fd78923BB5e3329aA7e024a613a92d5F': 10,
        '0xA2efa94766ee867C91f71e8020A3c97aE687E5c3': 10,
        '0xF78108c9BBaF466dd96BE41be728Fe3220b37119': 10
      },
      {}
    ]

    it('returns an array with the score for all strategies for the checksummed address', () => {
      const address = '0x97dC6Bf9873020953127f94794171F54e6310192'
      expect(getScoresForAddress(snapshotScores, address)).toEqual([
        0,
        0,
        0,
        0,
        200,
        0,
        217,
        0
      ])
    })

    it('returns an array with the score for all strategies for the lowercased address', () => {
      const address = '0x97dC6Bf9873020953127f94794171F54e6310192'.toLowerCase()
      expect(getScoresForAddress(snapshotScores, address)).toEqual([
        0,
        0,
        0,
        0,
        200,
        0,
        217,
        0
      ])
    })
  })
})
