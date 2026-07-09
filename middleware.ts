// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // ログイン画面、またはAPIリクエスト、静的ファイルはスルーする
  if (pathname === '/login' || pathname.startsWith('/api') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // クッキー（トークン）がない場合はログイン画面へ飛ばす
  if (!authToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// ミドルウェアを適用する範囲（すべてのページに適用）
export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};