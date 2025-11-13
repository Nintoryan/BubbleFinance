'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Title, Text, Button, TextInput, Select, SelectItem } from '@tremor/react'
import { TransactionType, Currency } from '@/types/prisma'

interface Account {
  id: string
  name: string
  currency: Currency
}

interface Category {
  id: string
  name: string
  type: TransactionType
}

export default function NewTransactionPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [formData, setFormData] = useState({
    type: 'EXPENSE' as TransactionType,
    accountId: '',
    categoryId: '',
    amount: '',
    currency: 'USD' as Currency,
    date: new Date().toISOString().split('T')[0],
    note: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  // Загружаем категории только при изменении типа транзакции
  useEffect(() => {
    if (formData.type) {
      loadCategories(formData.type)
    }
  }, [formData.type])

  // Устанавливаем валюту счёта при выборе счёта
  useEffect(() => {
    if (formData.accountId && accounts.length > 0) {
      const account = accounts.find((a) => a.id === formData.accountId)
      if (account && account.currency !== formData.currency) {
        setFormData((prev) => ({ ...prev, currency: account.currency }))
      }
    }
  }, [formData.accountId, accounts])

  const loadData = async () => {
    try {
      const res = await fetch('/api/accounts')
      if (!res.ok) {
        console.error('Failed to fetch accounts:', res.status)
        setAccounts([])
        return
      }
      const data = await res.json()
      const accountsArray = Array.isArray(data) ? data : []
      setAccounts(accountsArray)
      if (accountsArray.length > 0) {
        setFormData((prev) => ({
          ...prev,
          accountId: accountsArray[0].id,
          currency: accountsArray[0].currency,
        }))
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setAccounts([])
    }
  }

  const loadCategories = async (type: TransactionType) => {
    try {
      const res = await fetch(`/api/categories?type=${type}`)
      const data = await res.json()
      setCategories(data)
      if (data.length > 0) {
        setFormData((prev) => {
          // Обновляем categoryId только если текущая категория не подходит для нового типа
          const currentCategory = data.find((cat: Category) => cat.id === prev.categoryId)
          return {
            ...prev,
            categoryId: currentCategory ? prev.categoryId : data[0].id,
          }
        })
      } else {
        setFormData((prev) => ({ ...prev, categoryId: '' }))
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount),
        }),
      })

      if (res.ok) {
        router.push('/app/transactions')
      } else {
        const data = await res.json()
        alert(data.error || 'Ошибка при создании')
      }
    } catch (error) {
      alert('Ошибка при создании')
    } finally {
      setLoading(false)
    }
  }

  const currencies: Currency[] = ['USD', 'EUR', 'RUB', 'RSD', 'VND']

  return (
    <div className="space-y-6">
      <Title>Новая транзакция</Title>

      <Card className="relative overflow-visible">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Text className="mb-2">Тип</Text>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value as TransactionType })}
            >
              <SelectItem value="EXPENSE">Расход</SelectItem>
              <SelectItem value="INCOME">Доход</SelectItem>
            </Select>
          </div>

          <div>
            <Text className="mb-2">Счёт</Text>
            <Select
              value={formData.accountId}
              onValueChange={(value) => {
                const account = accounts.find((a) => a.id === value)
                setFormData({
                  ...formData,
                  accountId: value,
                  currency: account?.currency || 'USD',
                })
              }}
            >
              {accounts.map((acc) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <Text className="mb-2">Категория</Text>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
            >
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <Text className="mb-2">Сумма</Text>
            <div className="flex gap-2">
              <TextInput
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                className="flex-1"
              />
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData({ ...formData, currency: value as Currency })}
                className="w-24"
              >
                {currencies.map((curr) => (
                  <SelectItem key={curr} value={curr}>
                    {curr}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Text className="mb-2">Дата</Text>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <Text className="mb-2">Заметка (необязательно)</Text>
            <TextInput
              value={formData.note}
              onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              placeholder="Добавить заметку"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.back()}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button type="submit" loading={loading} className="flex-1">
              Создать
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

