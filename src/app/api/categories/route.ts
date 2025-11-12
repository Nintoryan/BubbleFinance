import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories?type=INCOME|EXPENSE
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get('type')

    const where = type ? { type: type as 'INCOME' | 'EXPENSE' } : {}

    const categories = await prisma.category.findMany({
      where,
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST /api/categories - создать категорию
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, color, icon } = body

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 })
    }

    // Проверяем, существует ли уже категория с таким именем и типом
    const existing = await prisma.category.findUnique({
      where: {
        name_type: {
          name: name.trim(),
          type: type as 'INCOME' | 'EXPENSE',
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name and type already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        type,
        color: color || '#6B7280',
        icon: icon || 'tag',
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error creating category:', error)
    // Проверяем, не ошибка ли это уникальности
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Category with this name and type already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

