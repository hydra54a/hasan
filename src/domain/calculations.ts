import type { ProjectionResult, RoiInputs, RoiResults } from './types'

const safe = (value: number): number => (Number.isFinite(value) && value > 0 ? value : 0)
const clamp = (value: number, minimum = 0, maximum = 100): number =>
  Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? value : minimum))
const divide = (numerator: number, denominator: number): number | null =>
  denominator > 0 ? numerator / denominator : null

export function projectAnnualValue(
  rawValue: number,
  rawConservativeFactor: number,
  rawImplementationMonths: number,
): ProjectionResult {
  const baseAnnual = safe(rawValue)
  const confidence = 1 - clamp(rawConservativeFactor) / 100
  const implementationMonths = clamp(rawImplementationMonths, 0, 12)
  const year1 = baseAnnual * confidence * ((12 - implementationMonths) / 12)
  const year2 = baseAnnual * confidence
  return { baseAnnual, year1, year2, total: year1 + year2 }
}

export function calculateRoi(rawInputs: RoiInputs): RoiResults {
  const monthlyInboundLeads = safe(rawInputs.monthlyInboundLeads)
  const currentCloseRate = clamp(rawInputs.currentCloseRate)
  const closeRate = currentCloseRate / 100
  const averageDealValue = safe(rawInputs.averageDealValue)
  const annualLeads = monthlyInboundLeads * 12
  const currentLeadWins = annualLeads * closeRate
  const currentLeadRevenue = currentLeadWins * averageDealValue
  const increasedAnnualLeads = annualLeads * (clamp(rawInputs.leadIncreaseRate) / 100)
  const additionalLeadWins = increasedAnnualLeads * closeRate
  const leadGenerationRevenue = additionalLeadWins * averageDealValue
  const leadProjection = projectAnnualValue(leadGenerationRevenue, rawInputs.leadConservativeFactor, rawInputs.leadImplementationMonths)

  const numberSalespeople = safe(rawInputs.numberSalespeople)
  const annualSalesPerRep = safe(rawInputs.annualSalesPerRep)
  const expectedAnnualSales = numberSalespeople * annualSalesPerRep
  const dealsNeeded = divide(expectedAnnualSales, averageDealValue) ?? 0
  const dealsPerRep = divide(dealsNeeded, numberSalespeople) ?? 0
  const lossRate = 100 - currentCloseRate
  const opportunitiesWorked = divide(dealsNeeded, closeRate) ?? 0
  const opportunitiesLost = Math.max(0, opportunitiesWorked - dealsNeeded)
  const moneyLeftOnTable = opportunitiesLost * averageDealValue
  const additionalConversionWins = safe(rawInputs.additionalConversionWins)
  const conversionRevenue = additionalConversionWins * averageDealValue
  const lossRateReductionNeeded = divide(additionalConversionWins * 100, opportunitiesLost)
  const conversionProjection = projectAnnualValue(conversionRevenue, rawInputs.conversionConservativeFactor, rawInputs.conversionImplementationMonths)

  const projectedAnnualSales = dealsNeeded * averageDealValue
  const discountReduction = Math.max(0, clamp(rawInputs.currentDiscountRate) - clamp(rawInputs.improvedDiscountRate))
  const discountRevenue = projectedAnnualSales * (discountReduction / 100)
  const equivalentDeals = divide(discountRevenue, averageDealValue)
  const discountProjection = projectAnnualValue(discountRevenue, rawInputs.discountConservativeFactor, rawInputs.discountImplementationMonths)

  const annualAdvertisingSpend = safe(rawInputs.annualAdvertisingSpend)
  const presentationVolume = safe(rawInputs.presentationVolume)
  const systemInvestmentCost = safe(rawInputs.systemInvestmentCost)
  const modeledFutureCloseRate = clamp(rawInputs.modeledFutureCloseRate)
  const averageMonthlySpend = annualAdvertisingSpend / 12
  const reallocationPercentage = (rawInputs.selectedMonths / 12) * 100
  const reallocationValue = annualAdvertisingSpend * (rawInputs.selectedMonths / 12)
  const remainingInvestmentPercentage = 100 - reallocationPercentage
  const remainingAdvertisingInvestment = annualAdvertisingSpend - reallocationValue
  const costPerLead = divide(annualAdvertisingSpend, annualLeads)
  const currentAdvertisingCostPerWin = divide(annualAdvertisingSpend, currentLeadWins)
  const marketingCostPerPresentation = divide(annualAdvertisingSpend, presentationVolume)
  const investmentPercentage = divide(systemInvestmentCost * 100, reallocationValue)
  const breakEvenAdditionalDeals = averageDealValue > 0 ? Math.ceil(systemInvestmentCost / averageDealValue) : 0
  const breakEvenCloseRateLift = divide(breakEvenAdditionalDeals * 100, presentationVolume)
  const futureWins = annualLeads * (modeledFutureCloseRate / 100)
  const incrementalWins = Math.max(0, futureWins - currentLeadWins)
  const incrementalRevenue = incrementalWins * averageDealValue
  const futureAdvertisingCostPerWin = divide(annualAdvertisingSpend, futureWins)
  const acquisitionCostImprovement = currentAdvertisingCostPerWin !== null && futureAdvertisingCostPerWin !== null
    ? currentAdvertisingCostPerWin - futureAdvertisingCostPerWin
    : null
  const returnMultiple = divide(incrementalRevenue, systemInvestmentCost)
  const marketingProjection = projectAnnualValue(incrementalRevenue, rawInputs.marketingConservativeFactor, rawInputs.marketingImplementationMonths)

  const riskValues = Object.values(rawInputs.risks)
  const riskStatus = riskValues.some((answer) => answer === null)
    ? 'incomplete'
    : riskValues.some((answer) => answer === 'yes') ? 'review' : 'confirmed'

  const grossYear1 = leadProjection.year1 + conversionProjection.year1 + discountProjection.year1 + marketingProjection.year1
  const grossYear2 = leadProjection.year2 + conversionProjection.year2 + discountProjection.year2 + marketingProjection.year2
  const grossTotal = grossYear1 + grossYear2
  const costYear1 = safe(rawInputs.deposit) + safe(rawInputs.subscriptionYear1)
  const costYear2 = safe(rawInputs.subscriptionYear2)
  const totalCost = costYear1 + costYear2
  const netYear1 = grossYear1 - costYear1
  const netYear2 = grossYear2 - costYear2
  const netTotal = netYear1 + netYear2
  const roiPercentage = divide(netTotal * 100, totalCost)
  const netPresentValue = netYear1 / 1.02 + netYear2 / (1.02 ** 2)
  const paybackMonths = divide(totalCost * 12, grossYear1)

  return {
    annualLeads, currentLeadWins, currentLeadRevenue, increasedAnnualLeads, additionalLeadWins,
    leadGenerationRevenue, leadProjection, expectedAnnualSales, dealsNeeded, dealsPerRep, lossRate,
    opportunitiesWorked, opportunitiesLost, moneyLeftOnTable, conversionRevenue,
    lossRateReductionNeeded, conversionProjection, projectedAnnualSales, discountReduction,
    discountRevenue, equivalentDeals, discountProjection, averageMonthlySpend,
    reallocationPercentage, reallocationValue, remainingInvestmentPercentage,
    remainingAdvertisingInvestment, costPerLead, currentAdvertisingCostPerWin,
    marketingCostPerPresentation, investmentPercentage, breakEvenAdditionalDeals,
    breakEvenCloseRateLift, futureWins, incrementalWins, incrementalRevenue,
    futureAdvertisingCostPerWin, acquisitionCostImprovement, returnMultiple, riskStatus,
    marketingProjection, grossYear1, grossYear2, grossTotal, costYear1, costYear2, totalCost,
    netYear1, netYear2, netTotal, roiPercentage, netPresentValue, paybackMonths,
  }
}

export const formatCurrency = (value: number | null, maximumFractionDigits = 0): string =>
  value === null || !Number.isFinite(value) ? 'Not available' : new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD', maximumFractionDigits,
  }).format(value)

export const formatNumber = (value: number | null, maximumFractionDigits = 0): string =>
  value === null || !Number.isFinite(value) ? 'Not available' : new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value)

export const formatPercent = (value: number | null, maximumFractionDigits = 2): string =>
  value === null || !Number.isFinite(value) ? 'Not available' : `${new Intl.NumberFormat('en-US', { maximumFractionDigits }).format(value)}%`
