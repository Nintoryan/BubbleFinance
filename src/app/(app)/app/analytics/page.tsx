'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, Title, Text, Select, SelectItem, LineChart, BarChart, DonutChart } from '@tremor/react'
import { formatAmount, formatAmountCompact } from '@/lib/utils'
import { Currency } from '@/types/prisma'

interface Stats {
  totalBalance: number
  expensesByDay: Array<{ date: string; value: number }>
  incomeByDay: Array<{ date: string; value: number }>
  balanceByDay: Array<{ date: string; value: number }>
  expensesByCategory: Array<{ name: string; value: number }>
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [baseCurrency, setBaseCurrency] = useState<Currency>('USD')
  const [from, setFrom] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [to, setTo] = useState(new Date().toISOString().split('T')[0])

  // Палитра цветов, дружественная для дальтоников (ColorBrewer Set2 + Okabe-Ito)
  // Эти цвета хорошо различимы для людей с различными типами дальтонизма
  const colorblindFriendlyColors = [
    "#4472C4", // Синий (Blue)
    "#ED7D31", // Оранжевый (Orange)
    "#70AD47", // Зеленый, различимый для дальтоников (Green)
    "#FFC000", // Желтый (Yellow)
    "#5B9BD5", // Светло-синий (Light Blue)
    "#7030A0", // Фиолетовый (Purple)
    "#C55A11", // Коричнево-оранжевый (Brown-Orange)
    "#A5A5A5", // Серый (Gray)
    "#2F71F0", // Яркий синий (Bright Blue)
    "#E74C3C", // Красно-оранжевый (Red-Orange, различимый)
    "#1ABC9C", // Бирюзовый (Turquoise)
    "#9B59B6", // Фиолетовый (Violet)
  ];
  
  const generateColorList = (count: number) => {
    return Array.from({ length: count }, (_, i) => colorblindFriendlyColors[i % colorblindFriendlyColors.length]);
  }

  useEffect(() => {
    const initialize = async () => {
      await loadSettings()
      // После загрузки настроек загружаем статистику
      // baseCurrency будет обновлен в loadSettings, что вызовет второй useEffect
    }
    initialize()
  }, [])

  useEffect(() => {
    if (baseCurrency) {
      loadStats()
    }
  }, [from, to, baseCurrency])

  // Применяем цвета к DonutChart после рендеринга
  useEffect(() => {
    if (stats && stats.expensesByCategory.length > 0) {
      const colors = generateColorList(stats.expensesByCategory.length)
      
      const applyDonutColors = () => {
        const piePaths = document.querySelectorAll('.recharts-pie path, .recharts-pie-sector, .recharts-sector')
        
        piePaths.forEach((path, index) => {
          const element = path as SVGPathElement
          if (element) {
            const currentFill = element.getAttribute('fill')
            // Применяем цвет из палитры по индексу
            const targetColor = colors[index % colors.length]
            
            // Если цвет черный или не из нашей палитры, заменяем
            if (!currentFill || 
                currentFill === '#000000' || 
                currentFill === 'black' || 
                currentFill === '#000' || 
                currentFill === 'rgb(0, 0, 0)' || 
                currentFill.includes('000') ||
                !colors.includes(currentFill)) {
              element.setAttribute('fill', targetColor)
              element.style.fill = targetColor
            }
          }
        })
      }

      // Применяем сразу
      applyDonutColors()
      
      // Применяем после задержек (на случай, если DOM еще не готов)
      const timeout1 = setTimeout(applyDonutColors, 100)
      const timeout2 = setTimeout(applyDonutColors, 300)
      const timeout3 = setTimeout(applyDonutColors, 500)

      // Используем MutationObserver для отслеживания изменений DOM
      const observer = new MutationObserver(() => {
        applyDonutColors()
      })

      const pieContainer = document.querySelector('.recharts-pie, .recharts-wrapper')
      if (pieContainer) {
        observer.observe(pieContainer, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['fill', 'style'],
        })
      }

      return () => {
        clearTimeout(timeout1)
        clearTimeout(timeout2)
        clearTimeout(timeout3)
        observer.disconnect()
      }
    }
  }, [stats?.expensesByCategory])

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      const data = await res.json()
      if (data.baseCurrency) {
        setBaseCurrency(data.baseCurrency)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadStats = async (currency?: Currency) => {
    const targetCurrency = currency || baseCurrency
    if (!targetCurrency) return

    setLoading(true)
    try {
      const res = await fetch(
        `/api/stats/overview?from=${from}&to=${to}&baseCurrency=${targetCurrency}`
      )
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading stats:', error)
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
      // Явно перезагружаем данные с новой валютой
      await loadStats(currency)
    } catch (error) {
      console.error('Error updating base currency:', error)
      alert('Ошибка при обновлении валюты')
    }
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
      <Title>Аналитика</Title>

      {/* Фильтры */}
      <Card className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <Text className="text-xs mb-1">От</Text>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div>
            <Text className="text-xs mb-1">До</Text>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>
        <div>
          <Text className="text-xs mb-1">Валюта</Text>
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
        </div>
      </Card>

      {stats && (
        <>
          {/* График баланса */}
          {stats.balanceByDay.length > 0 && (
            <Card className="overflow-visible">
              <Title>Динамика баланса</Title>
              <div className="overflow-visible -mx-2 px-2">
                <BarChart
                  data={stats.balanceByDay}
                  index="date"
                  categories={['value']}
                  colors={['#2F71F0']}
                  valueFormatter={(value) => formatAmountCompact(value * 100, baseCurrency)}
                  showLegend={false}
                  className="h-64 mt-4"
                />
              </div>
            </Card>
          )}

          {/* График расходов */}
          {stats.expensesByDay.length > 0 && (
            <Card className="overflow-visible">
              <Title>Расходы по дням</Title>
              <div className="overflow-visible -mx-2 px-2">
                <BarChart
                  data={stats.expensesByDay}
                  index="date"
                  categories={['value']}
                  colors={['#2F71F0']}
                  valueFormatter={(value) => formatAmountCompact(value * 100, baseCurrency)}
                  showLegend={false}
                  className="h-64 mt-4"
                />
              </div>
            </Card>
          )}

          {/* График доходов */}
          {stats.incomeByDay.length > 0 && (
            <Card className="overflow-visible">
              <Title>Доходы по дням</Title>
              <div className="overflow-visible -mx-2 px-2">
                <BarChart
                  data={stats.incomeByDay}
                  index="date"
                  categories={['value']}
                  colors={['#2F71F0']}
                  valueFormatter={(value) => formatAmountCompact(value * 100, baseCurrency)}
                  showLegend={false}
                  className="h-64 mt-4"
                />
              </div>
            </Card>
          )}

          {/* Круговая диаграмма расходов по категориям */}
          {stats.expensesByCategory.length > 0 && (
            <Card>
              <Title>Расходы по категориям</Title>
              <DonutChart
                data={stats.expensesByCategory}
                category="value"
                index="name"
                valueFormatter={(value) => formatAmount(value * 100, baseCurrency)}
                colors={generateColorList(stats.expensesByCategory.length)}
                className="h-64 mt-4"
              />
            </Card>
          )}
        </>
      )}

      {stats && stats.balanceByDay.length === 0 && (
        <Card className="p-8 text-center">
          <Text className="text-gray-500">Нет данных за выбранный период.</Text>
        </Card>
      )}
    </div>
  )
}

