import { MemberVP } from './interfaces/Members'
import { reportToRollbar } from './utils'

export enum StrategyOrder {
  WrappedMana,
  Land,
  Estate,
  Mana,
  Names,
  Delegation,
  L1Wearables,
  Rental,
}


function getScore(scores: number[], strategyOrder: number) {
  return scores[strategyOrder] || 0
}

export function enumElementCount(enumName: any): number {
  let count = 0
  for (let item in enumName) {
    if (isNaN(Number(item))) count++
  }
  return count
}

const AVAILABLE_STRATEGIES_COUNT = enumElementCount(StrategyOrder)

export function parseVP(scores: number[]): MemberVP {
  if (scores.length > AVAILABLE_STRATEGIES_COUNT) {
    reportToRollbar(`New score strategy detected ${scores}`)
  } else if (scores.length !== 4 && scores.length !== 6 && scores.length !== AVAILABLE_STRATEGIES_COUNT) {
    reportToRollbar(`Invalid VP scores length ${scores}`)
  }

  return {
    totalVP: scores.reduce((acc, val) => acc + val, 0),
    manaVP: getScore(scores, StrategyOrder.WrappedMana) + getScore(scores, StrategyOrder.Mana),
    landVP: getScore(scores, StrategyOrder.Land) + getScore(scores, StrategyOrder.Estate),
    namesVP: getScore(scores, StrategyOrder.Names),
    delegatedVP: getScore(scores, StrategyOrder.Delegation),
    L1WearablesVp: getScore(scores, StrategyOrder.L1Wearables),
    rentalVp: getScore(scores, StrategyOrder.Rental)
  }
}