'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Title, Text, Button, TextInput, Select, SelectItem } from '@tremor/react'
import { Currency } from '@/types/prisma'

const currencies: Currency[] = ['USD', 'EUR', 'RUB', 'RSD', 'VND']
const icons = [
  { value: 'wallet', label: '💼 Кошелёк' },
  { value: 'card', label: '💳 Карта' },
  { value: 'cash', label: '💵 Наличные' },
]

export default function NewAccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    currency: 'USD' as Currency,
    color: '#4F46E5',
    icon: 'wallet',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        router.push('/app/accounts')
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

  return (
    <div className="space-y-6">
      <Title>Новый счёт</Title>

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
              Создать
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

