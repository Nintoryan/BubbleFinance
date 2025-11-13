'use client'

import { useEffect, useState } from 'react'
import { Card, Title, Text } from '@tremor/react'
import { formatAmount } from '@/lib/utils'
import { Currency } from '@/types/prisma'
import Link from 'next/link'

interface Account {
  id: string
  name: string
  currency: Currency
  color: string
  icon: string
  balance: number
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)

  useEffect(() => {
    loadAccounts()
  }, [])

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      if (!res.ok) {
        console.error('Failed to fetch accounts:', res.status)
        setAccounts([]) // Устанавливаем пустой массив при ошибке
        return
      }
      const data = await res.json()
      // Убеждаемся, что это массив
      setAccounts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading accounts:', error)
      setAccounts([]) // Устанавливаем пустой массив при ошибке
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить этот счёт?')) return

    try {
      const res = await fetch(`/api/accounts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadAccounts()
      } else {
        const data = await res.json()
        alert(data.error || 'Ошибка при удалении')
      }
    } catch (error) {
      alert('Ошибка при удалении')
    }
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
      <div className="flex items-center justify-between">
        <Title>Счета</Title>
        <Link href="/app/accounts/new">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + Добавить
          </button>
        </Link>
      </div>

      <div className="space-y-3">
        {accounts.map((account) => (
          <Card key={account.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                  style={{ backgroundColor: account.color }}
                >
                  {account.icon === 'wallet' && '💼'}
                  {account.icon === 'card' && '💳'}
                  {account.icon === 'cash' && '💵'}
                  {!['wallet', 'card', 'cash'].includes(account.icon) && '💰'}
                </div>
                <div className="flex-1">
                  <Text className="font-medium text-lg">{account.name}</Text>
                  <Text className="text-sm text-gray-500">{account.currency}</Text>
                </div>
              </div>
              <div className="text-right">
                <Text className="font-semibold text-lg">
                  {formatAmount(account.balance, account.currency)}
                </Text>
                <div className="flex gap-2 mt-2">
                  <Link href={`/app/accounts/${account.id}/edit`}>
                    <button className="text-blue-600 text-sm">Изменить</button>
                  </Link>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="text-red-600 text-sm"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {accounts.length === 0 && (
          <Card className="p-8 text-center">
            <Text className="text-gray-500">Нет счетов. Добавьте первый счёт.</Text>
          </Card>
        )}
      </div>
    </div>
  )
}

