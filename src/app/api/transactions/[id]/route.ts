import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/transactions/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { type, accountId, categoryId, amount, currency, date, note } = body

    const updateData: any = {}

    if (type) updateData.type = type
    if (accountId) updateData.accountId = accountId
    if (categoryId) updateData.categoryId = categoryId
    if (amount !== undefined) updateData.amount = Math.round(amount * 100)
    if (currency) updateData.currency = currency
    if (date) updateData.date = new Date(date)
    if (note !== undefined) updateData.note = note || null

    const transaction = await prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
        account: true,
        toAccount: true,
        category: true,
      },
    })

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}

// DELETE /api/transactions/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.transaction.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json({ error: 'Failed to delete transaction' }, { status: 500 })
  }
}

