import { MemberInfo, MemberVP } from './interfaces/Members'
import { sum } from './utils'

export const VP_DISTRIBUTION_LIMITS = [1e6, 1e5, 1e4, 1e3, 0]

export function getRatio(value: number, total: number) {
  const ratio = total > 0 ? value / total : 0
  return `${(ratio * 100).toFixed(2)}%`
}

export function isWithinDistributionLimits(amount: number, index: number, distributionLimits: number[]) {
  const hasLowerLimit = index < distributionLimits.length
  const hasUpperLimit = index > 0
  return (hasLowerLimit ? amount >= distributionLimits[index] : true) &&
    (hasUpperLimit ? amount < distributionLimits[index - 1] : true)
}

function getDistributionLimitLabel(distributionLimit) {
  const lookup = {
    'M': 1e6,
    'k': 1e3
  }
  return distributionLimit === lookup.M ? '1M' : `${distributionLimit / lookup.k}k`
}

function getDistributionTitle(index: number, distributionLimit: number) {
  const label = (index === VP_DISTRIBUTION_LIMITS.length - 1) ? `<1k` : `>=${getDistributionLimitLabel(distributionLimit)}`
  return `Members w/ ${label} VP`
}

export function getVPDistributionRows(members: MemberInfo[], totalVP: number) {
  const rows: any[] = [['Total Members', members.length, '', Math.round(totalVP)]]

  for (let index = 0; index < VP_DISTRIBUTION_LIMITS.length; index++) {
    const distributionLimit = VP_DISTRIBUTION_LIMITS[index]
    const title = getDistributionTitle(index, distributionLimit)
    const filteredMembers = members.filter(member => isWithinDistributionLimits(member.totalVP, index, VP_DISTRIBUTION_LIMITS))
    const vp = sum(filteredMembers.map(member => member.totalVP))
    rows.push([title, filteredMembers.length, getRatio(filteredMembers.length, members.length), Math.round(vp), getRatio(vp, totalVP)])
  }
  return rows
}

export function getDelegatedVPDistributionRows(members: MemberInfo[]) {
  const membersWhoDelegated = members.filter(member => member.hasDelegated)

  const getMemberVP = (members: MemberInfo[], type: keyof MemberVP) => sum(members.map(member => member[type]))

  const landVP = getMemberVP(membersWhoDelegated, 'landVP')
  const namesVP = getMemberVP(membersWhoDelegated, 'namesVP')
  const manaVP = getMemberVP(membersWhoDelegated, 'manaVP')
  const l1WearablesVP = getMemberVP(membersWhoDelegated, 'l1WearablesVP')
  const rentalVP = getMemberVP(membersWhoDelegated, 'rentalVP')
  const estateVP = getMemberVP(membersWhoDelegated, 'estateVP')

  const totalDelegatedVP = landVP + namesVP + manaVP + l1WearablesVP + rentalVP + estateVP

  const getRow = (type: keyof MemberVP, value: number) => [type, Math.round(value), getRatio(value, totalDelegatedVP)]

  return [
    getRow('manaVP', manaVP),
    getRow('landVP', landVP),
    getRow('estateVP', estateVP),
    getRow('namesVP', namesVP),
    getRow('l1WearablesVP', l1WearablesVP),
    getRow('rentalVP', rentalVP),
    ['Total Delegated VP', Math.round(totalDelegatedVP)]
  ]
}