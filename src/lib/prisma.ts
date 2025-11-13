import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // Улучшенная конфигурация для Vercel/serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// Обработка graceful shutdown
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // В production закрываем соединение при завершении процесса
  if (typeof process !== 'undefined') {
    process.on('beforeExit', async () => {
      await prisma.$disconnect()
    })
  }
}

