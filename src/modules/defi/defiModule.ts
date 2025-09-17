import { ModuleConfig } from '../../core/ModuleRegistry'

// DeFi模块配置
export const defiModuleConfig: ModuleConfig = {
  id: 'defi',
  name: '去中心化金融',
  description: '流动性挖矿、质押、借贷等DeFi服务',
  version: '1.0.0',
  icon: '🏦',
  category: 'defi',
  permissions: [
    'read:wallet',
    'write:transaction',
    'read:history',
    'manage:positions',
    'api:access'
  ],
  oauthProviders: ['default', 'metamask', 'walletconnect'],
  routes: [
    {
      path: '/defi',
      component: () => import('./components/DeFiInterface'),
      exact: true,
      protected: true,
      permissions: ['read:wallet']
    },
    {
      path: '/defi/pools',
      component: () => import('./components/DeFiInterface'),
      protected: true,
      permissions: ['read:wallet']
    },
    {
      path: '/defi/staking',
      component: () => import('./components/DeFiInterface'),
      protected: true,
      permissions: ['manage:positions']
    },
    {
      path: '/defi/positions',
      component: () => import('./components/DeFiInterface'),
      protected: true,
      permissions: ['read:history']
    }
  ],
  components: {
    DeFiInterface: () => import('./components/DeFiInterface'),
    PoolsList: () => import('./components/PoolsList'),
    StakingInterface: () => import('./components/StakingInterface'),
    PositionsList: () => import('./components/PositionsList')
  },
  hooks: {
    useDeFiData: () => import('./hooks/useDeFiData')
  },
  services: {
    defiService: {
      name: 'defi',
      methods: ['getPools', 'stake', 'unstake', 'claimRewards', 'getPositions'],
      baseUrl: '/api/mcp'
    }
  },
  dependencies: ['swap'],
  enabled: true
}

// DeFi模块Hook
export function useDeFiModule() {
  // 延迟导入以避免循环依赖
  const { mcpServiceManager } = require('../../core/MCPService')
  const defiService = mcpServiceManager.getService('defi')
  
  return {
    isAvailable: !!defiService,
    serviceStatus: mcpServiceManager.getServiceStatus('defi'),
    methods: defiService?.methods || []
  }
}

// DeFi模块初始化
export function initializeDeFiModule() {
  // 延迟导入以避免循环依赖
  const { mcpServiceManager } = require('../../core/MCPService')
  
  // 注册MCP服务
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

  console.log('DeFi模块已初始化')
}
