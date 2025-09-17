import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    // 检查是否有错误
    if (error) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    // 验证参数
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/?error=missing_parameters', request.url)
      )
    }

    // 验证state格式
    if (!state.startsWith('oauth_')) {
      return NextResponse.redirect(
        new URL('/?error=invalid_state', request.url)
      )
    }

    // 从state中提取模块信息
    const [, module] = state.split('_')

    // 交换授权码获取token
    const tokenResponse = await fetch('https://oauth.example.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.OAUTH_CLIENT_ID || 'demo_client',
        client_secret: process.env.OAUTH_CLIENT_SECRET || 'demo_secret',
        code,
        redirect_uri: new URL('/auth/callback', request.url).toString()
      })
    })

    if (!tokenResponse.ok) {
      throw new Error('Token交换失败')
    }

    const tokenData = await tokenResponse.json()

    // 获取用户信息
    const userResponse = await fetch('https://oauth.example.com/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    })

    if (!userResponse.ok) {
      throw new Error('获取用户信息失败')
    }

    const userData = await userResponse.json()

    // 计算token过期时间
    const expiresAt = Date.now() + (tokenData.expires_in * 1000)

    // 构建认证数据
    const authData = {
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        avatar: userData.picture,
        walletAddress: userData.wallet_address
      },
      tokens: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt,
        tokenType: tokenData.token_type || 'Bearer'
      },
      module,
      permissions: userData.permissions || []
    }

    // 将认证数据存储到localStorage（通过URL参数传递）
    const authDataString = encodeURIComponent(JSON.stringify(authData))

    // 重定向到主页面，携带认证数据
    return NextResponse.redirect(
      new URL(`/?auth_success=true&auth_data=${authDataString}`, request.url)
    )
  } catch (error) {
    console.error('OAuth回调处理失败:', error)
    return NextResponse.redirect(
      new URL(`/?error=callback_failed&message=${encodeURIComponent(error instanceof Error ? error.message : '未知错误')}`, request.url)
    )
  }
}
