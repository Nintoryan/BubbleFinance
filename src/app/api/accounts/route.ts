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
          const transactions = await prisma.transaction.findMany({
            where: { accountId: account.id },
          })

          const balance = transactions.reduce((sum, t) => {
            if (t.type === 'INCOME') {
              return sum + t.amount
            } else {
              return sum - t.amount
            }
          }, 0)

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

