import {
  REALLOCATION_MONTHS,
  type LegacyPersistedCalculator,
  type PersistedCalculator,
  type RoiInputs,
} from './types'

export const STORAGE_KEY = 'hasan-roi-calculator:v2'
export const LEGACY_STORAGE_KEY = 'hasan-roi-optimizer:v1'

export const DEFAULT_INPUTS: RoiInputs = {
  monthlyInboundLeads: 75,
  currentCloseRate: 15,
  averageDealValue: 10_000,
  leadIncreaseRate: 20,
  leadNotes: '',
  leadConservativeFactor: 0,
  leadImplementationMonths: 0,
  numberSalespeople: 12,
  annualSalesPerRep: 200_000,
  lossReasons: '',
  additionalConversionWins: 50,
  conversionNotes: '',
  conversionConservativeFactor: 0,
  conversionImplementationMonths: 0,
  currentDiscountRate: 20,
  improvedDiscountRate: 10,
  discountNotes: '',
  discountConservativeFactor: 0,
  discountImplementationMonths: 0,
  deposit: 2_000,
  subscriptionYear1: 20_000,
  subscriptionYear2: 15_000,
  summaryImplementationMonths: 0,
  annualAdvertisingSpend: 1_000_000,
  presentationVolume: 1_600,
  selectedMonths: 1,
  systemInvestmentCost: 83_333,
  modeledFutureCloseRate: 17,
  marketingConservativeFactor: 0,
  marketingImplementationMonths: 0,
  risks: { operations: 'no', profitability: 'no', employment: 'no' },
}

const numericKeys: (keyof RoiInputs)[] = [
  'monthlyInboundLeads', 'currentCloseRate', 'averageDealValue', 'leadIncreaseRate',
  'leadConservativeFactor', 'leadImplementationMonths', 'numberSalespeople',
  'annualSalesPerRep', 'additionalConversionWins', 'conversionConservativeFactor',
  'conversionImplementationMonths', 'currentDiscountRate', 'improvedDiscountRate',
  'discountConservativeFactor', 'discountImplementationMonths', 'deposit',
  'subscriptionYear1', 'subscriptionYear2', 'summaryImplementationMonths',
  'annualAdvertisingSpend', 'presentationVolume', 'systemInvestmentCost',
  'modeledFutureCloseRate', 'marketingConservativeFactor', 'marketingImplementationMonths',
]

function numberParam(params: URLSearchParams, key: string, fallback: number): number {
  const raw = params.get(key)
  if (raw === null || raw.trim() === '') return fallback
  const value = Number(raw)
  return Number.isFinite(value) && value >= 0 ? value : fallback
}

export function migrateLegacyInputs(payload: LegacyPersistedCalculator | null): RoiInputs {
  if (!payload?.inputs) return DEFAULT_INPUTS
  const legacy = payload.inputs
  return {
    ...DEFAULT_INPUTS,
    monthlyInboundLeads: legacy.annualLeads === undefined ? DEFAULT_INPUTS.monthlyInboundLeads : legacy.annualLeads / 12,
    currentCloseRate: legacy.currentCloseRate ?? DEFAULT_INPUTS.currentCloseRate,
    averageDealValue: legacy.averageDealValue ?? DEFAULT_INPUTS.averageDealValue,
    annualAdvertisingSpend: legacy.annualAdvertisingSpend ?? DEFAULT_INPUTS.annualAdvertisingSpend,
    presentationVolume: legacy.presentationVolume ?? DEFAULT_INPUTS.presentationVolume,
    selectedMonths: legacy.selectedMonths ?? DEFAULT_INPUTS.selectedMonths,
    systemInvestmentCost: legacy.systemInvestmentCost ?? DEFAULT_INPUTS.systemInvestmentCost,
    modeledFutureCloseRate: legacy.modeledFutureCloseRate ?? DEFAULT_INPUTS.modeledFutureCloseRate,
    risks: legacy.risks ?? DEFAULT_INPUTS.risks,
  }
}

export function parseInputsFromUrl(search: string, fallback: RoiInputs): RoiInputs {
  const params = new URLSearchParams(search)
  const next = { ...fallback }
  for (const key of numericKeys) {
    const fallbackValue = fallback[key]
    if (typeof fallbackValue === 'number') {
      ;(next[key] as number) = numberParam(params, key, fallbackValue)
    }
  }
  const legacyLeads = params.get('leads')
  if (!params.has('monthlyInboundLeads') && legacyLeads) {
    next.monthlyInboundLeads = numberParam(params, 'leads', fallback.monthlyInboundLeads * 12) / 12
  }
  next.annualAdvertisingSpend = numberParam(params, 'spend', next.annualAdvertisingSpend)
  next.currentCloseRate = numberParam(params, 'closeRate', next.currentCloseRate)
  next.averageDealValue = numberParam(params, 'dealValue', next.averageDealValue)
  next.presentationVolume = numberParam(params, 'presentations', next.presentationVolume)
  next.systemInvestmentCost = numberParam(params, 'investment', next.systemInvestmentCost)
  next.modeledFutureCloseRate = numberParam(params, 'futureCloseRate', next.modeledFutureCloseRate)
  const monthValue = numberParam(params, 'months', fallback.selectedMonths)
  next.selectedMonths = REALLOCATION_MONTHS.includes(monthValue as RoiInputs['selectedMonths'])
    ? (monthValue as RoiInputs['selectedMonths'])
    : fallback.selectedMonths
  return next
}

export function loadInputs(): RoiInputs {
  let stored = DEFAULT_INPUTS
  try {
    const current = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as PersistedCalculator | null
    if (current?.schemaVersion === 2 && current.inputs) {
      stored = { ...DEFAULT_INPUTS, ...current.inputs, risks: { ...DEFAULT_INPUTS.risks, ...current.inputs.risks } }
    } else {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) ?? 'null') as LegacyPersistedCalculator | null
      stored = migrateLegacyInputs(legacy)
    }
  } catch {
    stored = DEFAULT_INPUTS
  }
  return parseInputsFromUrl(window.location.search, stored)
}

export function saveInputs(inputs: RoiInputs): void {
  const payload: PersistedCalculator = { schemaVersion: 2, inputs }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
}

export function createShareUrl(inputs: RoiInputs): string {
  const url = new URL(window.location.href)
  for (const key of numericKeys) {
    const value = inputs[key]
    if (typeof value === 'number') url.searchParams.set(key, String(value))
  }
  url.searchParams.set('months', String(inputs.selectedMonths))
  return url.toString()
}
