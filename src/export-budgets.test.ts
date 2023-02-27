import { getQuarterEndDate, validateBudgets, validateCategoryPercentages, validateDate } from './export-budgets'


const BUDGET_1 = {
  'start_date': '2023-01-01T00:00:00Z',
  'total': 1501500,
  'category_percentages': {
    'accelerator': 7,
    'core_unit': 15,
    'documentation': 3,
    'in_world_content': 20,
    'platform': 40,
    'social_media_content': 5,
    'sponsorship': 10
  }
}

const BUDGET_2 = {
  'start_date': '2023-04-01T00:00:00Z',
  'total': 1501500,
  'category_percentages': {
    'accelerator': 7,
    'core_unit': 15,
    'documentation': 3,
    'in_world_content': 20,
    'platform': 40,
    'social_media_content': 5,
    'sponsorship': 10
  }
}


const BUDGET_3 = {
  'start_date': '2023-07-01T00:00:00Z',
  'total': 1501500,
  'category_percentages': {
    'accelerator': 7,
    'core_unit': 15,
    'documentation': 3,
    'in_world_content': 20,
    'platform': 40,
    'social_media_content': 5,
    'sponsorship': 10
  }
}

const BUDGET_OVERLAPPED = {
  'start_date': '2023-06-30T00:00:00Z',
  'total': 1501500,
  'category_percentages': {
    'accelerator': 7,
    'core_unit': 15,
    'documentation': 3,
    'in_world_content': 20,
    'platform': 40,
    'social_media_content': 5,
    'sponsorship': 10
  }
}

describe('validateBudgets', () => {
  describe('validate category percentages', () => {
    it('throws when percentages do not match 100', () => {
      const categoryPercentages = {
        'accelerator': 6,
        'core_unit': 15,
        'documentation': 3,
        'in_world_content': 20,
        'platform': 40,
        'social_media_content': 5,
        'sponsorship': 10
      }
      expect(() => validateCategoryPercentages(categoryPercentages)).toThrowError(`Total percentage invalid for budget. Expected 100, received 99`)
    })
    it('validates percentages that match 100', () => {
      const categoryPercentages = {
        'accelerator': 7,
        'core_unit': 15,
        'documentation': 3,
        'in_world_content': 20,
        'platform': 40,
        'social_media_content': 5,
        'sponsorship': 10
      }
      expect(() => validateCategoryPercentages(categoryPercentages)).not.toThrowError()
    })
  })

  describe('validate dates', () => {
    it('throws when a raw date is not valid', () => {
      expect(() => validateDate('')).toThrowError('Unable to parse empty date for budget')
      expect(() => validateDate(null)).toThrowError('Unable to parse empty date for budget')
      expect(() => validateDate('123sas')).toThrowError('Unable to parse date format for budget')
      expect(() => validateDate('2022-12-31T00:00:00Z')).toThrowError('Invalid budget start date 2022-12-31T00:00:00Z. Date needs to be after 2023-01-01T00:00:00Z')
    })

    it('returns a date when raw date is valid', () => {
      expect(validateDate('2023-01-01T00:00:00Z')).toBe(Date.parse('2023-01-01T00:00:00Z'))
    })
  })

  describe('validates budgets are added in order and do not overlap each other', () => {
    it('throws when a budget date is earlier than the previous one', () => {
      const invalidBudgets = [BUDGET_2, BUDGET_1, BUDGET_3]
      expect(() => validateBudgets(invalidBudgets)).toThrowError('Budgets need to be sorted by date')
    })

    it('throws when a budget calculated end date is after than the next budget start date', () => {
      const overlappingBudgets = [BUDGET_1, BUDGET_2, BUDGET_OVERLAPPED]
      expect(() => validateBudgets(overlappingBudgets)).toThrowError(`Budgets can't overlap`)
    })

    it('return all budgets if they are valid', () => {
      const validBudgets = [BUDGET_1, BUDGET_2, BUDGET_3]
      expect(validateBudgets(validBudgets)).toBe(validBudgets)
    })
  })
})

describe('getQuarterEndDate', () => {
  it('gets the same day of the month, three months later', () => {
    expect(getQuarterEndDate(new Date('2023-01-01T00:00:00Z'))).toEqual(new Date('2023-04-01T00:00:00Z'))
    expect(getQuarterEndDate(new Date('2023-04-01T00:00:00Z'))).toEqual(new Date('2023-07-01T00:00:00Z'))
    expect(getQuarterEndDate(new Date('2023-07-01T00:00:00Z'))).toEqual(new Date('2023-10-01T00:00:00Z'))
    expect(getQuarterEndDate(new Date('2023-10-01T00:00:00Z'))).toEqual(new Date('2024-01-01T00:00:00Z'))

    expect(getQuarterEndDate(new Date('2023-01-02T00:00:00Z'))).toEqual(new Date('2023-04-02T00:00:00Z'))
    expect(getQuarterEndDate(new Date('2023-04-03T00:00:00Z'))).toEqual(new Date('2023-07-03T00:00:00Z'))
    expect(getQuarterEndDate(new Date('2023-07-04T00:00:00Z'))).toEqual(new Date('2023-10-04T00:00:00Z'))
    expect(getQuarterEndDate(new Date('2023-10-05T00:00:00Z'))).toEqual(new Date('2024-01-05T00:00:00Z'))
  })
})
