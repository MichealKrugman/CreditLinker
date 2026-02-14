import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create test user
  const hashedPassword = await bcrypt.hash('password123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@pharmacy.com' },
    update: {},
    create: {
      email: 'test@pharmacy.com',
      password: hashedPassword,
      name: 'Test Pharmacy Owner',
    },
  })

  console.log('✅ Created test user:', user.email)

  // Create test business
  const business = await prisma.business.upsert({
    where: { id: 'test-business-id' },
    update: {},
    create: {
      id: 'test-business-id',
      userId: user.id,
      name: 'Green Valley Pharmacy',
      type: 'PHARMACY',
      phone: '+234 801 234 5678',
      address: '123 Main Street, Lagos, Nigeria',
    },
  })

  console.log('✅ Created test business:', business.name)

  // Create test import
  const importRecord = await prisma.import.create({
    data: {
      businessId: business.id,
      fileName: 'sample-transactions.csv',
      fileSize: 52428,
      filePath: '/uploads/sample-transactions.csv',
      status: 'COMPLETED',
      totalTransactions: 50,
      processedTransactions: 50,
      uploadedAt: new Date('2024-01-15'),
      processedAt: new Date('2024-01-15'),
    },
  })

  console.log('✅ Created test import:', importRecord.fileName)

  // Create sample transactions for January 2024
  const transactions = [
    // INCOME - Pharmacy Sales
    { date: new Date('2024-01-05'), description: 'PHARMACY SALES', amount: 450000, type: 'CREDIT', category: 'INCOME' },
    { date: new Date('2024-01-10'), description: 'PHARMACY SALES', amount: 380000, type: 'CREDIT', category: 'INCOME' },
    { date: new Date('2024-01-15'), description: 'PHARMACY SALES', amount: 520000, type: 'CREDIT', category: 'INCOME' },
    { date: new Date('2024-01-20'), description: 'PHARMACY SALES', amount: 475000, type: 'CREDIT', category: 'INCOME' },
    { date: new Date('2024-01-25'), description: 'PHARMACY SALES', amount: 510000, type: 'CREDIT', category: 'INCOME' },
    
    // INVENTORY PURCHASES
    { date: new Date('2024-01-03'), description: 'MEDIPHARM DISTRIBUTORS', amount: 850000, type: 'DEBIT', category: 'EXPENSE_INVENTORY' },
    { date: new Date('2024-01-12'), description: 'HEALTHCARE SUPPLIES LTD', amount: 320000, type: 'DEBIT', category: 'EXPENSE_INVENTORY' },
    { date: new Date('2024-01-22'), description: 'MEDIPHARM DISTRIBUTORS', amount: 920000, type: 'DEBIT', category: 'EXPENSE_INVENTORY' },
    
    // OPERATIONAL EXPENSES
    { date: new Date('2024-01-02'), description: 'RENT PAYMENT', amount: 150000, type: 'DEBIT', category: 'EXPENSE_OPERATIONAL' },
    { date: new Date('2024-01-08'), description: 'OFFICE SUPPLIES', amount: 35000, type: 'DEBIT', category: 'EXPENSE_OPERATIONAL' },
    
    // SALARIES
    { date: new Date('2024-01-30'), description: 'STAFF SALARY - JANUARY', amount: 280000, type: 'DEBIT', category: 'EXPENSE_SALARY' },
    
    // UTILITIES
    { date: new Date('2024-01-07'), description: 'ELECTRICITY BILL', amount: 45000, type: 'DEBIT', category: 'EXPENSE_UTILITIES' },
    { date: new Date('2024-01-14'), description: 'WATER BILL', amount: 8500, type: 'DEBIT', category: 'EXPENSE_UTILITIES' },
    
    // BANK FEES
    { date: new Date('2024-01-31'), description: 'BANK CHARGES', amount: 2500, type: 'DEBIT', category: 'FEE' },
  ]

  for (const tx of transactions) {
    await prisma.transaction.create({
      data: {
        importId: importRecord.id,
        date: tx.date,
        description: tx.description,
        amount: tx.amount,
        type: tx.type as any,
        category: tx.category as any,
      },
    })
  }

  console.log(`✅ Created ${transactions.length} sample transactions`)

  // Calculate and create metrics for January 2024
  const totalRevenue = transactions
    .filter(t => t.type === 'CREDIT')
    .reduce((sum, t) => sum + t.amount, 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + t.amount, 0)

  const netCashflow = totalRevenue - totalExpenses

  const metrics = await prisma.calculatedMetrics.create({
    data: {
      businessId: business.id,
      month: new Date('2024-01-01'),
      totalRevenue,
      totalExpenses,
      netCashflow,
      averageBalance: netCashflow / 30,
      revenueGrowth: null, // No previous month
      expenseVolatility: 12.5,
      numberOfTransactions: transactions.length,
    },
  })

  console.log('✅ Created calculated metrics for January 2024')

  // Create identity score for January 2024
  const score = await prisma.identityScore.create({
    data: {
      businessId: business.id,
      month: new Date('2024-01-01'),
      totalScore: 78.5,
      positivityScore: 85.0, // Strong positive cashflow
      stabilityScore: 72.0,  // Moderate stability
      growthScore: 0.0,      // No previous data
      expenseControlScore: 82.0, // Good expense management
      bufferScore: 88.0,     // Strong cash buffer
    },
  })

  console.log('✅ Created identity score for January 2024:', score.totalScore)

  console.log('🎉 Seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
