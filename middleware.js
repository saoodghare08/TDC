import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // Safety check for env vars
    if (!supabaseUrl || !supabaseKey) {
        // If keys are missing, we pass through. 
        // Real auth checks will fail gracefully later or static build might assume unauthed.
        return supabaseResponse
    }

    const supabase = createServerClient(
        supabaseUrl,
        supabaseKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    let user = null
    try {
        const {
            data: { user: authUser },
        } = await supabase.auth.getUser()
        user = authUser
    } catch (e) {
        console.error('Middleware Auth Error:', e)
        // Fail open: Treat as unauthenticated rather than crashing
    }

    // ADMIN ROUTES PROTECTION
    if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
        const sessionExpiry = request.cookies.get('admin_session_expiry')

        // 1. Check for basic auth and session cookie
        if (!user || !sessionExpiry) {
            // If session expired (cookie gone) or no user, redirect to admin login
            return NextResponse.redirect(new URL('/admin/login', request.url))
        }

        // 2. Check for Admin Email (if configured)
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
        if (adminEmail && user.email !== adminEmail) {
            // Logged in user is NOT the authorized admin -> redirect to client portal
            return NextResponse.redirect(new URL('/portal/dashboard', request.url))
        }
    }

    // If already logged in as admin and trying to access admin login, redirect to dashboard
    if (request.nextUrl.pathname.startsWith('/admin/login') && user) {
        const sessionExpiry = request.cookies.get('admin_session_expiry')
        if (sessionExpiry) {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
    }

    // CLIENT PORTAL ROUTES PROTECTION
    if (request.nextUrl.pathname.startsWith('/portal') && !request.nextUrl.pathname.startsWith('/portal/login')) {
        if (!user) {
            // Not authenticated, redirect to client login
            return NextResponse.redirect(new URL('/portal/login', request.url))
        }
    }

    // If already logged in and trying to access portal login, redirect to dashboard
    if (request.nextUrl.pathname === '/portal/login' && user) {
        return NextResponse.redirect(new URL('/portal/dashboard', request.url))
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
