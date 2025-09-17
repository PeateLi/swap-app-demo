import { ModuleConfig } from '../../core/ModuleRegistry'

// NFT模块配置
export const nftModuleConfig: ModuleConfig = {
  id: 'nft',
  name: '非同质化代币',
  description: 'NFT交易、铸造、收藏管理',
  version: '1.0.0',
  icon: '🎨',
  category: 'nft',
  permissions: [
    'read:wallet',
    'write:transaction',
    'read:history',
    'manage:collections',
    'api:access'
  ],
  oauthProviders: ['default', 'metamask', 'walletconnect'],
  routes: [
    {
      path: '/nft',
      component: () => import('./components/NFTInterface'),
      exact: true,
      protected: true,
      permissions: ['read:wallet']
    },
    {
      path: '/nft/collections',
      component: () => import('./components/NFTInterface'),
      protected: true,
      permissions: ['read:wallet']
    },
    {
      path: '/nft/marketplace',
      component: () => import('./components/NFTInterface'),
      protected: true,
      permissions: ['read:wallet']
    },
    {
      path: '/nft/create',
      component: () => import('./components/NFTInterface'),
      protected: true,
      permissions: ['manage:collections']
    }
  ],
  components: {
    NFTInterface: () => import('./components/NFTInterface'),
    CollectionsList: () => import('./components/CollectionsList'),
    NFTMarketplace: () => import('./components/NFTMarketplace'),
    NFTCreator: () => import('./components/NFTCreator')
  },
  hooks: {
    useNFTData: () => import('./hooks/useNFTData')
  },
  services: {
    nftService: {
      name: 'nft',
      methods: ['getCollections', 'getTokens', 'transfer', 'mint', 'getMetadata'],
      baseUrl: '/api/mcp'
    }
  },
  dependencies: ['swap'],
  enabled: true
}

// NFT模块Hook
export function useNFTModule() {
  // 延迟导入以避免循环依赖
  const { mcpServiceManager } = require('../../core/MCPService')
  const nftService = mcpServiceManager.getService('nft')
  
  return {
    isAvailable: !!nftService,
    serviceStatus: mcpServiceManager.getServiceStatus('nft'),
    methods: nftService?.methods || []
  }
}

// NFT模块初始化
export function initializeNFTModule() {
  // 延迟导入以避免循环依赖
  const { mcpServiceManager } = require('../../core/MCPService')
  
  // 注册MCP服务
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

  console.log('NFT模块已初始化')
}
