import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/categories/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, type, color, icon } = body

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(type && { type }),
        ...(color && { color }),
        ...(icon && { icon }),
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE /api/categories/:id
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Получаем категорию, которую удаляем
    const categoryToDelete = await prisma.category.findUnique({
      where: { id },
    })

    if (!categoryToDelete) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    }

    // Находим категорию "Другое" того же типа
    const otherCategory = await prisma.category.findUnique({
      where: {
        name_type: {
          name: 'Другое',
          type: categoryToDelete.type,
        },
      },
    })

    if (!otherCategory) {
      return NextResponse.json(
        { error: 'Category "Другое" not found. Cannot delete category.' },
        { status: 400 }
      )
    }

    // Переносим все транзакции на категорию "Другое"
    const transactionCount = await prisma.transaction.count({
      where: { categoryId: id },
    })

    if (transactionCount > 0) {
      await prisma.transaction.updateMany({
        where: { categoryId: id },
        data: { categoryId: otherCategory.id },
      })
    }

    // Удаляем категорию
    await prisma.category.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: `Category deleted. ${transactionCount} transaction(s) moved to "Другое".`,
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}

