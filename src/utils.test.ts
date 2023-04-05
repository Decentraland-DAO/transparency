import { getMonthsBetweenDates } from "./utils"

describe("getMonthsBetweenDates", () => {
  it("should return 0 if the start and end dates are the same", () => {
    const startDate = new Date("2022-01-01")
    const endDate = new Date("2022-01-01")
    expect(getMonthsBetweenDates(startDate, endDate)).toBe(0)
  })

  it("should return the correct number of months between two dates", () => {
    const startDate = new Date("2022-01-01")
    const endDate = new Date("2022-12-31")
    expect(getMonthsBetweenDates(startDate, endDate)).toBe(12)
  })

  it("should handle differences in years correctly", () => {
    const startDate = new Date("2022-01-01")
    const endDate = new Date("2024-12-31")
    expect(getMonthsBetweenDates(startDate, endDate)).toBe(36)
  })

  it("should handle differences in months correctly", () => {
    const startDate = new Date("2022-01-01")
    const endDate = new Date("2022-03-31")
    expect(getMonthsBetweenDates(startDate, endDate)).toBe(3)
  })
})

describe("getMonthsBetweenDates edge cases", () => {
  it("should throw an error if startDate is null", () => {
    const startDate = null
    const endDate = new Date("2022-12-31")
    expect(() => getMonthsBetweenDates(startDate, endDate)).toThrow()
  })

  it("should throw an error if endDate is undefined", () => {
    const startDate = new Date("2022-01-01")
    const endDate = undefined
    expect(() => getMonthsBetweenDates(startDate, endDate)).toThrow()
  })

  it("should throw an error if startDate is not a valid date", () => {
    const startDate = "not a date"
    const endDate = new Date("2022-12-31")
    expect(() => getMonthsBetweenDates(startDate as any, endDate)).toThrow()
  })

  it("should throw an error if endDate is a number", () => {
    const startDate = new Date("2022-01-01")
    const endDate = 123456
    expect(() => getMonthsBetweenDates(startDate, endDate as any)).toThrow()
  })

  it("should handle large dates correctly", () => {
    const startDate = new Date("1900-01-01")
    const endDate = new Date("2200-12-31")
    expect(getMonthsBetweenDates(startDate, endDate)).toBe(3612)
  })

  it("should handle leap years correctly", () => {
    const startDate = new Date("2020-02-29")
    const endDate = new Date("2023-05-31")
    expect(getMonthsBetweenDates(startDate, endDate)).toBe(39)
  })
})