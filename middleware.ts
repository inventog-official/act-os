import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function isSupabaseConfigured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  return url && key && url !== 'your_supabase_url' && key !== 'your_supabase_anon_key'
    && url !== 'https://your-project.supabase.co'
}

// Supabase SSR stores session cookies as `sb-<project-ref>-auth-token`.
// If none exists, there is no session, so we skip the network getUser() call.
function hasSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((c) => c.name.startsWith('sb-'))
}

export async function middleware(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.next({ request })
  }

  const isAuthPage =
    request.nextUrl.pathname.startsWith('/login') ||
    request.nextUrl.pathname.startsWith('/register') ||
    request.nextUrl.pathname.startsWith('/otp')

  const isLandingPage = request.nextUrl.pathname === '/'

  const isApiRoute = request.nextUrl.pathname.startsWith('/api')

  // No session cookie -> definitely not authenticated. Bypass the network call.
  if (!hasSessionCookie(request)) {
    if (!isAuthPage && !isApiRoute && !isLandingPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isAuthPage && !isApiRoute && !isLandingPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = '/demo-corp/dashboard'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run on everything except Next.js internals and static assets served by
     * _next/, plus files in the given extensions, so static assets never
     * hit the Supabase auth check.
     */
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|otf)$).*)',
  ],
}