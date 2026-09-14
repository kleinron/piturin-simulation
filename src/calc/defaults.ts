import {
  DEFAULT_EXEMPTION_CEILING_2026,
  DEFAULT_INFLATION,
  DEFAULT_RETIREMENT_AGE,
  FUND_RETURN,
  PORTFOLIO_RETURN,
  type SimulationInputs,
} from './piturin.ts'

export const DEFAULT_Y = 18_000
export const DEFAULT_X = 250_000

export const defaultInputs: SimulationInputs = {
  x: DEFAULT_X,
  y: DEFAULT_Y,
  tenureYearsWhole: 12,
  tenureMonths: 0,
  currentAge: 45,
  retirementAge: DEFAULT_RETIREMENT_AGE,
  exemptionCeilingPerYear: DEFAULT_EXEMPTION_CEILING_2026,
  inflation: DEFAULT_INFLATION,
  annualIncome: DEFAULT_Y * 12,
  r: FUND_RETURN.defaultValue,
  p: PORTFOLIO_RETURN.defaultValue,
}
