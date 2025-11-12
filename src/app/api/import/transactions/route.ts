import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/import/transactions
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const text = await file.text()
    const lines = text.split('\n').filter((line) => line.trim())

    if (lines.length < 2) {
      return NextResponse.json({ error: 'Invalid CSV format' }, { status: 400 })
    }

    // Парсим заголовки
    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    const expectedHeaders = ['id', 'type', 'accountName', 'categoryName', 'amount', 'currency', 'date', 'note']

    // Проверяем заголовки (не строго, но хотя бы основные поля должны быть)
    if (!headers.includes('type') || !headers.includes('accountName') || !headers.includes('categoryName')) {
      return NextResponse.json({ error: 'Invalid CSV headers' }, { status: 400 })
    }

    const results = {
      created: 0,
      errors: [] as string[],
    }

    // Парсим строки (пропускаем заголовок)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (!line.trim()) continue

      try {
        // Простой парсинг CSV (не обрабатывает запятые внутри кавычек идеально, но для базового случая достаточно)
        const values = line.split(',').map((v) => v.trim().replace(/^"|"$/g, ''))

        const row: Record<string, string> = {}
        headers.forEach((header, index) => {
          row[header] = values[index] || ''
        })

        const { type, accountName, categoryName, amount, currency, date, note } = row

        if (!type || !accountName || !categoryName || !amount || !currency || !date) {
          results.errors.push(`Row ${i + 1}: Missing required fields`)
          continue
        }

        // Находим или создаем счет
        let account = await prisma.account.findFirst({
          where: { name: accountName },
        })

        if (!account) {
          // Создаем новый счет с дефолтными значениями
          account = await prisma.account.create({
            data: {
              name: accountName,
              currency: (currency as any) || 'USD',
              color: '#4F46E5',
              icon: 'wallet',
            },
          })
        }

        // Находим или создаем категорию
        let category = await prisma.category.findFirst({
          where: {
            name: categoryName,
            type: type as 'INCOME' | 'EXPENSE',
          },
        })

        if (!category) {
          category = await prisma.category.create({
            data: {
              name: categoryName,
              type: type as 'INCOME' | 'EXPENSE',
              color: '#6B7280',
              icon: 'tag',
            },
          })
        }

        // Создаем транзакцию
        const amountInMinorUnits = Math.round(parseFloat(amount) * 100)

        await prisma.transaction.create({
          data: {
            type: type as 'INCOME' | 'EXPENSE',
            accountId: account.id,
            categoryId: category.id,
            amount: amountInMinorUnits,
            currency: currency as any,
            date: new Date(date),
            note: note || null,
          },
        })

        results.created++
      } catch (error) {
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      created: results.created,
      errors: results.errors,
    })
  } catch (error) {
    console.error('Error importing transactions:', error)
    return NextResponse.json({ error: 'Failed to import transactions' }, { status: 500 })
  }
}

