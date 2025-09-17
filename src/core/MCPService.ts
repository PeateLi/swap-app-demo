// MCP服务接口定义
export interface MCPServiceConfig {
  name: string
  baseUrl: string
  version: string
  methods: string[]
  authRequired: boolean
  rateLimit?: {
    requests: number
    window: number // 毫秒
  }
}

export interface MCPRequest {
  service: string
  method: string
  params: any
  module?: string
  timeout?: number
}

export interface MCPResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
  requestId: string
}

// MCP服务管理器
class MCPServiceManager {
  private services: Map<string, MCPServiceConfig> = new Map()
  private requestQueue: Map<string, Promise<any>> = new Map()
  private rateLimiters: Map<string, { count: number; resetTime: number }> = new Map()

  // 注册MCP服务
  registerService(config: MCPServiceConfig) {
    this.services.set(config.name, config)
    console.log(`MCP服务 ${config.name} 已注册`)
  }

  // 获取服务配置
  getService(name: string): MCPServiceConfig | undefined {
    return this.services.get(name)
  }

  // 检查速率限制
  private checkRateLimit(serviceName: string): boolean {
    const service = this.services.get(serviceName)
    if (!service?.rateLimit) return true

    const now = Date.now()
    const limiter = this.rateLimiters.get(serviceName) || { count: 0, resetTime: now + service.rateLimit.window }

    // 重置计数器
    if (now > limiter.resetTime) {
      limiter.count = 0
      limiter.resetTime = now + service.rateLimit.window
    }

    // 检查是否超过限制
    if (limiter.count >= service.rateLimit.requests) {
      return false
    }

    limiter.count++
    this.rateLimiters.set(serviceName, limiter)
    return true
  }

  // 生成请求ID
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 调用MCP服务
  async callService<T = any>(request: MCPRequest): Promise<MCPResponse<T>> {
    const { service: serviceName, method, params, module, timeout = 30000 } = request
    const requestId = this.generateRequestId()

    try {
      // 检查服务是否存在
      const service = this.services.get(serviceName)
      if (!service) {
        throw new Error(`MCP服务 ${serviceName} 不存在`)
      }

      // 检查方法是否支持
      if (!service.methods.includes(method)) {
        throw new Error(`方法 ${method} 在服务 ${serviceName} 中不存在`)
      }

      // 检查速率限制
      if (!this.checkRateLimit(serviceName)) {
        throw new Error(`服务 ${serviceName} 请求频率过高，请稍后重试`)
      }

      // 检查是否有重复请求
      const requestKey = `${serviceName}:${method}:${JSON.stringify(params)}`
      if (this.requestQueue.has(requestKey)) {
        return await this.requestQueue.get(requestKey)
      }

      // 创建请求Promise
      const requestPromise = this.executeRequest<T>({
        serviceName,
        method,
        params,
        module,
        timeout,
        requestId
      })

      // 缓存请求
      this.requestQueue.set(requestKey, requestPromise)

      try {
        const result = await requestPromise
        return result
      } finally {
        // 清理缓存的请求
        this.requestQueue.delete(requestKey)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
        requestId
      }
    }
  }

  // 执行实际请求
  private async executeRequest<T>({
    serviceName,
    method,
    params,
    module,
    timeout,
    requestId
  }: {
    serviceName: string
    method: string
    params: any
    module?: string
    timeout: number
    requestId: string
  }): Promise<MCPResponse<T>> {
    const service = this.services.get(serviceName)!
    
    // 构建请求URL
    const url = `${service.baseUrl}/mcp/${serviceName}/${method}`
    
    // 构建请求体
    const requestBody = {
      params,
      module,
      requestId,
      timestamp: Date.now()
    }

    // 创建AbortController用于超时控制
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Version': service.version,
          'X-Request-ID': requestId
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      return {
        success: true,
        data: data.result || data,
        timestamp: Date.now(),
        requestId
      }
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`请求超时 (${timeout}ms)`)
      }
      
      throw error
    }
  }

  // 批量调用服务
  async callServices<T = any>(requests: MCPRequest[]): Promise<MCPResponse<T>[]> {
    const promises = requests.map(request => this.callService<T>(request))
    return Promise.all(promises)
  }

  // 获取服务状态
  getServiceStatus(serviceName: string): {
    registered: boolean
    config?: MCPServiceConfig
    rateLimitStatus?: {
      count: number
      resetTime: number
      limit: number
    }
  } {
    const service = this.services.get(serviceName)
    const limiter = this.rateLimiters.get(serviceName)

    return {
      registered: !!service,
      config: service,
      rateLimitStatus: service?.rateLimit && limiter ? {
        count: limiter.count,
        resetTime: limiter.resetTime,
        limit: service.rateLimit.requests
      } : undefined
    }
  }

  // 获取所有服务状态
  getAllServicesStatus(): Record<string, any> {
    const status: Record<string, any> = {}
    
    this.services.forEach((service, name) => {
      status[name] = this.getServiceStatus(name)
    })

    return status
  }

  // 清理服务
  unregisterService(serviceName: string) {
    this.services.delete(serviceName)
    this.rateLimiters.delete(serviceName)
    console.log(`MCP服务 ${serviceName} 已注销`)
  }
}

// 创建全局实例
export const mcpServiceManager = new MCPServiceManager()

// 注册默认服务
mcpServiceManager.registerService({
  name: 'oauth',
  baseUrl: '/api/mcp',
  version: '1.0.0',
  methods: ['authorize', 'callback', 'refresh', 'revoke', 'getUserInfo'],
  authRequired: false,
  rateLimit: {
    requests: 100,
    window: 60000 // 1分钟
  }
})

mcpServiceManager.registerService({
  name: 'swap',
  baseUrl: '/api/mcp',
  version: '1.0.0',
  methods: ['getTokens', 'getRates', 'executeSwap', 'getHistory'],
  authRequired: true,
  rateLimit: {
    requests: 50,
    window: 60000
  }
})

mcpServiceManager.registerService({
  name: 'defi',
  baseUrl: '/api/mcp',
  version: '1.0.0',
  methods: ['getPools', 'stake', 'unstake', 'claimRewards', 'getPositions'],
  authRequired: true,
  rateLimit: {
    requests: 30,
    window: 60000
  }
})

mcpServiceManager.registerService({
  name: 'nft',
  baseUrl: '/api/mcp',
  version: '1.0.0',
  methods: ['getCollections', 'getTokens', 'transfer', 'mint', 'getMetadata'],
  authRequired: true,
  rateLimit: {
    requests: 20,
    window: 60000
  }
})

// Hook for using MCP services
export function useMCPService(serviceName: string) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callService = useCallback(async <T = any>(
    method: string,
    params: any = {},
    module?: string
  ): Promise<MCPResponse<T>> => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await mcpServiceManager.callService<T>({
        service: serviceName,
        method,
        params,
        module
      })

      if (!result.success) {
        setError(result.error || '服务调用失败')
      }

      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '服务调用失败'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [serviceName])

  return {
    callService,
    isLoading,
    error,
    serviceStatus: mcpServiceManager.getServiceStatus(serviceName)
  }
}

// 导入React hooks
import { useState, useCallback } from 'react'
