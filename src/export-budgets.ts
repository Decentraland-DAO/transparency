import BUDGETS from './budgets.json'
import { reportToRollbarAndThrow, saveToJSON } from './utils'
import utc from 'dayjs/plugin/utc'
import dayjs from 'dayjs'

dayjs.extend(utc)

export interface Budget {
  start_date: string
  total: number
  category_percentages: Record<string, number>
}

export function validateDate(rawDate: string) {
  if (!rawDate || rawDate.length === 0) throw new Error('Unable to parse empty date for budget')
  let date
  try {
    date = Date.parse(rawDate)
  } catch (e) {
    throw new Error(`Unable to parse date format for budget: ${e}`)
  }
  if (!date || isNaN(date)) throw new Error('Unable to parse date format for budget')
  if (date < Date.parse('2023-01-01T00:00:00Z')) {
    throw new Error(`Invalid budget start date ${rawDate}. Date needs to be after 2023-01-01T00:00:00Z`)
  }
  return date
}

export function validateCategoryPercentages(categoryPercentages: Record<string, number>) {
  let totalPercentage = 0
  for (const category of Object.keys(categoryPercentages)) {
    totalPercentage += categoryPercentages[category]
  }
  if (totalPercentage !== 100) {
    throw new Error(`Total percentage invalid for budget. Expected 100, received ${totalPercentage}`)
  }
}

export function getQuarterEndDate(quarterStartDate: Date) {
  const startDate = new Date(quarterStartDate)
  return new Date(dayjs.utc(startDate.toISOString()).add(3, 'months').toISOString())
}

function validateThereIsNoOverlapping(currentDate: Date, nextStartDate) {
  const endDate = getQuarterEndDate(currentDate)
  if (endDate > nextStartDate) {
    throw new Error(`Budgets can't overlap`)
  }
}

function validateSorting(currentDate: Date, nextStartDate) {
  if (currentDate > nextStartDate) {
    throw new Error('Budgets need to be sorted by date')
  }
}

export function validateBudgets(budgets: Budget[]) {
  for (let i = 0; i < budgets.length; i++) {
    const currentDate: Date = validateDate(budgets[i].start_date)
    validateCategoryPercentages(budgets[i].category_percentages)
    if (i < budgets.length - 1) {
      const nextStartDate = validateDate(budgets[i + 1].start_date)
      validateSorting(currentDate, nextStartDate)
      validateThereIsNoOverlapping(currentDate, nextStartDate)
    }
  }
  return budgets
}

async function main() {
  const budgets = BUDGETS as Budget[]
  if (!budgets || budgets.length === 0) {
    throw new Error('No budgets available for export')
  }
  saveToJSON('budgets.json', validateBudgets(budgets))
}

main().catch((error) => reportToRollbarAndThrow(__filename, error))
