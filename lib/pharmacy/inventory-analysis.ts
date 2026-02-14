import { prisma } from '@/lib/database/prisma';
import { TransactionCategory } from '@prisma/client';
import { format, differenceInDays } from 'date-fns';

export interface InventoryPurchase {
  date: Date;
  supplier: string;
  amount: number;
  description: string;
}

export interface SupplierAnalysis {
  name: string;
  totalSpent: number;
  transactionCount: number;
  averagePurchaseAmount: number;
  percentage: number; // % of total inventory spend
  frequency: number; // Average days between orders
}

export interface RestockingPattern {
  averageFrequency: number; // Days between restocks
  consistency: 'regular' | 'irregular';
  lastRestockDate: Date;
  daysSinceLastRestock: number;
  estimatedNextRestock: Date;
}

export interface InventoryMetrics {
  totalInventorySpend: number;
  monthlyAverageSpend: number;
  topSuppliers: SupplierAnalysis[];
  restockingPattern: RestockingPattern;
  inventoryTurnoverEstimate: number; // Times per year
  inventoryAsPercentageOfRevenue: number;
}

/**
 * Known pharmaceutical wholesalers and suppliers
 */
const KNOWN_SUPPLIERS = [
  'mckesson',
  'amerisourcebergen',
  'cardinal health',
  'morris & dickson',
  'abbvie',
  'pfizer',
  'johnson',
  'merck',
  'novartis',
  'roche',
  'sanofi',
  'gsk',
  'gilead',
  'amgen',
  'bristol',
  'lilly',
  'pharmaceutical',
  'pharma',
  'wholesaler',
];

/**
 * Detect and analyze inventory purchases for a pharmacy
 */
