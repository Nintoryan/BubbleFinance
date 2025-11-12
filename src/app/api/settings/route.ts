import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/settings
export async function GET() {
  try {
    let settings = await prisma.settings.findUnique({
      where: { id: 1 },
    })

    // Если настроек нет, создаем дефолтные
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          id: 1,
          baseCurrency: 'USD',
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { baseCurrency } = body

    if (!baseCurrency) {
      return NextResponse.json({ error: 'baseCurrency is required' }, { status: 400 })
    }

    const settings = await prisma.settings.upsert({
      where: { id: 1 },
      update: { baseCurrency },
      create: {
        id: 1,
        baseCurrency,
      },
    })

    return NextResponse.json(settings)
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

