const ils = new Intl.NumberFormat('he-IL', {
  style: 'currency',
  currency: 'ILS',
  maximumFractionDigits: 0,
})

export function formatILS(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return ils.format(Math.round(value))
}

export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('he-IL', {
    style: 'percent',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

export function formatYears(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('he-IL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}
