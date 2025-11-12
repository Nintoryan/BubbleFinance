import { Currency } from '@/types/prisma'

// Кэш для курсов валют (в памяти)
interface ExchangeRateCache {
  rates: Record<string, number>
  timestamp: number
}

const CACHE_DURATION = 60 * 60 * 1000 // 1 час в миллисекундах
let cache: ExchangeRateCache | null = null

// Базовые курсы (fallback, если API недоступен)
// Все курсы относительно USD
const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  RSD: 108.5,
  RUB: 91.5,
  VND: 25450,
}

/**
 * Получает актуальные курсы валют с API
 * Используем exchangerate-api.com (бесплатный, без ключа)
 */
async function fetchExchangeRates(): Promise<Record<string, number>> {
  try {
    // Используем exchangerate-api.com (бесплатный публичный API)
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 }, // кэш на 1 час
    })

    if (!response.ok) {
      throw new Error('Failed to fetch exchange rates')
    }

    const data = await response.json()
    const rates: Record<string, number> = {
      USD: 1,
    }

    // Конвертируем в нужные валюты
    if (data.rates) {
      rates.EUR = data.rates.EUR || FALLBACK_RATES.EUR
      rates.RSD = data.rates.RSD || FALLBACK_RATES.RSD
      rates.RUB = data.rates.RUB || FALLBACK_RATES.RUB
      rates.VND = data.rates.VND || FALLBACK_RATES.VND
    }

    return rates
  } catch (error) {
    console.error('Error fetching exchange rates:', error)
    // Возвращаем fallback курсы
    return FALLBACK_RATES
  }
}

/**
 * Получает курсы валют (с кэшированием)
 */
async function getExchangeRates(): Promise<Record<string, number>> {
  const now = Date.now()

  // Проверяем кэш
  if (cache && now - cache.timestamp < CACHE_DURATION) {
    return cache.rates
  }

  // Обновляем кэш
  const rates = await fetchExchangeRates()
  cache = {
    rates,
    timestamp: now,
  }

  return rates
}

/**
 * Конвертирует сумму из одной валюты в другую
 * @param amount - сумма в минимальных единицах (центах, копейках и т.д.)
 * @param fromCurrency - исходная валюта
 * @param toCurrency - целевая валюта
 * @returns сумма в целевой валюте (в минимальных единицах, округленная)
 */
export async function convert(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): Promise<number> {
  if (fromCurrency === toCurrency) {
    return amount
  }

  const rates = await getExchangeRates()

  // Конвертируем через USD как базовую валюту
  // fromCurrency -> USD -> toCurrency
  const fromRate = rates[fromCurrency] || 1
  const toRate = rates[toCurrency] || 1

  // amount в fromCurrency -> amount в USD -> amount в toCurrency
  const amountInUSD = amount / fromRate
  const amountInTarget = amountInUSD * toRate

  return Math.round(amountInTarget)
}

/**
 * Получает курс обмена между двумя валютами
 */
export async function getRate(fromCurrency: Currency, toCurrency: Currency): Promise<number> {
  if (fromCurrency === toCurrency) {
    return 1
  }

  const rates = await getExchangeRates()
  const fromRate = rates[fromCurrency] || 1
  const toRate = rates[toCurrency] || 1

  return toRate / fromRate
}

