// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_TOKEN = 'waic_authenticated_session_token';

// GET: 現在のログイン状態をクッキーからチェック
export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token');

  if (token && token.value === AUTH_TOKEN) {
    return NextResponse.json({ authenticated: true });
  }
  return NextResponse.json({ authenticated: false });
}

// POST: パスワード検証とCookie付与
export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    const targetPassword = process.env.APP_PASSWORD || '1234';

    if (password === targetPassword) {
      const cookieStore = await cookies();
      cookieStore.set('auth_token', AUTH_TOKEN, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7日間有効
        path: '/',
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}

// DELETE: ログアウト（Cookie削除）
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
  return NextResponse.json({ success: true });
}