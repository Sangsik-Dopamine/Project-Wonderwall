import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// 어드민 계정 정보 (실제 운영시 환경변수로 관리 권장)
const ADMIN_ID = 'sangsik'
const ADMIN_PW = 'ssp2424!'

// 간단한 토큰 생성 (실제 운영시 JWT 등 사용 권장)
function generateToken(): string {
  return Buffer.from(`admin_${Date.now()}_${Math.random().toString(36)}`).toString('base64')
}

export async function POST(request: NextRequest) {
  try {
    const { id, password } = await request.json()

    if (!id || !password) {
      return NextResponse.json(
        { error: 'ID와 비밀번호를 입력해주세요' },
        { status: 400 }
      )
    }

    // 인증 확인
    if (id === ADMIN_ID && password === ADMIN_PW) {
      const token = generateToken()

      // 쿠키 설정
      const cookieStore = await cookies()
      cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24시간
        path: '/',
      })

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json(
        { error: 'ID 또는 비밀번호가 올바르지 않습니다' },
        { status: 401 }
      )
    }
  } catch (error) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
