import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Форматирует сумму в минимальных единицах в читаемый формат
 * @param amount - сумма в минимальных единицах (центах, копейках и т.д.)
 * @param currency - валюта
 * @returns отформатированная строка (например, "$1,234.56")
 */
export function formatAmount(amount: number, currency: string): string {
  const majorUnits = amount / 100 // предполагаем, что минимальная единица = 1/100 основной
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return formatter.format(majorUnits)
}

/**
 * Конвертирует сумму из основных единиц в минимальные (центы, копейки)
 */
export function toMinorUnits(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Конвертирует сумму из минимальных единиц в основные
 */
export function toMajorUnits(amount: number): number {
  return amount / 100
}

/**
 * Форматирует сумму для графиков - компактный формат без лишних нулей
 * @param amount - сумма в минимальных единицах (центах, копейках и т.д.)
 * @param currency - валюта
 * @returns отформатированная строка (например, "RUB 150,000" или "USD 1,234.56")
 */
export function formatAmountCompact(amount: number, currency: string): string {
  const majorUnits = amount / 100
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return formatter.format(majorUnits)
}

