// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface Business {
  id: string
  userId: string
  name: string
  type: string
  phone: string | null
  address: string | null
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// TRANSACTION & IMPORT TYPES
// ============================================================================

export type TransactionType = 'CREDIT' | 'DEBIT'

export type TransactionCategory = 
  | 'INCOME'
  | 'EXPENSE_INVENTORY'
  | 'EXPENSE_OPERATIONAL'
  | 'EXPENSE_SALARY'
  | 'EXPENSE_UTILITIES'
  | 'EXPENSE_OTHER'
  | 'TRANSFER'
  | 'FEE'
  | 'UNCATEGORIZED'

export type ImportStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'

export interface Transaction {
  id: string
  importId: string
  date: Date
  description: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  createdAt: Date
}

export interface Import {
  id: string
  businessId: string
  fileName: string
  fileSize: number
  filePath: string
  status: ImportStatus
  totalTransactions: number
  processedTransactions: number
  errorMessage: string | null
  uploadedAt: Date
  processedAt: Date | null
}

// ============================================================================
// METRICS & SCORING TYPES
// ============================================================================

export interface CalculatedMetrics {
  id: string
  businessId: string
  month: Date
  totalRevenue: number
  totalExpenses: number
  netCashflow: number
  averageBalance: number
  revenueGrowth: number | null
  expenseVolatility: number
  numberOfTransactions: number
  createdAt: Date
}

export interface IdentityScore {
  id: string
  businessId: string
  month: Date
  totalScore: number
  positivityScore: number // 30% weight
  stabilityScore: number  // 20% weight
  growthScore: number     // 20% weight
  expenseControlScore: number // 15% weight
  bufferScore: number     // 15% weight
  createdAt: Date
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: T[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// ============================================================================
// FILE UPLOAD TYPES
// ============================================================================

export interface UploadedFile {
  name: string
  size: number
  type: string
  path: string
}

export interface ParsedTransaction {
  date: Date
  description: string
  amount: number
  type: TransactionType
  rawData: Record<string, any>
}

// ============================================================================
// DASHBOARD & REPORT TYPES
// ============================================================================

export interface DashboardSummary {
  currentScore: number
  scoreChange: number
  totalRevenue: number
  revenueChange: number
  totalExpenses: number
  expenseChange: number
  netCashflow: number
  cashflowChange: number
  lastUpdated: Date
}

export interface MonthlyTrend {
  month: string
  revenue: number
  expenses: number
  cashflow: number
  score: number
}

export interface CategoryBreakdown {
  category: TransactionCategory
  amount: number
  percentage: number
  transactionCount: number
}

// ============================================================================
// PHARMACY-SPECIFIC TYPES
// ============================================================================

export interface InventoryPurchase {
  date: Date
  supplier: string
  amount: number
  items: string[]
}

export interface SupplierAnalysis {
  supplier: string
  totalPurchases: number
  averageOrderValue: number
  frequency: number
  lastPurchaseDate: Date
}

export interface RestockingPattern {
  product: string
  averageGap: number // days between purchases
  lastRestockDate: Date
  estimatedNextRestock: Date
}
