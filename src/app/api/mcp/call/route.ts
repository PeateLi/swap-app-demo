import { NextRequest, NextResponse } from 'next/server'
import { mcpServiceManager } from '../../../core/MCPService'

export async function POST(request: NextRequest) {
  try {
    const { service, method, params, module } = await request.json()

    // 验证参数
    if (!service || !method) {
      return NextResponse.json(
        { error: '服务名称和方法不能为空' },
        { status: 400 }
      )
    }

    // 检查服务是否存在
    const serviceConfig = mcpServiceManager.getService(service)
    if (!serviceConfig) {
      return NextResponse.json(
        { error: `服务 ${service} 不存在` },
        { status: 404 }
      )
    }

    // 检查方法是否支持
    if (!serviceConfig.methods.includes(method)) {
      return NextResponse.json(
        { error: `方法 ${method} 在服务 ${service} 中不存在` },
        { status: 400 }
      )
    }

    // 检查认证要求
    if (serviceConfig.authRequired) {
      const authHeader = request.headers.get('authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json(
          { error: '此服务需要认证' },
          { status: 401 }
        )
      }
    }

    // 调用MCP服务
    const result = await mcpServiceManager.callService({
      service,
      method,
      params,
      module
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || '服务调用失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      requestId: result.requestId,
      timestamp: result.timestamp
    })
  } catch (error) {
    console.error('MCP服务调用失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务调用失败' },
      { status: 500 }
    )
  }
}

// 获取服务状态
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const service = searchParams.get('service')

    if (service) {
      // 获取特定服务状态
      const status = mcpServiceManager.getServiceStatus(service)
      return NextResponse.json(status)
    } else {
      // 获取所有服务状态
      const allStatus = mcpServiceManager.getAllServicesStatus()
      return NextResponse.json(allStatus)
    }
  } catch (error) {
    console.error('获取服务状态失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '获取服务状态失败' },
      { status: 500 }
    )
  }
}
