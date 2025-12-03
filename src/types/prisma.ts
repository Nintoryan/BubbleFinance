// TypeScript типы для валют и типов транзакций
// Используются вместо enum, так как SQLite не поддерживает enums

export type Currency = 'USD' | 'RSD' | 'RUB' | 'VND' | 'EUR'
export type TransactionType = 'INCOME' | 'EXPENSE' | 'CONVERSION'

// Валидация валюты
export function isValidCurrency(value: string): value is Currency {
  return ['USD', 'RSD', 'RUB', 'VND', 'EUR'].includes(value)
}

// Валидация типа транзакции
export function isValidTransactionType(value: string): value is TransactionType {
  return ['INCOME', 'EXPENSE', 'CONVERSION'].includes(value)
}

