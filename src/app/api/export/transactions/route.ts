import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/export/transactions?from=YYYY-MM-DD&to=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

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

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
      orderBy: { date: 'desc' },
    })

    // Формируем CSV
    const headers = ['id', 'type', 'accountName', 'toAccountName', 'categoryName', 'amount', 'currency', 'toAmount', 'toCurrency', 'date', 'note']
    const rows = transactions.map((t) => [
      t.id,
      t.type,
      t.account.name,
      t.toAccount?.name || '',
      t.category?.name || '',
      (t.amount / 100).toFixed(2), // конвертируем в основные единицы
      t.currency,
      t.toAmount !== null ? (t.toAmount / 100).toFixed(2) : '',
      t.toCurrency || '',
      t.date.toISOString(),
      t.note || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="transactions-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting transactions:', error)
    return NextResponse.json({ error: 'Failed to export transactions' }, { status: 500 })
  }
}

