'use client'

import { useEffect, useState } from 'react'
import { Card, Title, Text, Select, SelectItem } from '@tremor/react'
import { formatAmount } from '@/lib/utils'
import { TransactionType, Currency } from '@/types/prisma'
import { format } from 'date-fns'
import Link from 'next/link'

interface Transaction {
  id: string
  type: TransactionType
  amount: number
  currency: Currency
  date: string
  note: string | null
  account: { name: string; currency: Currency }
  toAccount: { name: string; currency: Currency } | null
  toAmount: number | null
  toCurrency: Currency | null
  category: { name: string; color: string; icon: string } | null
}

interface Account {
  id: string
  name: string
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    type: 'ALL' as 'ALL' | TransactionType,
    accountId: 'ALL',
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    loadTransactions()
  }, [filters])

  const loadAccounts = async () => {
    try {
      const res = await fetch('/api/accounts')
      if (!res.ok) {
        console.error('Failed to fetch accounts:', res.status)
        setAccounts([])
        return
      }
      const data = await res.json()
      setAccounts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error loading accounts:', error)
      setAccounts([])
    }
  }

  const loadTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.type !== 'ALL') params.append('type', filters.type)
      if (filters.accountId !== 'ALL') params.append('accountId', filters.accountId)
      params.append('from', filters.from)
      params.append('to', filters.to)

      const res = await fetch(`/api/transactions?${params.toString()}`)
      const data = await res.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error loading transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить эту транзакцию?')) return

    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadTransactions()
      } else {
        alert('Ошибка при удалении')
      }
    } catch (error) {
      alert('Ошибка при удалении')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Title>Транзакции</Title>
        <Link href="/app/transactions/new">
          <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
            + Добавить
          </button>
        </Link>
      </div>

      {/* Фильтры */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Text className="text-xs mb-1">Тип</Text>
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters({ ...filters, type: value as any })}
            >
              <SelectItem value="ALL">Все</SelectItem>
              <SelectItem value="INCOME">Доход</SelectItem>
              <SelectItem value="EXPENSE">Расход</SelectItem>
              <SelectItem value="CONVERSION">Конвертация</SelectItem>
            </Select>
          </div>
          <div>
            <Text className="text-xs mb-1">Счёт</Text>
            <Select
              value={filters.accountId}
              onValueChange={(value) => setFilters({ ...filters, accountId: value })}
            >
              <SelectItem value="ALL">Все</SelectItem>
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div>
            <Text className="text-xs mb-1">От</Text>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <Text className="text-xs mb-1">До</Text>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
      </Card>

      {/* Список транзакций */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Text>Загрузка...</Text>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.map((transaction) => (
            <Card key={transaction.id} className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {transaction.type === 'CONVERSION' ? (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm bg-blue-500">
                      🔄
                    </div>
                  ) : (
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm"
                      style={{
                        backgroundColor: transaction.category?.color || '#6B7280',
                      }}
                    >
                      {transaction.category?.icon === 'utensils' && '🍽️'}
                      {transaction.category?.icon === 'car' && '🚗'}
                      {transaction.category?.icon === 'home' && '🏠'}
                      {transaction.category?.icon === 'subscription' && '📱'}
                      {transaction.category?.icon === 'briefcase' && '💼'}
                      {transaction.category?.icon === 'laptop' && '💻'}
                      {transaction.category &&
                        !['utensils', 'car', 'home', 'subscription', 'briefcase', 'laptop'].includes(
                          transaction.category.icon
                        ) && '🏷️'}
                      {!transaction.category && '🏷️'}
                    </div>
                  )}
                  <div className="flex-1">
                    <Text className="font-medium">
                      {transaction.type === 'CONVERSION'
                        ? 'Конвертация'
                        : transaction.category?.name || 'Без категории'}
                    </Text>
                    {transaction.type === 'CONVERSION' ? (
                      <div className="text-sm text-gray-500 mt-1">
                        <div>
                          {format(new Date(transaction.date), 'dd.MM.yyyy')} • {transaction.account.name} →{' '}
                          {transaction.toAccount?.name || 'Неизвестный счёт'}
                        </div>
                      </div>
                    ) : (
                      <Text className="text-sm text-gray-500">
                        {format(new Date(transaction.date), 'dd.MM.yyyy')} • {transaction.account.name}
                      </Text>
                    )}
                    {transaction.note && (
                      <Text className="text-sm text-gray-400 mt-1">{transaction.note}</Text>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {transaction.type === 'CONVERSION' ? (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        <div className="text-red-600">
                          -{formatAmount(transaction.amount, transaction.currency)}
                        </div>
                        {transaction.toAmount !== null && transaction.toCurrency && (
                          <div className="text-green-600 mt-1">
                            +{formatAmount(transaction.toAmount, transaction.toCurrency)}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 text-xs mt-1"
                      >
                        Удалить
                      </button>
                    </div>
                  ) : (
                    <>
                      <Text
                        className={`font-semibold text-lg ${
                          transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatAmount(transaction.amount, transaction.currency)}
                      </Text>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 text-xs mt-1"
                      >
                        Удалить
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {transactions.length === 0 && (
            <Card className="p-8 text-center">
              <Text className="text-gray-500">Нет транзакций за выбранный период.</Text>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

