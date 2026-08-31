export const REALLOCATION_MONTHS = [1, 2, 4, 6, 8, 10, 12] as const

export type ReallocationMonths = (typeof REALLOCATION_MONTHS)[number]
export type RiskAnswer = 'yes' | 'no' | null
export type ModuleId = 'dashboard' | 'lead' | 'conversion' | 'discount' | 'marketing' | 'summary'
export type MarketingStageId = 'investment' | 'reallocation' | 'impact' | 'economics' | 'analysis' | 'outcome'

export interface RoiInputs {
  monthlyInboundLeads: number
  currentCloseRate: number
  averageDealValue: number
  leadIncreaseRate: number
  leadNotes: string
  leadConservativeFactor: number
  leadImplementationMonths: number
  numberSalespeople: number
  annualSalesPerRep: number
  lossReasons: string
  additionalConversionWins: number
  conversionNotes: string
  conversionConservativeFactor: number
  conversionImplementationMonths: number
  currentDiscountRate: number
  improvedDiscountRate: number
  discountNotes: string
  discountConservativeFactor: number
  discountImplementationMonths: number
  deposit: number
  subscriptionYear1: number
  subscriptionYear2: number
  summaryImplementationMonths: number
  annualAdvertisingSpend: number
  presentationVolume: number
  selectedMonths: ReallocationMonths
  systemInvestmentCost: number
  modeledFutureCloseRate: number
  marketingConservativeFactor: number
  marketingImplementationMonths: number
  risks: {
    operations: RiskAnswer
    profitability: RiskAnswer
    employment: RiskAnswer
  }
}

export interface ProjectionResult {
  baseAnnual: number
  year1: number
  year2: number
  total: number
}

export interface RoiResults {
  annualLeads: number
  currentLeadWins: number
  currentLeadRevenue: number
  increasedAnnualLeads: number
  additionalLeadWins: number
  leadGenerationRevenue: number
  leadProjection: ProjectionResult
  expectedAnnualSales: number
  dealsNeeded: number
  dealsPerRep: number
  lossRate: number
  opportunitiesWorked: number
  opportunitiesLost: number
  moneyLeftOnTable: number
  conversionRevenue: number
  lossRateReductionNeeded: number | null
  conversionProjection: ProjectionResult
  projectedAnnualSales: number
  discountReduction: number
  discountRevenue: number
  equivalentDeals: number | null
  discountProjection: ProjectionResult
  averageMonthlySpend: number
  reallocationPercentage: number
  reallocationValue: number
  remainingInvestmentPercentage: number
  remainingAdvertisingInvestment: number
  costPerLead: number | null
  currentAdvertisingCostPerWin: number | null
  marketingCostPerPresentation: number | null
  investmentPercentage: number | null
  breakEvenAdditionalDeals: number
  breakEvenCloseRateLift: number | null
  futureWins: number
  incrementalWins: number
  incrementalRevenue: number
  futureAdvertisingCostPerWin: number | null
  acquisitionCostImprovement: number | null
  returnMultiple: number | null
  riskStatus: 'confirmed' | 'review' | 'incomplete'
  marketingProjection: ProjectionResult
  grossYear1: number
  grossYear2: number
  grossTotal: number
  costYear1: number
  costYear2: number
  totalCost: number
  netYear1: number
  netYear2: number
  netTotal: number
  roiPercentage: number | null
  netPresentValue: number
  paybackMonths: number | null
}

export interface PersistedCalculator {
  schemaVersion: 2
  inputs: RoiInputs
}

export interface LegacyPersistedCalculator {
  schemaVersion: 1
  inputs: {
    annualAdvertisingSpend?: number
    annualLeads?: number
    currentCloseRate?: number
    averageDealValue?: number
    presentationVolume?: number
    selectedMonths?: ReallocationMonths
    systemInvestmentCost?: number
    modeledFutureCloseRate?: number
    risks?: RoiInputs['risks']
  }
}
