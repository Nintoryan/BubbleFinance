'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function LoadingScreen() {
  const [isLoading, setIsLoading] = useState(true)
  const [phase, setPhase] = useState<'loading' | 'fade-text' | 'bounce' | 'fade-bg' | 'hidden'>('loading')

  useEffect(() => {
    // Определяем, когда приложение загрузилось
    let timeoutId: NodeJS.Timeout

    const handleLoad = () => {
      // Минимальное время показа загрузчика (1.5 секунды)
      timeoutId = setTimeout(() => {
        setIsLoading(false)
      }, 1500)
    }

    // Проверяем, что DOM готов и основные ресурсы загружены
    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      // Если DOM еще не готов, ждем события load
      window.addEventListener('load', handleLoad)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('load', handleLoad)
    }
  }, [])

  useEffect(() => {
    if (!isLoading) {
      // Фаза 1: Фейд текста (0.5 секунды)
      setPhase('fade-text')
      const timer1 = setTimeout(() => {
        // Фаза 2: Подпрыгивание и падение (1 секунда)
        setPhase('bounce')
        const timer2 = setTimeout(() => {
          // Фаза 3: Фейд фона (0.5 секунды)
          setPhase('fade-bg')
          const timer3 = setTimeout(() => {
            setPhase('hidden')
          }, 500)
          return () => clearTimeout(timer3)
        }, 1000)
        return () => clearTimeout(timer2)
      }, 500)
      return () => clearTimeout(timer1)
    }
  }, [isLoading])

  if (phase === 'hidden') {
    return null
  }

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center ${
        phase === 'fade-bg' ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#2563EB',
        transition: phase === 'fade-bg' ? 'opacity 0.5s ease-out' : 'none',
      }}
    >
      <div
        className={`relative ${
          phase === 'loading' ? 'animate-pulse-scale' : phase === 'bounce' ? 'animate-bounce-down' : ''
        } ${
          phase === 'fade-bg' ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          transition: phase === 'fade-bg' ? 'opacity 0s' : 'none', // Мгновенное скрытие при fade-bg
        }}
      >
        <div className="relative w-32 h-32 rounded-full border-[6px] border-white overflow-hidden shadow-lg">
          <Image
            src="/imgs/logo.jpg"
            alt="Bubble Finance Logo"
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      </div>
      <h1
        className={`mt-6 text-2xl font-semibold text-white ${
          phase === 'fade-text' || phase === 'bounce' || phase === 'fade-bg' ? 'opacity-0' : 'opacity-100'
        }`}
        style={{
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          transition: phase === 'fade-text' ? 'opacity 0.5s ease-out' : 'none',
        }}
      >
        Bubble Finance
      </h1>
    </div>
  )
}

