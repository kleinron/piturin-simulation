import { describe, expect, it } from 'vitest'
import { defaultInputs } from './defaults.ts'
import {
  CGT_REAL_GAIN_RATE,
  TAX_BRACKETS_2026,
  clamp,
  dismissalTax,
  exemptAmount,
  exemptRatioZ,
  incomeTax2026,
  netInvested,
  path1Fund,
  path2Market,
  simulate,
  taxableOnDismissal,
  tenureYears,
  yearsToRetirement,
} from './piturin.ts'

const EPS = 1e-9

function close(actual: number, expected: number, eps = EPS): void {
  expect(actual).toBeCloseTo(expected, Math.max(0, Math.round(-Math.log10(eps))))
}

describe('2026 tax brackets', () => {
  it('uses the specified ceilings and rates', () => {
    const ceilings = TAX_BRACKETS_2026.map((b) => b.ceiling)
    const rates = TAX_BRACKETS_2026.map((b) => b.rate)
    expect(ceilings.slice(0, 6)).toEqual([84_120, 120_720, 228_000, 301_200, 560_280, 721_560])
    expect(rates).toEqual([0.1, 0.14, 0.2, 0.31, 0.35, 0.47, 0.5])
  })

  it('returns 0 for non-positive income', () => {
    expect(incomeTax2026(0)).toBe(0)
    expect(incomeTax2026(-10)).toBe(0)
    expect(incomeTax2026(Number.NaN)).toBe(0)
  })

  it('taxes the first band at 10%', () => {
    expect(incomeTax2026(84_120)).toBe(84_120 * 0.1)
    expect(incomeTax2026(50_000)).toBe(5_000)
  })

  it('crosses into the 14% band after 84,120', () => {
    expect(incomeTax2026(84_121)).toBeCloseTo(84_120 * 0.1 + 1 * 0.14, 10)
  })

  it('matches cumulative tax at each published ceiling', () => {
    const taxAt84120 = 84_120 * 0.1
    const taxAt120720 = taxAt84120 + (120_720 - 84_120) * 0.14
    const taxAt228000 = taxAt120720 + (228_000 - 120_720) * 0.2
    const taxAt301200 = taxAt228000 + (301_200 - 228_000) * 0.31
    const taxAt560280 = taxAt301200 + (560_280 - 301_200) * 0.35
    const taxAt721560 = taxAt560280 + (721_560 - 560_280) * 0.47

    expect(incomeTax2026(120_720)).toBeCloseTo(taxAt120720, 8)
    expect(incomeTax2026(228_000)).toBeCloseTo(taxAt228000, 8)
    expect(incomeTax2026(301_200)).toBeCloseTo(taxAt301200, 8)
    expect(incomeTax2026(560_280)).toBeCloseTo(taxAt560280, 8)
    expect(incomeTax2026(721_560)).toBeCloseTo(taxAt721560, 8)
    expect(incomeTax2026(721_560 + 2_000)).toBeCloseTo(taxAt721560 + 2_000 * 0.5, 8)
  })

  it('computes a mid-band amount (100,000) progressively', () => {
    const expected = 84_120 * 0.1 + (100_000 - 84_120) * 0.14
    expect(incomeTax2026(100_000)).toBeCloseTo(expected, 8)
  })
})

describe('exemption and z', () => {
  it('computes tenure as years + months/12', () => {
    expect(tenureYears(10, 0)).toBe(10)
    expect(tenureYears(10, 6)).toBe(10.5)
    expect(tenureYears(0, 3)).toBe(0.25)
  })

  it('takes the minimum of x, 1.5·y·tenure, and ceiling·tenure', () => {
    // ceiling binds: 13,750 * 10 = 137,500
    expect(
      exemptAmount({ x: 200_000, y: 15_000, tenureYears: 10, exemptionCeilingPerYear: 13_750 }),
    ).toBe(137_500)

    // salary cap binds: 10,000 * 1.5 * 8 = 120,000
    expect(
      exemptAmount({ x: 400_000, y: 10_000, tenureYears: 8, exemptionCeilingPerYear: 20_000 }),
    ).toBe(120_000)

    // x binds
    expect(
      exemptAmount({ x: 50_000, y: 20_000, tenureYears: 10, exemptionCeilingPerYear: 13_750 }),
    ).toBe(50_000)
  })

  it('is zero when tenure or salary is zero', () => {
    expect(
      exemptAmount({ x: 100_000, y: 0, tenureYears: 10, exemptionCeilingPerYear: 13_750 }),
    ).toBe(0)
    expect(
      exemptAmount({ x: 100_000, y: 15_000, tenureYears: 0, exemptionCeilingPerYear: 13_750 }),
    ).toBe(0)
  })

  it('clamps z to [0, 1] and is safe when x = 0', () => {
    expect(exemptRatioZ(80, 100)).toBe(0.8)
    expect(exemptRatioZ(0, 0)).toBe(0)
    expect(exemptRatioZ(10, 0)).toBe(0)
    expect(exemptRatioZ(200, 100)).toBe(1)
    expect(clamp(-1, 0, 1)).toBe(0)
    expect(clamp(2, 0, 1)).toBe(1)
  })

  it('derives taxable slice and net invested from tax(income + taxable) − tax(income)', () => {
    const x = 200_000
    const exempt = 137_500
    const taxable = taxableOnDismissal(x, exempt)
    expect(taxable).toBe(62_500)

    const income = 180_000
    const taxDue = dismissalTax(income, taxable)
    expect(taxDue).toBeCloseTo(incomeTax2026(income + taxable) - incomeTax2026(income), 8)
    expect(netInvested(x, taxDue)).toBeCloseTo(x - taxDue, 8)
    expect(taxableOnDismissal(50, 80)).toBe(0)
  })
})

