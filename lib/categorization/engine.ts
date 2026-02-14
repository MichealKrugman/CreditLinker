import { TransactionCategory, TransactionType } from '@prisma/client';
import { getRulesByPriority, CategoryRule } from './rules';

/**
 * Categorize a transaction based on its description and type
 * Uses rule-based matching with priority ordering
 */
export function categorizeTransaction(
  description: string,
  type: TransactionType
): TransactionCategory | null {
  const cleanDesc = description.toLowerCase().trim();
  const rules = getRulesByPriority();

  // Check each rule in priority order
  for (const rule of rules) {
    if (matchesRule(cleanDesc, rule, type)) {
      return rule.category;
    }
  }

  // If no match found, categorize based on transaction type
  return type === 'CREDIT' ? 'INCOME' : 'OTHER_EXPENSE';
}

/**
 * Check if description matches a categorization rule
 */
function matchesRule(
  description: string,
  rule: CategoryRule,
  type: TransactionType
): boolean {
  // Special logic: INCOME category only applies to CREDIT transactions
  if (rule.category === 'INCOME' && type !== 'CREDIT') {
    return false;
  }

  // Special logic: Expense categories only apply to DEBIT transactions
  const expenseCategories: TransactionCategory[] = [
    'INVENTORY',
    'PAYROLL',
    'RENT',
    'UTILITIES',
    'INSURANCE',
    'MARKETING',
    'FEES',
    'OTHER_EXPENSE',
  ];
  if (expenseCategories.includes(rule.category) && type !== 'DEBIT') {
    return false;
  }

  // Check keywords
  for (const keyword of rule.keywords) {
    if (description.includes(keyword.toLowerCase())) {
      return true;
    }
  }

  // Check regex patterns if defined
  if (rule.patterns) {
    for (const pattern of rule.patterns) {
      if (pattern.test(description)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Categorize multiple transactions in batch
 * More efficient than calling categorizeTransaction multiple times
 */
export function categorizeTransactions(
  transactions: Array<{ description: string; type: TransactionType }>
): TransactionCategory[] {
  return transactions.map((t) => categorizeTransaction(t.description, t.type)!);
}

/**
 * Get confidence score for a categorization (0-100)
 * Based on how specific the match was
 */
export function getCategorizationConfidence(
  description: string,
  category: TransactionCategory
): number {
  const cleanDesc = description.toLowerCase().trim();
  const rules = getRulesByPriority();
  const rule = rules.find((r) => r.category === category);

  if (!rule) {
    return 0;
  }

  // Count matching keywords
  let matches = 0;
  for (const keyword of rule.keywords) {
    if (cleanDesc.includes(keyword.toLowerCase())) {
      matches++;
    }
  }

  // Base confidence on number of matches and rule priority
  const keywordConfidence = Math.min((matches / rule.keywords.length) * 100, 80);
  const priorityBonus = (rule.priority / 10) * 20;

  return Math.min(keywordConfidence + priorityBonus, 100);
}

/**
 * Suggest alternative categories for a transaction
 * Useful for manual review
 */
export function suggestCategories(
  description: string,
  type: TransactionType,
  limit: number = 3
): Array<{ category: TransactionCategory; confidence: number }> {
  const cleanDesc = description.toLowerCase().trim();
  const rules = getRulesByPriority();
  const suggestions: Array<{ category: TransactionCategory; confidence: number }> =
    [];

  for (const rule of rules) {
    // Skip incompatible categories
    if (rule.category === 'INCOME' && type !== 'CREDIT') continue;
    if (
      rule.category !== 'INCOME' &&
      rule.category !== 'TRANSFER' &&
      type !== 'DEBIT'
    )
      continue;

    let matchScore = 0;

    // Check keyword matches
    for (const keyword of rule.keywords) {
      if (cleanDesc.includes(keyword.toLowerCase())) {
        matchScore += 10;
      }
    }

    if (matchScore > 0) {
      const confidence = Math.min(matchScore + rule.priority * 5, 100);
      suggestions.push({ category: rule.category, confidence });
    }
  }

  // Sort by confidence and return top N
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, limit);
}
