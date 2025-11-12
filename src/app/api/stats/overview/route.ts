import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { convert } from '@/lib/exchangeRates'
import { TransactionType, Currency } from '@/types/prisma'
import { format, startOfDay, endOfDay, eachDayOfInterval } from 'date-fns'

// GET /api/stats/overview?from=YYYY-MM-DD&to=YYYY-MM-DD&baseCurrency=USD
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')
    const baseCurrencyParam = searchParams.get('baseCurrency') || 'USD'

    const baseCurrency = baseCurrencyParam as Currency

    // Определяем период (по умолчанию последние 30 дней)
    const to = toParam ? new Date(toParam) : new Date()
    const from = fromParam
      ? new Date(fromParam)
      : new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

    const fromStart = startOfDay(from)
    const toEnd = endOfDay(to)

    // Получаем все транзакции за период
    const transactions = await prisma.transaction.findMany({
      where: {
        date: {
          gte: fromStart,
          lte: toEnd,
        },
      },
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: 'asc' },
    })

    // Получаем все счета для расчета общего баланса
    const allAccounts = await prisma.account.findMany()
    const allTransactions = await prisma.transaction.findMany({
      include: { account: true },
    })

    // Вычисляем общий баланс (текущий, не за период)
    let totalBalance = 0
    for (const account of allAccounts) {
      const accountTransactions = allTransactions.filter((t) => t.accountId === account.id)
      const accountBalance = accountTransactions.reduce((sum, t) => {
        if (t.type === 'INCOME') {
          return sum + t.amount
        } else {
          return sum - t.amount
        }
      }, 0)

      // Конвертируем в базовую валюту
      const convertedBalance = await convert(accountBalance, account.currency, baseCurrency)
      totalBalance += convertedBalance
    }

    // Группируем транзакции по дням
    const days = eachDayOfInterval({ start: fromStart, end: toEnd })
    const expensesByDay: Record<string, number> = {}
    const incomeByDay: Record<string, number> = {}
    const balanceByDay: Record<string, number> = {}

    // Инициализируем все дни нулями
    days.forEach((day) => {
      const dayKey = format(day, 'yyyy-MM-dd')
      expensesByDay[dayKey] = 0
      incomeByDay[dayKey] = 0
      balanceByDay[dayKey] = 0
    })

    // Накапливаем баланс по дням
    let runningBalance = 0
    for (const transaction of transactions) {
      const dayKey = format(transaction.date, 'yyyy-MM-dd')
      const convertedAmount = await convert(
        transaction.amount,
        transaction.currency,
        baseCurrency
      )

      if (transaction.type === 'INCOME') {
        incomeByDay[dayKey] = (incomeByDay[dayKey] || 0) + convertedAmount
        runningBalance += convertedAmount
      } else {
        expensesByDay[dayKey] = (expensesByDay[dayKey] || 0) + convertedAmount
        runningBalance -= convertedAmount
      }

      balanceByDay[dayKey] = runningBalance
    }

    // Расходы по категориям
    const expensesByCategory: Record<string, number> = {}
    const expenseTransactions = transactions.filter((t) => t.type === 'EXPENSE')

    for (const transaction of expenseTransactions) {
      const categoryName = transaction.category.name
      const convertedAmount = await convert(
        transaction.amount,
        transaction.currency,
        baseCurrency
      )
      expensesByCategory[categoryName] =
        (expensesByCategory[categoryName] || 0) + convertedAmount
    }

    // Форматируем данные для графиков
    const expensesChart = Object.entries(expensesByDay).map(([date, value]) => ({
      date,
      value: value / 100, // конвертируем обратно в основные единицы
    }))

    const incomeChart = Object.entries(incomeByDay).map(([date, value]) => ({
      date,
      value: value / 100,
    }))

    const balanceChart = Object.entries(balanceByDay).map(([date, value]) => ({
      date,
      value: value / 100,
    }))

    const expensesByCategoryChart = Object.entries(expensesByCategory).map(([name, value]) => ({
      name,
      value: value / 100,
    }))

    return NextResponse.json({
      totalBalance: totalBalance / 100,
      expensesByDay: expensesChart,
      incomeByDay: incomeChart,
      balanceByDay: balanceChart,
      expensesByCategory: expensesByCategoryChart,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}