describe('path 1 — fund (preferential)', () => {
  it('has no tax: nominal = x·(1+r)^n and real = nominal / (1+i)^n', () => {
    const x = 100
    const r = 0.05
    const i = 0.025
    const n = 1
    const result = path1Fund(x, r, i, n)
    expect(result.nominal).toBeCloseTo(105, 10)
    expect(result.real).toBeCloseTo(105 / 1.025, 10)
  })

  it('returns the balance unchanged when n = 0', () => {
    const result = path1Fund(250_000, 0.045, 0.025, 0)
    expect(result.nominal).toBe(250_000)
    expect(result.real).toBe(250_000)
  })

  it('compounds over many years', () => {
    const result = path1Fund(200_000, 0.045, 0.025, 22)
    const nominal = 200_000 * Math.pow(1.045, 22)
    close(result.nominal, nominal)
    close(result.real, nominal / Math.pow(1.025, 22))
  })
})

describe('path 2 — withdraw, tax, market', () => {
  it('charges 25% CGT on real gain only', () => {
    const invested = 100
    const result = path2Market(invested, 0.07, 0.025, 1)
    expect(result.nominalGross).toBeCloseTo(107, 10)
    expect(result.basis).toBeCloseTo(102.5, 10)
    expect(result.realGain).toBeCloseTo(4.5, 10)
    expect(result.cgt).toBeCloseTo(4.5 * CGT_REAL_GAIN_RATE, 10)
    expect(result.nominalNet).toBeCloseTo(107 - 1.125, 10)
    expect(result.real).toBeCloseTo((107 - 1.125) / 1.025, 10)
  })

  it('has zero CGT when the portfolio only keeps up with inflation', () => {
    const result = path2Market(80_000, 0.025, 0.025, 10)
    expect(result.realGain).toBe(0)
    expect(result.cgt).toBe(0)
    expect(result.real).toBeCloseTo(80_000, 6)
  })

  it('does not create a CGT credit when p < i', () => {
    const result = path2Market(10_000, 0.01, 0.03, 5)
    expect(result.realGain).toBe(0)
    expect(result.cgt).toBe(0)
    expect(result.nominalNet).toBe(result.nominalGross)
    expect(result.real).toBeLessThan(10_000)
  })
})

describe('full simulation', () => {
  it('wires dismissal math into both paths and the real gap', () => {
    const result = simulate({
      ...defaultInputs,
      x: 200_000,
      y: 15_000,
      tenureYearsWhole: 10,
      tenureMonths: 0,
      currentAge: 40,
      retirementAge: 67,
      exemptionCeilingPerYear: 13_750,
      inflation: 0.025,
      annualIncome: 180_000,
      r: 0.045,
      p: 0.07,
    })

    expect(result.dismissal.tenureYears).toBe(10)
    expect(result.dismissal.n).toBe(27)
    expect(result.dismissal.exemptAmount).toBe(137_500)
    expect(result.dismissal.z).toBeCloseTo(137_500 / 200_000, 10)
    expect(result.dismissal.taxableOnDismissal).toBe(62_500)

    const expectedTax = incomeTax2026(180_000 + 62_500) - incomeTax2026(180_000)
    expect(result.dismissal.dismissalTax).toBeCloseTo(expectedTax, 8)
    expect(result.dismissal.netInvested).toBeCloseTo(200_000 - expectedTax, 8)

    const n = 27
    const nominal1 = 200_000 * Math.pow(1.045, n)
    expect(result.path1.nominal).toBeCloseTo(nominal1, 6)
    expect(result.path1.real).toBeCloseTo(nominal1 / Math.pow(1.025, n), 6)

    const invested = result.dismissal.netInvested
    const gross2 = invested * Math.pow(1.07, n)
    const basis = invested * Math.pow(1.025, n)
    const realGain = Math.max(0, gross2 - basis)
    const cgt = 0.25 * realGain
    const net2 = gross2 - cgt
    expect(result.path2.nominalGross).toBeCloseTo(gross2, 6)
    expect(result.path2.cgt).toBeCloseTo(cgt, 6)
    expect(result.path2.nominalNet).toBeCloseTo(net2, 6)
    expect(result.path2.real).toBeCloseTo(net2 / Math.pow(1.025, n), 6)
    expect(result.deltaReal).toBeCloseTo(result.path1.real - result.path2.real, 8)
  })

  it('handles x = 0 without NaN', () => {
    const result = simulate({ ...defaultInputs, x: 0, annualIncome: 200_000 })
    expect(result.dismissal.z).toBe(0)
    expect(result.dismissal.exemptAmount).toBe(0)
    expect(result.dismissal.dismissalTax).toBe(0)
    expect(result.path1.real).toBe(0)
    expect(result.path2.real).toBe(0)
    expect(result.deltaReal).toBe(0)
    expect(Number.isNaN(result.dismissal.z)).toBe(false)
  })

  it('clamps years-to-retirement at 0 when already past retirement age', () => {
    expect(yearsToRetirement(70, 67)).toBe(0)
    const result = simulate({ ...defaultInputs, currentAge: 70, retirementAge: 67 })
    expect(result.dismissal.n).toBe(0)
    expect(result.path1.real).toBe(defaultInputs.x)
  })
})
