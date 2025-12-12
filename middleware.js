import { NextResponse } from 'next/server'

export function middleware(request) {
    // Temporary bypass to debug 500 Error
    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
