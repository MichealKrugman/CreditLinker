 
Implementation Summary
Purpose: Financial intelligence platform that ingests pharmacy transaction data and generates a Financial Identity Score (0-100). NOT a lending tool.

Folder Structure
Phase 1: Foundation

/api - RESTful API endpoints
/database - Schema definitions (Users, Businesses, Transactions, Imports, CalculatedMetrics, IdentityScores)
/auth - Login, business profile, access control

Phase 2: Input Layer

/upload - File ingestion (CSV/Excel)
/parser - Transaction extraction & normalization
/categorization - Rule-based tagging (Income, Expenses, Transfers, Fees)

Phase 3: Intelligence Layer

/metrics - Revenue, Expenses, Cashflow, Stability calculations
/scoring - Identity Score algorithm (weighted 0-100)

Phase 4: Output Layer

/dashboard - Frontend views
/reports - PDF/CSV export generators

Industry Layer

/pharmacy - Inventory detection, supplier logic, restocking gap analysis


Core Functions
Data Processing:

uploadFile() - Drag-and-drop validation
parseTransactions() - Extract date, description, amount, credit/debit
normalizeData() - Currency formatting, deduplication
categorizeTransaction() - Apply rule-based tags

Intelligence:

calculateRevenue() - Monthly totals, MoM growth, consistency
calculateExpenses() - Category buckets, volatility
calculateCashflow() - Net monthly, average, buffer
generateIdentityScore() - Weighted scoring (Positivity 30%, Stability 20%, Growth 20%, Expense Control 15%, Buffer 15%)

Output:

renderDashboard() - Score summary, trend charts, insights
exportPDF() - Bank-ready cashflow report
exportCSV() - Transaction exports