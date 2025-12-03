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
    const { 
      type, 
      accountId, 
      categoryId, 
      amount, 
      currency, 
      date, 
      note,
      // Поля для конвертации
      toAccountId,
      toAmount,
      toCurrency
    } = body

    const updateData: any = {}

    if (type) updateData.type = type
    if (accountId) updateData.accountId = accountId
    if (categoryId !== undefined) updateData.categoryId = categoryId || null
    if (amount !== undefined) updateData.amount = Math.round(amount * 100)
    if (currency) updateData.currency = currency
    if (date) updateData.date = new Date(date)
    if (note !== undefined) updateData.note = note || null
    
    // Поля для конвертации
    if (toAccountId !== undefined) updateData.toAccountId = toAccountId || null
    if (toAmount !== undefined) updateData.toAmount = toAmount !== null ? Math.round(toAmount * 100) : null
    if (toCurrency !== undefined) updateData.toCurrency = toCurrency || null

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

