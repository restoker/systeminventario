import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { api } from './lib/auth';

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {

    const session = await api.getSession({ headers: await headers() });
    if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
        return NextResponse.redirect(new URL('/login?call=' + request.nextUrl.pathname, request.url))
    }
    return NextResponse.next();
}

// Alternatively, you can use a default export:
// export default function proxy(request: NextRequest) { ... }

export const config = {
    matcher: '/dashboard/:path*',
}