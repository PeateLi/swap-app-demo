import { ModuleConfig } from '../../core/ModuleRegistry'

// Swap模块配置
export const swapModuleConfig: ModuleConfig = {
  id: 'swap',
  name: '代币兑换',
  description: '安全、快速的代币兑换服务',
  version: '1.0.0',
  icon: '💱',
  category: 'swap',
  permissions: [
    'read:wallet',
    'write:transaction',
    'read:history',
    'api:access'
  ],
  oauthProviders: ['default', 'metamask', 'walletconnect'],
  routes: [
    {
      path: '/swap',
      component: () => import('./components/SwapPage'),
      exact: true,
      protected: true,
      permissions: ['read:wallet']
    },
    {
      path: '/swap/history',
      component: () => import('./components/SwapHistory'),
      protected: true,
      permissions: ['read:history']
    }
  ],
  components: {
    SwapInterface: () => import('./components/SwapInterface'),
    TokenSelector: () => import('./components/TokenSelector'),
    ExchangePlansSelector: () => import('./components/ExchangePlansSelector'),
    SwapHistory: () => import('./components/SwapHistory'),
    SwapSettings: () => import('./components/SwapSettings')
  },
  hooks: {
    useSwapData: () => import('./hooks/useSwapData'),
    useTokenList: () => import('./hooks/useTokenList'),
    useExchangeRates: () => import('./hooks/useExchangeRates'),
    useSwapExecution: () => import('./hooks/useSwapExecution')
  },
  services: {
    swapService: {
      name: 'swap',
      methods: ['getTokens', 'getRates', 'executeSwap', 'getHistory'],
      baseUrl: '/api/mcp'
    }
  },
  dependencies: [],
  enabled: true
}

// Swap模块Hook
export function useSwapModule() {
  // 延迟导入以避免循环依赖
  const { mcpServiceManager } = require('../../core/MCPService')
  const swapService = mcpServiceManager.getService('swap')
  
  return {
    isAvailable: !!swapService,
    serviceStatus: mcpServiceManager.getServiceStatus('swap'),
    methods: swapService?.methods || []
  }
}

// Swap模块初始化
export function initializeSwapModule() {
  // 延迟导入以避免循环依赖
  const { mcpServiceManager } = require('../../core/MCPService')
  
  // 注册MCP服务
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

  console.log('Swap模块已初始化')
}
