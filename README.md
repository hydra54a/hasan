# Hasan Consulting Enterprise ROI Calculator

An executive-ready modernization of the Hasan Consulting ROI Shop workflow. It preserves Dashboard, Lead Generation, Conversion – Close Rate Improvement, Discount Reduction, Summary, costs, projections, notes, conservative factors, implementation periods, and ROI statistics. Marketing Investment Optimization is implemented as a new synchronized module rather than a replacement calculator.

## Run locally

```bash
npm install
npm run dev
```

The development server uses `http://127.0.0.1:4173`.

## Architecture

- `src/domain/calculations.ts` contains the pure financial calculation engine.
- `src/domain/types.ts` defines shared inputs, module results, marketing stages, risk, and persisted-state contracts.
- `src/domain/persistence.ts` owns schema-versioned local persistence and URL serialization.
- `src/components/LegacyPages.tsx` contains the preserved dashboard, legacy modules, and summary.
- `src/components/MarketingPage.tsx` contains the six-stage Marketing Investment Optimization workflow.
- `src/components/` also contains the shared shell, controls, KPI, and accessible visualization components.
- `src/App.tsx` composes top-level module routing and shared state.

React owns workflow state and accessible DOM structure. The allocation and revenue visuals use lightweight DOM/CSS marks with direct labels, visible text equivalents, and no hover-only values.

## Data sources and mapping

Defaults mirror the populated reference ROI: 75 monthly leads, 15% close rate, $10,000 average deal value, 12 salespeople, $200,000 sales per representative, 50 additional conversion wins, and a 20% to 10% discount-rate improvement. Annual leads, close rate, and average deal value are shared source values. `presentationVolume` remains independent because the source material does not prove it is equivalent to leads.

## Formulas

- Annual leads = monthly inbound leads × 12
- Current lead wins = annual leads × close rate
- Lead-generation uplift = annual leads × lead increase rate × close rate × deal value
- Expected annual sales = salespeople × annual sales per representative
- Deals needed = expected annual sales / average deal value
- Opportunities worked = deals needed / close rate
- Opportunities lost = opportunities worked − deals needed
- Conversion revenue = additional conversion wins × average deal value
- Discount revenue = projected annual sales × (current discount rate − improved discount rate)
- Year 1 projection = annual opportunity × conservative factor adjustment × active implementation months / 12
- Year 2 projection = annual opportunity × conservative factor adjustment
- Average monthly advertising spend = annual advertising spend / 12
- Reallocation percentage = selected months / 12 × 100
- Reallocation value = annual spend × selected months / 12
- Current wins = annual leads × current close rate
- Current revenue = current wins × average deal value
- Cost per lead = annual spend / annual leads
- Advertising cost per win = annual spend / wins
- Break-even deals = ceiling(system investment / average deal value)
- Break-even close-rate lift = break-even deals / presentation volume × 100
- Incremental revenue = max(0, future wins − current wins) × average deal value

- Net opportunity = gross opportunity − deposit and subscription costs
- ROI = net two-year opportunity / total two-year cost × 100
- NPV discounts Year 1 and Year 2 net opportunity at 2%
- Payback period = total cost / Year 1 gross opportunity × 12 months

Raw values remain separate from `Intl.NumberFormat` display strings. Divisions by zero return `null`, rendered as “Not available.” Currency is displayed to whole dollars, percentages to at most two decimals, and calculations retain full precision.

## Persistence and compatibility

Expanded calculator state is stored under `hasan-roi-calculator:v2` with `schemaVersion: 2`. The loader migrates the earlier `hasan-roi-optimizer:v1` marketing-only schema, including conversion of annual leads back to the shared monthly-lead source. Previous share parameters such as `leads`, `spend`, `closeRate`, and `dealValue` remain accepted. New URLs serialize numeric inputs while notes remain local.

## Verification

```bash
npm test
npm run build
```

Unit coverage protects the populated ROI Shop record, original summary totals, conservative factors, implementation delays, marketing acceptance values, zero-input safety, and risk classification. Integration coverage protects cross-module synchronization, dashboard/summary aggregation, legacy schema migration, and previous share parameters. Browser QA covers every top-level module, live Lead Generation synchronization, the six-stage marketing path, Summary aggregation, presentation controls, and desktop/mobile rendering.
