import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { module, provider = 'default', redirectUri } = await request.json()

    // 验证参数
    if (!module) {
      return NextResponse.json(
        { error: '模块名称不能为空' },
        { status: 400 }
      )
    }

    // 生成OAuth状态
    const state = `oauth_${module}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 构建OAuth URL（这里使用示例URL，实际应该根据provider配置）
    const oauthUrl = new URL('https://oauth.example.com/authorize')
    oauthUrl.searchParams.set('client_id', process.env.OAUTH_CLIENT_ID || 'demo_client')
    oauthUrl.searchParams.set('redirect_uri', redirectUri)
    oauthUrl.searchParams.set('response_type', 'code')
    oauthUrl.searchParams.set('scope', `module:${module} read:wallet write:transaction`)
    oauthUrl.searchParams.set('state', state)
    oauthUrl.searchParams.set('provider', provider)

    // 存储状态到数据库或缓存（这里简化处理）
    // 在实际应用中，应该将state存储到数据库或Redis中

    return NextResponse.json({
      authUrl: oauthUrl.toString(),
      state
    })
  } catch (error) {
    console.error('OAuth授权失败:', error)
    return NextResponse.json(
      { error: 'OAuth授权失败' },
      { status: 500 }
    )
  }
}
