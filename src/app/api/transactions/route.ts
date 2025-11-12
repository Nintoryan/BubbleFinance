import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD&type=INCOME|EXPENSE|ALL&accountId=...
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const type = searchParams.get('type')
    const accountId = searchParams.get('accountId')

    const where: any = {}

    if (from || to) {
      where.date = {}
      if (from) {
        where.date.gte = new Date(from)
      }
      if (to) {
        const toDate = new Date(to)
        toDate.setHours(23, 59, 59, 999)
        where.date.lte = toDate
      }
    }

    if (type && type !== 'ALL') {
      where.type = type
    }

    if (accountId) {
      where.accountId = accountId
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
        category: true,
      },
      orderBy: { date: 'desc' },
    })

    return NextResponse.json(transactions)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}

// POST /api/transactions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, accountId, categoryId, amount, currency, date, note } = body

    if (!type || !accountId || !categoryId || amount === undefined || !currency || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Конвертируем amount в минимальные единицы (центы)
    const amountInMinorUnits = Math.round(amount * 100)

    const transaction = await prisma.transaction.create({
      data: {
        type,
        accountId,
        categoryId,
        amount: amountInMinorUnits,
        currency,
        date: new Date(date),
        note: note || null,
      },
      include: {
        account: true,
        category: true,
      },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 })
  }
}