export async function analyzeInventory(
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<InventoryMetrics> {
  // Get all inventory transactions
  const inventoryTransactions = await prisma.transaction.findMany({
    where: {
      import: {
        businessId,
      },
      type: 'DEBIT',
      category: 'EXPENSE_INVENTORY',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      date: true,
      description: true,
      amount: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  if (inventoryTransactions.length === 0) {
    return {
      totalInventorySpend: 0,
      monthlyAverageSpend: 0,
      topSuppliers: [],
      restockingPattern: {
        averageFrequency: 0,
        consistency: 'irregular',
        lastRestockDate: new Date(),
        daysSinceLastRestock: 0,
        estimatedNextRestock: new Date(),
      },
      inventoryTurnoverEstimate: 0,
      inventoryAsPercentageOfRevenue: 0,
    };
  }

  // Identify purchases and suppliers
  const purchases = detectInventoryPurchases(inventoryTransactions);

  // Calculate total spend
  const totalInventorySpend = inventoryTransactions.reduce(
    (sum, t) => sum + t.amount,
    0
  );

  // Calculate monthly average
  const monthsSpan = getMonthsSpan(
    inventoryTransactions[0].date,
    inventoryTransactions[inventoryTransactions.length - 1].date
  );
  const monthlyAverageSpend = monthsSpan > 0 ? totalInventorySpend / monthsSpan : 0;

  // Analyze suppliers
  const topSuppliers = analyzeSuppliers(purchases, totalInventorySpend);

  // Analyze restocking pattern
  const restockingPattern = analyzeRestockingPattern(purchases);

  // Estimate inventory turnover
  const inventoryTurnoverEstimate = estimateInventoryTurnover(
    monthlyAverageSpend,
    restockingPattern.averageFrequency
  );

  // Get revenue for percentage calculation
  const revenueResult = await prisma.transaction.aggregate({
    where: {
      businessId,
      type: 'CREDIT',
      category: 'INCOME',
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    _sum: {
      amount: true,
    },
  });

  const totalRevenue = revenueResult._sum.amount || 0;
  const inventoryAsPercentageOfRevenue =
    totalRevenue > 0 ? (totalInventorySpend / totalRevenue) * 100 : 0;

  return {
    totalInventorySpend,
    monthlyAverageSpend,
    topSuppliers,
    restockingPattern,
    inventoryTurnoverEstimate,
    inventoryAsPercentageOfRevenue,
  };
}

/**
 * Detect inventory purchases and identify suppliers
 */
export function detectInventoryPurchases(
  transactions: Array<{ date: Date; description: string; amount: number }>
): InventoryPurchase[] {
  return transactions.map((t) => ({
    date: t.date,
    supplier: identifySupplier(t.description),
    amount: t.amount,
    description: t.description,
  }));
}

/**
 * Identify supplier from transaction description
 */
function identifySupplier(description: string): string {
  const lowerDesc = description.toLowerCase();

  // Check for known suppliers
  for (const supplier of KNOWN_SUPPLIERS) {
    if (lowerDesc.includes(supplier)) {
      return supplier.charAt(0).toUpperCase() + supplier.slice(1);
    }
  }

  // Extract company name (first few words)
  const words = description.trim().split(/\s+/);
  return words.slice(0, 2).join(' ');
}

/**
 * Analyze suppliers and rank by spend
 */
function analyzeSuppliers(
  purchases: InventoryPurchase[],
  totalSpend: number
): SupplierAnalysis[] {
  const supplierMap = new Map<
    string,
    { totalSpent: number; count: number; dates: Date[] }
  >();

  for (const purchase of purchases) {
    if (!supplierMap.has(purchase.supplier)) {
      supplierMap.set(purchase.supplier, {
        totalSpent: 0,
        count: 0,
        dates: [],
      });
    }

    const data = supplierMap.get(purchase.supplier)!;
    data.totalSpent += purchase.amount;
    data.count += 1;
    data.dates.push(purchase.date);
  }

  // Convert to array and calculate metrics
  const suppliers: SupplierAnalysis[] = Array.from(supplierMap.entries()).map(
    ([name, data]) => {
      // Calculate average frequency between orders
      const sortedDates = data.dates.sort((a, b) => a.getTime() - b.getTime());
      let totalDaysBetween = 0;
      for (let i = 1; i < sortedDates.length; i++) {
        totalDaysBetween += differenceInDays(sortedDates[i], sortedDates[i - 1]);
      }
      const frequency =
        sortedDates.length > 1 ? totalDaysBetween / (sortedDates.length - 1) : 0;

      return {
        name,
        totalSpent: data.totalSpent,
        transactionCount: data.count,
        averagePurchaseAmount: data.totalSpent / data.count,
        percentage: totalSpend > 0 ? (data.totalSpent / totalSpend) * 100 : 0,
        frequency: Math.round(frequency),
      };
    }
  );

  // Sort by total spent descending
  return suppliers.sort((a, b) => b.totalSpent - a.totalSpent);
}

/**
 * Analyze restocking patterns and predict next restock
 */
export function analyzeRestockingPattern(
  purchases: InventoryPurchase[]
): RestockingPattern {
  if (purchases.length < 2) {
    return {
      averageFrequency: 0,
      consistency: 'irregular',
      lastRestockDate: purchases[0]?.date || new Date(),
      daysSinceLastRestock: 0,
      estimatedNextRestock: new Date(),
    };
  }

  // Sort by date
  const sortedPurchases = [...purchases].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Calculate days between purchases
  const daysBetween: number[] = [];
  for (let i = 1; i < sortedPurchases.length; i++) {
    const days = differenceInDays(
      sortedPurchases[i].date,
      sortedPurchases[i - 1].date
    );
    daysBetween.push(days);
  }

  // Average frequency
  const averageFrequency = Math.round(
    daysBetween.reduce((sum, days) => sum + days, 0) / daysBetween.length
  );

  // Calculate consistency (coefficient of variation)
  const mean = averageFrequency;
  const variance =
    daysBetween.reduce((sum, days) => sum + Math.pow(days - mean, 2), 0) /
    daysBetween.length;
  const stdDev = Math.sqrt(variance);
  const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

  const consistency: 'regular' | 'irregular' = cv < 30 ? 'regular' : 'irregular';

  // Last restock info
  const lastRestockDate = sortedPurchases[sortedPurchases.length - 1].date;
  const daysSinceLastRestock = differenceInDays(new Date(), lastRestockDate);

  // Estimate next restock
  const estimatedNextRestock = new Date(lastRestockDate);
  estimatedNextRestock.setDate(estimatedNextRestock.getDate() + averageFrequency);

  return {
    averageFrequency,
    consistency,
    lastRestockDate,
    daysSinceLastRestock,
    estimatedNextRestock,
  };
}

/**
 * Estimate inventory turnover based on purchase frequency
 * Higher turnover = better inventory management
 */
function estimateInventoryTurnover(
  monthlySpend: number,
  restockFrequency: number
): number {
  if (restockFrequency === 0) {
    return 0;
  }

  // Rough estimate: 365 days / average restock frequency
  const turnovers = 365 / restockFrequency;

  return Math.round(turnovers * 10) / 10; // Round to 1 decimal
}

/**
 * Get months span between two dates
 */
function getMonthsSpan(startDate: Date, endDate: Date): number {
  const monthDiff =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth() - startDate.getMonth());

  return Math.max(1, monthDiff);
}

/**
 * Identify top-selling inventory items (if descriptions contain product info)
 */
export function identifyTopInventoryItems(
  purchases: InventoryPurchase[],
  limit: number = 10
): Array<{ item: string; count: number; totalSpent: number }> {
  const itemMap = new Map<string, { count: number; totalSpent: number }>();

  for (const purchase of purchases) {
    // Extract potential product names from description
    const items = extractProductNames(purchase.description);

    for (const item of items) {
      if (!itemMap.has(item)) {
        itemMap.set(item, { count: 0, totalSpent: 0 });
      }
      const data = itemMap.get(item)!;
      data.count += 1;
      data.totalSpent += purchase.amount;
    }
  }

  return Array.from(itemMap.entries())
    .map(([item, data]) => ({
      item,
      count: data.count,
      totalSpent: data.totalSpent,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit);
}

/**
 * Extract product names from description
 * This is a simple heuristic - can be improved with ML
 */
function extractProductNames(description: string): string[] {
  // Remove common prefixes and get meaningful words
  const cleaned = description
    .toLowerCase()
    .replace(/^(purchase|order|inv|invoice)[\s:]+/i, '')
    .trim();

  // Split by common separators
  const items = cleaned.split(/[,;|]/);

  return items.filter((item) => item.length > 2).map((item) => item.trim());
}
