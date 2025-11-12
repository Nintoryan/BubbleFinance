'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Проверяем авторизацию через cookie
    const authCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth='))

    if (authCookie) {
      // Если авторизован - редирект на /app
      router.replace('/app')
    } else {
      // Если не авторизован - редирект на /login
      router.replace('/login')
    }
  }, [router])

  // Показываем загрузку во время редиректа
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-gray-600">Загрузка...</div>
    </div>
  )
}

