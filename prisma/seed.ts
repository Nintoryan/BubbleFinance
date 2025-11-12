import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Создаем настройки по умолчанию
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      baseCurrency: 'USD',
    },
  })

  // Создаем категории расходов
  const expenseCategories = [
    { name: 'Еда', color: '#EF4444', icon: 'utensils' },
    { name: 'Транспорт', color: '#3B82F6', icon: 'car' },
    { name: 'Аренда', color: '#8B5CF6', icon: 'home' },
    { name: 'Подписки', color: '#EC4899', icon: 'subscription' },
    { name: 'Другое', color: '#6B7280', icon: 'tag' },
  ]

  for (const cat of expenseCategories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: cat.name,
          type: 'EXPENSE',
        },
      },
      update: {},
      create: {
        name: cat.name,
        type: 'EXPENSE',
        color: cat.color,
        icon: cat.icon,
      },
    })
  }

  // Создаем категории доходов
  const incomeCategories = [
    { name: 'Зарплата', color: '#10B981', icon: 'briefcase' },
    { name: 'Фриланс', color: '#F59E0B', icon: 'laptop' },
    { name: 'Другое', color: '#6B7280', icon: 'dollar-sign' },
  ]

  for (const cat of incomeCategories) {
    await prisma.category.upsert({
      where: {
        name_type: {
          name: cat.name,
          type: 'INCOME',
        },
      },
      update: {},
      create: {
        name: cat.name,
        type: 'INCOME',
        color: cat.color,
        icon: cat.icon,
      },
    })
  }

  console.log('Seeding completed!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })

