'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, Title, Text, Button, TextInput, Select, SelectItem } from '@tremor/react'
import { Currency } from '@/types/prisma'

const currencies: Currency[] = ['USD', 'EUR', 'RUB', 'RSD', 'VND']
const icons = [
  { value: 'wallet', label: '💼 Кошелёк' },
  { value: 'card', label: '💳 Карта' },
  { value: 'cash', label: '💵 Наличные' },
]

export default function EditAccountPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [formData, setFormData] = useState({
    name: '',
    currency: 'USD' as Currency,
    color: '#4F46E5',
    icon: 'wallet',
  })

  useEffect(() => {
    loadAccount()
  }, [id])

  const loadAccount = async () => {
    try {
      const res = await fetch('/api/accounts')
      if (!res.ok) {
        console.error('Failed to fetch accounts:', res.status)
        return
      }
      const accounts = await res.json()
      const accountsArray = Array.isArray(accounts) ? accounts : []
      const account = accountsArray.find((a: any) => a.id === id)
      if (account) {
        setFormData({
          name: account.name,
          currency: account.currency,
          color: account.color,
          icon: account.icon,
        })
      }
    } catch (error) {
      console.error('Error loading account:', error)
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch(`/api/accounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/app/accounts')
      } else {
        const data = await res.json()
        alert(data.error || 'Ошибка при обновлении')
      }
    } catch (error) {
      alert('Ошибка при обновлении')
    } finally {
      setLoading(false)
    }
  }

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <Text>Загрузка...</Text>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Title>Редактировать счёт</Title>

      <Card className="relative overflow-visible">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Text className="mb-2">Название</Text>
            <TextInput
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Например: Т-Банк"
              required
            />
          </div>

          <div>
            <Text className="mb-2">Валюта</Text>
            <Select
              value={formData.currency}
              onValueChange={(value) => setFormData({ ...formData, currency: value as Currency })}
            >
              {currencies.map((curr) => (
                <SelectItem key={curr} value={curr}>
                  {curr}
                </SelectItem>
              ))}
            </Select>
          </div>

          <div>
            <Text className="mb-2">Цвет</Text>
            <input
              type="color"
              value={formData.color}
              onChange={(e) => setFormData({ ...formData, color: e.target.value })}
              className="w-full h-12 rounded-lg border border-gray-300"
            />
          </div>

          <div>
            <Text className="mb-2">Иконка</Text>
            <Select
              value={formData.icon}
              onValueChange={(value) => setFormData({ ...formData, icon: value })}
            >
              {icons.map((icon) => (
                <SelectItem key={icon.value} value={icon.value}>
                  {icon.label}
                </SelectItem>
              ))}
            </Select>
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
              Сохранить
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

