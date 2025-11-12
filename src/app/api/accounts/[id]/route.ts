import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType } from '@/types/prisma'

// PUT /api/accounts/:id - обновить счёт
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, currency, color, icon } = body

    const account = await prisma.account.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(currency && { currency }),
        ...(color && { color }),
        ...(icon && { icon }),
      },
    })

    // Вычисляем баланс
    const transactions = await prisma.transaction.findMany({
      where: { accountId: id },
    })

    const balance = transactions.reduce((sum, t) => {
      if (t.type === 'INCOME') {
        return sum + t.amount
      } else {
        return sum - t.amount
      }
    }, 0)

    return NextResponse.json({ ...account, balance })
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 })
  }
}

// DELETE /api/accounts/:id - удалить счёт
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Проверяем, есть ли транзакции
    const transactionCount = await prisma.transaction.count({
      where: { accountId: id },
    })

    if (transactionCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete account with existing transactions' },
        { status: 400 }
      )
    }

    await prisma.account.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}

