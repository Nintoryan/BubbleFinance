'use client'

import { useEffect, useState } from 'react'
import { Card, Title, Text, LineChart, BarChart } from '@tremor/react'
import { formatAmount, formatAmountCompact } from '@/lib/utils'
import { Currency } from '@/types/prisma'

interface Account {
  id: string
  name: string
  currency: Currency
  color: string
  icon: string
  balance: number
}

interface Stats {
  totalBalance: number
  balanceByDay: Array<{ date: string; value: number }>
}

export default function DashboardPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [baseCurrency, setBaseCurrency] = useState<Currency>('USD')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [baseCurrency])

  const loadData = async () => {
    setLoading(true)
    try {
      const [accountsRes, settingsRes] = await Promise.all([
        fetch('/api/accounts'),
        fetch('/api/settings'),
      ])

      const accountsData = await accountsRes.json()
      const settings = await settingsRes.json()

      setAccounts(accountsData)
      setBaseCurrency(settings.baseCurrency)

      // Загружаем статистику за последние 30 дней
      const to = new Date()
      const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000)

      const statsRes = await fetch(
        `/api/stats/overview?from=${from.toISOString().split('T')[0]}&to=${to.toISOString().split('T')[0]}&baseCurrency=${settings.baseCurrency}`
      )
      const statsData = await statsRes.json()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateBaseCurrency = async (currency: Currency) => {
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseCurrency: currency }),
    })
    setBaseCurrency(currency)
    loadData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Text>Загрузка...</Text>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Общий баланс */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <Text className="text-blue-100 mb-2">Общий баланс</Text>
        <div className="flex items-center justify-between">
          <Title className="text-3xl font-bold text-white">
            {stats ? formatAmount(stats.totalBalance * 100, baseCurrency) : '0.00'}
          </Title>
          <select
            value={baseCurrency}
            onChange={(e) => updateBaseCurrency(e.target.value as Currency)}
            className="bg-white/20 text-white border-white/30 rounded-lg px-3 py-1 text-sm outline-none"
          >
            <option value="USD" className="text-gray-900">USD</option>
            <option value="EUR" className="text-gray-900">EUR</option>
            <option value="RUB" className="text-gray-900">RUB</option>
            <option value="RSD" className="text-gray-900">RSD</option>
            <option value="VND" className="text-gray-900">VND</option>
          </select>
        </div>
      </Card>

      {/* График баланса */}
      {stats && stats.balanceByDay.length > 0 && (
        <Card className="overflow-visible">
          <Title>Баланс за 30 дней</Title>
          <div className="overflow-visible -mx-2 px-2">
            <BarChart
              data={stats.balanceByDay}
              index="date"
              categories={['value']}
              colors={['#2F71F0']}
              valueFormatter={(value: number) => formatAmountCompact(value * 100, baseCurrency)}
              showLegend={false}
              className="h-48 mt-4"
            />
          </div>
        </Card>
      )}

      {/* Список счетов */}
      <div>
        <Title className="mb-4">Счета</Title>
        <div className="space-y-3">
          {accounts.map((account) => (
            <Card key={account.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg"
                    style={{ backgroundColor: account.color }}
                  >
                    {account.icon === 'wallet' && '💼'}
                    {account.icon === 'card' && '💳'}
                    {account.icon === 'cash' && '💵'}
                    {!['wallet', 'card', 'cash'].includes(account.icon) && '💰'}
                  </div>
                  <div>
                    <Text className="font-medium">{account.name}</Text>
                    <Text className="text-sm text-gray-500">{account.currency}</Text>
                  </div>
                </div>
                <Text className="font-semibold">
                  {formatAmount(account.balance, account.currency)}
                </Text>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

