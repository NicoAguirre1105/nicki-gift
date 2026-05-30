import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const protectedRoutes = ['/game', '/dashboard']
const publicRoutes = ['/']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r))
  const isPublicRoute = publicRoutes.includes(path)

  let response = NextResponse.next({ request: req })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          )
          response = NextResponse.next({ request: req })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Sin sesión intentando ruta protegida → login
  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // Con sesión intentando ir al login → redirigir según progreso
  if (isPublicRoute && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('maze_completed')
      .eq('id', user.id)
      .single()

    const destination = profile?.maze_completed ? '/dashboard' : '/game'
    return NextResponse.redirect(new URL(destination, req.nextUrl))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.svg$).*)'],
}
