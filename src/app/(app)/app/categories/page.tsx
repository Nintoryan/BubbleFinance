'use client'

import { useEffect, useState } from 'react'
import { Card, Title, Text, Button, TextInput, Select, SelectItem } from '@tremor/react'
import { TransactionType } from '@/types/prisma'
import Link from 'next/link'

interface Category {
  id: string
  name: string
  type: TransactionType
  color: string
  icon: string
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as TransactionType,
    color: '#6B7280',
    icon: 'tag',
  })
  const [formLoading, setFormLoading] = useState(false)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormLoading(true)

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        setFormData({ name: '', type: 'EXPENSE', color: '#6B7280', icon: 'tag' })
        setShowForm(false)
        loadCategories()
      } else {
        const data = await res.json()
        alert(data.error || 'Ошибка при создании категории')
      }
    } catch (error) {
      alert('Ошибка при создании категории')
    } finally {
      setFormLoading(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Удалить категорию "${name}"? Все транзакции с этой категорией будут перенесены в "Другое".`)) {
      return
    }

    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          alert(data.message)
        }
        loadCategories()
      } else {
        const data = await res.json()
        alert(data.error || 'Ошибка при удалении')
      }
    } catch (error) {
      alert('Ошибка при удалении')
    }
  }

  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE')
  const incomeCategories = categories.filter((c) => c.type === 'INCOME')

  const icons = [
    { value: 'tag', label: '🏷️ Тег' },
    { value: 'utensils', label: '🍽️ Еда' },
    { value: 'car', label: '🚗 Транспорт' },
    { value: 'home', label: '🏠 Дом' },
    { value: 'subscription', label: '📱 Подписки' },
    { value: 'briefcase', label: '💼 Работа' },
    { value: 'laptop', label: '💻 Фриланс' },
    { value: 'dollar-sign', label: '💰 Деньги' },
    { value: 'shopping', label: '🛒 Покупки' },
    { value: 'gift', label: '🎁 Подарок' },
    { value: 'heart', label: '❤️ Здоровье' },
    { value: 'book', label: '📚 Образование' },
  ]

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
        <Title>Категории</Title>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </div>

      {/* Форма создания категории */}
      {showForm && (
        <Card className="relative overflow-visible">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Text className="mb-2">Название</Text>
              <TextInput
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Например: Развлечения"
                required
              />
            </div>

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
                onClick={() => {
                  setShowForm(false)
                  setFormData({ name: '', type: 'EXPENSE', color: '#6B7280', icon: 'tag' })
                }}
                className="flex-1"
              >
                Отмена
              </Button>
              <Button type="submit" loading={formLoading} className="flex-1">
                Создать
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Категории расходов */}
      <div>
        <Title className="mb-4">Расходы</Title>
        <div className="space-y-3">
          {expenseCategories.map((category) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon === 'utensils' && '🍽️'}
                    {category.icon === 'car' && '🚗'}
                    {category.icon === 'home' && '🏠'}
                    {category.icon === 'subscription' && '📱'}
                    {category.icon === 'tag' && '🏷️'}
                    {category.icon === 'shopping' && '🛒'}
                    {category.icon === 'gift' && '🎁'}
                    {category.icon === 'heart' && '❤️'}
                    {category.icon === 'book' && '📚'}
                    {!['utensils', 'car', 'home', 'subscription', 'tag', 'shopping', 'gift', 'heart', 'book'].includes(
                      category.icon
                    ) && '🏷️'}
                  </div>
                  <div className="flex-1">
                    <Text className="font-medium text-lg">{category.name}</Text>
                  </div>
                </div>
                <div>
                  {category.name !== 'Другое' && (
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-red-600 text-sm font-medium hover:text-red-700"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Категории доходов */}
      <div>
        <Title className="mb-4">Доходы</Title>
        <div className="space-y-3">
          {incomeCategories.map((category) => (
            <Card key={category.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-xl"
                    style={{ backgroundColor: category.color }}
                  >
                    {category.icon === 'briefcase' && '💼'}
                    {category.icon === 'laptop' && '💻'}
                    {category.icon === 'dollar-sign' && '💰'}
                    {category.icon === 'tag' && '🏷️'}
                    {category.icon === 'gift' && '🎁'}
                    {!['briefcase', 'laptop', 'dollar-sign', 'tag', 'gift'].includes(category.icon) && '🏷️'}
                  </div>
                  <div className="flex-1">
                    <Text className="font-medium text-lg">{category.name}</Text>
                  </div>
                </div>
                <div>
                  {category.name !== 'Другое' && (
                    <button
                      onClick={() => handleDelete(category.id, category.name)}
                      className="text-red-600 text-sm font-medium hover:text-red-700"
                    >
                      Удалить
                    </button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

