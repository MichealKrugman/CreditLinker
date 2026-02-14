import { TransactionCategory } from '@prisma/client';

export interface CategoryRule {
  category: TransactionCategory;
  keywords: string[];
  patterns?: RegExp[];
  priority: number; // Higher priority = checked first
}

/**
 * Categorization rules for pharmacy transactions
 * Priority: 1 (lowest) to 10 (highest)
 */
export const CATEGORY_RULES: CategoryRule[] = [
  // INCOME - Priority 10 (highest)
  {
    category: 'INCOME',
    keywords: [
      'deposit',
      'credit',
      'payment received',
      'customer payment',
      'sale',
      'revenue',
      'receipt',
      'income',
      'medicare',
      'medicaid',
      'insurance claim',
      'insurance payment',
      'pharmacy sales',
      'prescription sales',
      'otc sales',
      'cash sales',
      'card payment',
      'online payment',
      'settlement',
    ],
    priority: 10,
  },

  // FEES - Priority 9 (bank/card fees are important to identify)
  {
    category: 'FEES',
    keywords: [
      'fee',
      'charge',
      'service charge',
      'bank charge',
      'commission',
      'processing fee',
      'transaction fee',
      'maintenance fee',
      'monthly fee',
      'annual fee',
      'atm fee',
      'overdraft',
      'penalty',
      'card fee',
      'interchange',
    ],
    priority: 9,
  },

  // INVENTORY - Priority 8 (pharmacy-specific)
  {
    category: 'INVENTORY',
    keywords: [
      'pharmaceutical',
      'pharma',
      'wholesaler',
      'supplier',
      'mckesson',
      'amerisourcebergen',
      'cardinal health',
      'morris & dickson',
      'inventory',
      'stock purchase',
      'drug purchase',
      'medication',
      'generic',
      'brand name',
      'otc products',
      'medical supplies',
      'abbott',
      'pfizer',
      'johnson',
      'merck',
      'novartis',
    ],
    priority: 8,
  },

  // PAYROLL - Priority 7
  {
    category: 'PAYROLL',
    keywords: [
      'salary',
      'wages',
      'payroll',
      'employee',
      'staff payment',
      'adp',
      'gusto',
      'paychex',
      'quickbooks payroll',
    ],
    priority: 7,
  },

  // RENT - Priority 6
  {
    category: 'RENT',
    keywords: [
      'rent',
      'lease',
      'lease payment',
      'property',
      'landlord',
      'real estate',
    ],
    priority: 6,
  },

  // UTILITIES - Priority 5
  {
    category: 'UTILITIES',
    keywords: [
      'electricity',
      'electric',
      'power',
      'gas',
      'water',
      'internet',
      'phone',
      'telephone',
      'utility',
      'utilities',
      'energy',
      'comcast',
      'at&t',
      'verizon',
    ],
    priority: 5,
  },

  // INSURANCE - Priority 4
  {
    category: 'INSURANCE',
    keywords: [
      'insurance',
      'liability',
      'property insurance',
      'professional liability',
      'workers comp',
      'health insurance',
      'business insurance',
    ],
    priority: 4,
  },

  // MARKETING - Priority 3
  {
    category: 'MARKETING',
    keywords: [
      'advertising',
      'marketing',
      'promotion',
      'google ads',
      'facebook ads',
      'social media',
      'flyer',
      'brochure',
      'website',
      'seo',
    ],
    priority: 3,
  },

  // TRANSFER - Priority 2
  {
    category: 'TRANSFER',
    keywords: [
      'transfer',
      'wire',
      'internal transfer',
      'account transfer',
      'interac',
      'e-transfer',
    ],
    priority: 2,
  },

  // OTHER_EXPENSE - Priority 1 (catch-all)
  {
    category: 'OTHER_EXPENSE',
    keywords: [
      'expense',
      'purchase',
      'payment',
      'supplies',
      'office',
      'equipment',
      'maintenance',
      'repair',
      'license',
      'permit',
      'subscription',
      'software',
      'pos',
      'point of sale',
    ],
    priority: 1,
  },
];

/**
 * Get rules sorted by priority (highest first)
 */
export function getRulesByPriority(): CategoryRule[] {
  return [...CATEGORY_RULES].sort((a, b) => b.priority - a.priority);
}

/**
 * Get all keywords for a specific category
 */
export function getKeywordsForCategory(
  category: TransactionCategory
): string[] {
  const rule = CATEGORY_RULES.find((r) => r.category === category);
  return rule?.keywords || [];
}
