/** 2026 Israeli annual income-tax brackets. Upper bound of each band → rate. */
export const TAX_BRACKETS_2026: readonly { ceiling: number; rate: number }[] = [
  { ceiling: 84_120, rate: 0.1 },
  { ceiling: 120_720, rate: 0.14 },
  { ceiling: 228_000, rate: 0.2 },
  { ceiling: 301_200, rate: 0.31 },
  { ceiling: 560_280, rate: 0.35 },
  { ceiling: 721_560, rate: 0.47 },
  { ceiling: Number.POSITIVE_INFINITY, rate: 0.5 },
]

export const CGT_REAL_GAIN_RATE = 0.25

export const FUND_RETURN = {
  min: 0.03,
  max: 0.07,
  step: 0.005,
  defaultValue: 0.045,
} as const

export const PORTFOLIO_RETURN = {
  min: 0.055,
  max: 0.09,
  step: 0.005,
  defaultValue: 0.07,
} as const

export const DEFAULT_EXEMPTION_CEILING_2026 = 13_750
export const DEFAULT_INFLATION = 0.025
export const DEFAULT_RETIREMENT_AGE = 67

export type SimulationInputs = {
  /** Deposited severance balance in the fund (not tenure × salary). */
  x: number
  /** Last monthly gross salary. */
  y: number
  tenureYearsWhole: number
  tenureMonths: number
  currentAge: number
  retirementAge: number
  exemptionCeilingPerYear: number
  /** Annual inflation as a decimal, e.g. 0.025. */
  inflation: number
  /** Estimated annual taxable income (for marginal dismissal tax). */
  annualIncome: number
  /** Fund nominal annual return (path 1). */
  r: number
  /** Market portfolio nominal annual return (path 2). */
  p: number
}

export type DismissalBreakdown = {
  tenureYears: number
  exemptAmount: number
  z: number
  taxableOnDismissal: number
  dismissalTax: number
  netInvested: number
  n: number
}

export type Path1Result = {
  nominal: number
  real: number
}

export type Path2Result = {
  nominalGross: number
  basis: number
  realGain: number
  cgt: number
  nominalNet: number
  real: number
}

export type SimulationResult = {
  dismissal: DismissalBreakdown
  path1: Path1Result
  path2: Path2Result
  deltaReal: number
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function tenureYears(yearsWhole: number, months: number): number {
  return finite(yearsWhole) + finite(months) / 12
}

export function yearsToRetirement(currentAge: number, retirementAge: number): number {
  return Math.max(0, finite(retirementAge) - finite(currentAge))
}

/**
 * Progressive 2026 income tax on annual income. Ignores credit points.
 * Amounts at or below 0 yield 0.
 */
export function incomeTax2026(income: number): number {
  if (!Number.isFinite(income) || income <= 0) return 0

  let tax = 0
  let lower = 0
  let remaining = income

  for (const { ceiling, rate } of TAX_BRACKETS_2026) {
    const bandWidth = ceiling - lower
    const band = Math.min(remaining, bandWidth)
    if (band <= 0) break
    tax += band * rate
    remaining -= band
    lower = ceiling
    if (remaining <= 0) break
  }

  return tax
}

export function exemptAmount(input: {
  x: number
  y: number
  tenureYears: number
  exemptionCeilingPerYear: number
}): number {
  const x = Math.max(0, finite(input.x))
  const salaryCap = Math.max(0, finite(input.y)) * 1.5 * Math.max(0, finite(input.tenureYears))
  const ceilingCap =
    Math.max(0, finite(input.exemptionCeilingPerYear)) * Math.max(0, finite(input.tenureYears))
  return Math.min(x, salaryCap, ceilingCap)
}

/** Exempt share of the fund balance. Safe when x = 0 (returns 0). */
export function exemptRatioZ(exempt: number, x: number): number {
  if (!Number.isFinite(x) || x <= 0) return 0
  return clamp(exempt / x, 0, 1)
}

export function taxableOnDismissal(x: number, exempt: number): number {
  return Math.max(0, finite(x) - finite(exempt))
}

export function dismissalTax(annualIncome: number, taxable: number): number {
  const income = finite(annualIncome)
  const extra = Math.max(0, finite(taxable))
  return incomeTax2026(income + extra) - incomeTax2026(income)
}

export function netInvested(x: number, taxOnDismissal: number): number {
  return finite(x) - finite(taxOnDismissal)
}

export function compound(principal: number, rate: number, years: number): number {
  return finite(principal) * Math.pow(1 + finite(rate), finite(years))
}

export function toReal(nominal: number, inflation: number, years: number): number {
  const denom = Math.pow(1 + finite(inflation), finite(years))
  if (!Number.isFinite(denom) || denom === 0) return finite(nominal)
  return finite(nominal) / denom
}

export function path1Fund(x: number, r: number, inflation: number, n: number): Path1Result {
  const nominal = compound(x, r, n)
  return { nominal, real: toReal(nominal, inflation, n) }
}

export function path2Market(
  invested: number,
  p: number,
  inflation: number,
  n: number,
): Path2Result {
  const nominalGross = compound(invested, p, n)
  const basis = compound(invested, inflation, n)
  const realGain = Math.max(0, nominalGross - basis)
  const cgt = CGT_REAL_GAIN_RATE * realGain
  const nominalNet = nominalGross - cgt
  return {
    nominalGross,
    basis,
    realGain,
    cgt,
    nominalNet,
    real: toReal(nominalNet, inflation, n),
  }
}

export function simulate(inputs: SimulationInputs): SimulationResult {
  const years = tenureYears(inputs.tenureYearsWhole, inputs.tenureMonths)
  const n = yearsToRetirement(inputs.currentAge, inputs.retirementAge)
  const exempt = exemptAmount({
    x: inputs.x,
    y: inputs.y,
    tenureYears: years,
    exemptionCeilingPerYear: inputs.exemptionCeilingPerYear,
  })
  const z = exemptRatioZ(exempt, inputs.x)
  const taxable = taxableOnDismissal(inputs.x, exempt)
  const taxDue = dismissalTax(inputs.annualIncome, taxable)
  const invested = netInvested(inputs.x, taxDue)

  const path1 = path1Fund(inputs.x, inputs.r, inputs.inflation, n)
  const path2 = path2Market(invested, inputs.p, inputs.inflation, n)

  return {
    dismissal: {
      tenureYears: years,
      exemptAmount: exempt,
      z,
      taxableOnDismissal: taxable,
      dismissalTax: taxDue,
      netInvested: invested,
      n,
    },
    path1,
    path2,
    deltaReal: path1.real - path2.real,
  }
}

function finite(value: number): number {
  return Number.isFinite(value) ? value : 0
}
