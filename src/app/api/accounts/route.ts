import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType } from '@/types/prisma'

// GET /api/accounts - список счетов с балансом
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // Вычисляем баланс для каждого счета
    const accountsWithBalance = await Promise.all(
      accounts.map(async (account) => {
        try {
          // Получаем все транзакции где этот счет является основным (fromAccount для конвертаций)
          const fromTransactions = await prisma.transaction.findMany({
            where: { accountId: account.id },
          })

          // Получаем все транзакции где этот счет является получателем (toAccount для конвертаций)
          const toTransactions = await prisma.transaction.findMany({
            where: { toAccountId: account.id },
          })

          let balance = 0

          // Обрабатываем транзакции где счет является основным
          for (const t of fromTransactions) {
            if (t.type === 'INCOME') {
              balance += t.amount
            } else if (t.type === 'EXPENSE') {
              balance -= t.amount
            } else if (t.type === 'CONVERSION' && t.toAmount !== null) {
              // Для конвертации вычитаем сумму откуда
              balance -= t.amount
            }
          }

          // Обрабатываем транзакции где счет является получателем (только конвертации)
          for (const t of toTransactions) {
            if (t.type === 'CONVERSION' && t.toAmount !== null) {
              // Для конвертации добавляем сумму куда
              balance += t.toAmount
            }
          }

          return {
            ...account,
            balance,
          }
        } catch (error) {
          console.error(`Error calculating balance for account ${account.id}:`, error)
          // Возвращаем счет с нулевым балансом при ошибке
          return {
            ...account,
            balance: 0,
          }
        }
      })
    )

    // Всегда возвращаем массив, даже если пустой
    return NextResponse.json(accountsWithBalance || [])
  } catch (error) {
    // Детальное логирование для отладки на Vercel
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('Error fetching accounts:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    })
    // Возвращаем пустой массив вместо объекта ошибки, чтобы клиент не падал
    return NextResponse.json([], { status: 500 })
  }
}

// POST /api/accounts - создать счёт
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, currency, color, icon } = body

    if (!name || !currency) {
      return NextResponse.json({ error: 'Name and currency are required' }, { status: 400 })
    }

    const account = await prisma.account.create({
      data: {
        name,
        currency,
        color: color || '#4F46E5',
        icon: icon || 'wallet',
      },
    })

    return NextResponse.json({ ...account, balance: 0 })
  } catch (error) {
    console.error('Error creating account:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}

