'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, Title, Text, Button, Select, SelectItem } from '@tremor/react'
import { Currency } from '@/types/prisma'

export default function SettingsPage() {
  const router = useRouter()
  const [baseCurrency, setBaseCurrency] = useState<Currency>('USD')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      setBaseCurrency(data.baseCurrency)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBaseCurrency = async (currency: Currency) => {
    try {
      await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ baseCurrency: currency }),
      })
      setBaseCurrency(currency)
    } catch (error) {
      alert('Ошибка при обновлении настроек')
    }
  }

  const handleExport = async () => {
    try {
      const from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const to = new Date().toISOString().split('T')[0]
      const res = await fetch(`/api/export/transactions?from=${from}&to=${to}`)
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Ошибка при экспорте')
    }
  }

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/import/transactions', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (res.ok) {
        alert(`Импортировано транзакций: ${data.created}\nОшибок: ${data.errors.length}`)
        if (data.errors.length > 0) {
          console.error('Import errors:', data.errors)
        }
        router.refresh()
      } else {
        alert(data.error || 'Ошибка при импорте')
      }
    } catch (error) {
      alert('Ошибка при импорте')
    } finally {
      e.target.value = ''
    }
  }

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' })
    router.push('/login')
  }

  const currencies: Currency[] = ['USD', 'EUR', 'RUB', 'RSD', 'VND']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Text>Загрузка...</Text>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Title>Настройки</Title>

      {/* Базовая валюта */}
      <Card>
        <Title className="mb-4">Базовая валюта</Title>
        <Select
          value={baseCurrency}
          onValueChange={(value) => updateBaseCurrency(value as Currency)}
        >
          {currencies.map((curr) => (
            <SelectItem key={curr} value={curr}>
              {curr}
            </SelectItem>
          ))}
        </Select>
        <Text className="mt-2 text-sm text-gray-500">
          Валюта для отображения общего баланса и графиков
        </Text>
      </Card>

      {/* Управление категориями */}
      <Card>
        <Title className="mb-4">Категории</Title>
        <Link href="/app/categories">
          <Button color="blue" variant="secondary" className="w-full">
            Управление категориями
          </Button>
        </Link>
        <Text className="mt-2 text-sm text-gray-500">
          Создавайте и удаляйте категории для расходов и доходов
        </Text>
      </Card>

      {/* Импорт/Экспорт */}
      <Card>
        <Title className="mb-4">Импорт / Экспорт</Title>
        <div className="space-y-4">
          <div>
            <Button onClick={handleExport} color="blue" className="w-full">
              Экспорт транзакций (CSV)
            </Button>
            <Text className="mt-2 text-sm text-gray-500">
              Скачать все транзакции за последний год в формате CSV
            </Text>
          </div>
          <div>
            <label className="block">
              <input
                type="file"
                accept=".csv"
                onChange={handleImport}
                className="hidden"
                id="import-file"
              />
              <Button
                onClick={() => document.getElementById('import-file')?.click()}
                color="gray"
                variant="secondary"
                className="w-full"
              >
                Импорт транзакций (CSV)
              </Button>
            </label>
            <Text className="mt-2 text-sm text-gray-500">
              Загрузить транзакции из CSV файла. Если счёт или категория не найдены, они будут
              созданы автоматически.
            </Text>
          </div>
        </div>
      </Card>

      {/* Выход */}
      <Card>
        <Button onClick={handleLogout} color="red" variant="secondary" className="w-full">
          Выйти
        </Button>
      </Card>
    </div>
  )
}

