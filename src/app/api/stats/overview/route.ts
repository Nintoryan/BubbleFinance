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
        toAccount: true,
        category: true,
      },
      orderBy: { date: 'asc' },
    })

    // Получаем все счета для расчета общего баланса
    const allAccounts = await prisma.account.findMany()
    const allTransactions = await prisma.transaction.findMany({
      include: { account: true, toAccount: true },
    })

    // Вычисляем общий баланс (текущий, не за период)
    let totalBalance = 0
    for (const account of allAccounts) {
      // Транзакции где счет является основным (fromAccount)
      const fromTransactions = allTransactions.filter((t) => t.accountId === account.id)
      // Транзакции где счет является получателем (toAccount для конвертаций)
      const toTransactions = allTransactions.filter((t) => t.toAccountId === account.id)

      let accountBalance = 0

      // Обрабатываем транзакции где счет является основным
      for (const t of fromTransactions) {
        if (t.type === 'INCOME') {
          accountBalance += t.amount
        } else if (t.type === 'EXPENSE') {
          accountBalance -= t.amount
        } else if (t.type === 'CONVERSION' && t.toAmount !== null) {
          accountBalance -= t.amount
        }
      }

      // Обрабатываем транзакции где счет является получателем (только конвертации)
      for (const t of toTransactions) {
        if (t.type === 'CONVERSION' && t.toAmount !== null) {
          accountBalance += t.toAmount
        }
      }

      // Конвертируем в базовую валюту
      const convertedBalance = await convert(accountBalance, account.currency as Currency, baseCurrency)
      totalBalance += convertedBalance
    }

    // Вычисляем начальный баланс (баланс всех транзакций ДО начала периода)
    let initialBalance = 0
    const transactionsBeforePeriod = allTransactions.filter((t) => {
      const transactionDate = new Date(t.date)
      return transactionDate < fromStart
    })

    // Группируем транзакции по счетам для правильного расчета баланса
    const accountBalances: Record<string, number> = {}
    
    for (const transaction of transactionsBeforePeriod) {
      // Обрабатываем транзакции где счет является основным
      if (!accountBalances[transaction.accountId]) {
        accountBalances[transaction.accountId] = 0
      }
      
      if (transaction.type === 'INCOME') {
        accountBalances[transaction.accountId] += transaction.amount
      } else if (transaction.type === 'EXPENSE') {
        accountBalances[transaction.accountId] -= transaction.amount
      } else if (transaction.type === 'CONVERSION' && transaction.toAccountId && transaction.toAmount !== null) {
        accountBalances[transaction.accountId] -= transaction.amount
        // Обрабатываем получателя
        if (!accountBalances[transaction.toAccountId]) {
          accountBalances[transaction.toAccountId] = 0
        }
        accountBalances[transaction.toAccountId] += transaction.toAmount
      }
    }

    // Конвертируем балансы всех счетов в базовую валюту
    for (const account of allAccounts) {
      const accountBalance = accountBalances[account.id] || 0
      const convertedBalance = await convert(accountBalance, account.currency as Currency, baseCurrency)
      initialBalance += convertedBalance
    }

    // Группируем транзакции по дням
    const days = eachDayOfInterval({ start: fromStart, end: toEnd })
    const expensesByDay: Record<string, number> = {}
    const incomeByDay: Record<string, number> = {}
    const balanceByDay: Record<string, number> = {}

    // Инициализируем все дни нулями для расходов и доходов
    days.forEach((day) => {
      const dayKey = format(day, 'yyyy-MM-dd')
      expensesByDay[dayKey] = 0
      incomeByDay[dayKey] = 0
    })

    // Предварительно конвертируем все транзакции в базовую валюту
    const convertedTransactions = await Promise.all(
      transactions.map(async (transaction) => {
        const convertedAmount = await convert(
          transaction.amount,
          transaction.currency as Currency,
          baseCurrency
        )
        // Для конвертаций также конвертируем toAmount
        let convertedToAmount: number | null = null
        if (transaction.type === 'CONVERSION' && transaction.toAmount !== null && transaction.toCurrency) {
          convertedToAmount = await convert(
            transaction.toAmount,
            transaction.toCurrency as Currency,
            baseCurrency
          )
        }
        return {
          ...transaction,
          convertedAmount,
          convertedToAmount,
          dayKey: format(transaction.date, 'yyyy-MM-dd'),
        }
      })
    )

    // Группируем транзакции по дням для расчета расходов и доходов
    // ИСКЛЮЧАЕМ конвертации из доходов/расходов
    for (const transaction of convertedTransactions) {
      if (transaction.type === 'INCOME') {
        incomeByDay[transaction.dayKey] = (incomeByDay[transaction.dayKey] || 0) + transaction.convertedAmount
      } else if (transaction.type === 'EXPENSE') {
        expensesByDay[transaction.dayKey] = (expensesByDay[transaction.dayKey] || 0) + transaction.convertedAmount
      }
      // CONVERSION пропускаем - не учитываем в доходах/расходах
    }

    // Группируем транзакции по дням для более эффективной обработки
    const transactionsByDay: Record<string, typeof convertedTransactions> = {}
    for (const transaction of convertedTransactions) {
      if (!transactionsByDay[transaction.dayKey]) {
        transactionsByDay[transaction.dayKey] = []
      }
      transactionsByDay[transaction.dayKey].push(transaction)
    }

    // Вычисляем накопительный баланс для каждого дня
    // Баланс на день = начальный баланс + все транзакции до конца этого дня
    let runningBalance = initialBalance
    for (const day of days) {
      const dayKey = format(day, 'yyyy-MM-dd')
      
      // Применяем все транзакции этого дня
      const dayTransactions = transactionsByDay[dayKey] || []
      for (const transaction of dayTransactions) {
        if (transaction.type === 'INCOME') {
          runningBalance += transaction.convertedAmount
        } else if (transaction.type === 'EXPENSE') {
          runningBalance -= transaction.convertedAmount
        } else if (transaction.type === 'CONVERSION' && transaction.convertedToAmount !== null) {
          // Для конвертации: вычитаем сумму откуда, добавляем сумму куда
          runningBalance -= transaction.convertedAmount
          runningBalance += transaction.convertedToAmount
        }
      }

      // Баланс на конец дня
      balanceByDay[dayKey] = runningBalance
    }

    // Расходы по категориям
    const expensesByCategory: Record<string, number> = {}
    const expenseTransactions = convertedTransactions.filter((t) => t.type === 'EXPENSE' && t.category !== null)

    for (const transaction of expenseTransactions) {
      if (transaction.category) {
        const categoryName = transaction.category.name
        expensesByCategory[categoryName] =
          (expensesByCategory[categoryName] || 0) + transaction.convertedAmount
      }
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

