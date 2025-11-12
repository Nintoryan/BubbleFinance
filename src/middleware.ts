import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Обрабатываем корневой путь
  if (pathname === '/') {
    const authCookie = request.cookies.get('auth')
    if (authCookie) {
      return NextResponse.redirect(new URL('/app', request.url))
    } else {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Разрешаем доступ к публичным маршрутам
  if (pathname === '/login' || pathname.startsWith('/api/login')) {
    return NextResponse.next()
  }

  // Проверяем авторизацию для защищенных маршрутов
  if (pathname.startsWith('/app') || pathname.startsWith('/api')) {
    const authCookie = request.cookies.get('auth')

    // Если нет cookie и это не публичный API endpoint
    if (!authCookie && !pathname.startsWith('/api/login')) {
      // Редирект на /login
      if (pathname.startsWith('/api')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/', '/app/:path*', '/api/:path*'],
}

