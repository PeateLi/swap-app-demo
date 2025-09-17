'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMCPService } from '../../../core/MCPService'
import { useModuleOAuth } from '../../../hooks/useOAuth'

// NFT数据类型定义
export interface NFTCollection {
  id: string
  name: string
  description: string
  symbol: string
  image: string
  bannerImage?: string
  contractAddress: string
  totalSupply: number
  floorPrice: number
  volume24h: number
  volume7d: number
  volume30d: number
  owners: number
  listed: number
  verified: boolean
  category: 'art' | 'gaming' | 'music' | 'sports' | 'collectibles' | 'utility' | 'other'
  website?: string
  twitter?: string
  discord?: string
  createdAt: number
}

export interface NFTToken {
  id: string
  tokenId: string
  name: string
  description: string
  image: string
  animationUrl?: string
  attributes: NFTAttribute[]
  collection: {
    id: string
    name: string
    contractAddress: string
  }
  owner: string
  price?: number
  listed: boolean
  rarity?: {
    rank: number
    score: number
    tier: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  }
  lastSale?: {
    price: number
    timestamp: number
  }
  createdAt: number
}

export interface NFTAttribute {
  trait_type: string
  value: string | number
  display_type?: string
  max_value?: number
}

export interface NFTCreator {
  address: string
  name: string
  avatar?: string
  verified: boolean
  bio?: string
  social?: {
    twitter?: string
    instagram?: string
    website?: string
  }
}

export function useNFTData() {
  const { callService, isLoading, error } = useMCPService('nft')
  const { isModuleAuthenticated, hasModulePermission } = useModuleOAuth('nft')
  
  const [collections, setCollections] = useState<NFTCollection[]>([])
  const [tokens, setTokens] = useState<NFTToken[]>([])
  const [myTokens, setMyTokens] = useState<NFTToken[]>([])
  const [creators, setCreators] = useState<NFTCreator[]>([])
  const [loading, setLoading] = useState(false)
  const [errorState, setError] = useState<string | null>(null)

  // 获取收藏品列表
  const fetchCollections = useCallback(async (category?: string, sortBy = 'volume24h') => {
    if (!isModuleAuthenticated) {
      setError('请先授权NFT模块')
      return
    }

    if (!hasModulePermission('read:wallet')) {
      setError('没有读取钱包的权限')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getCollections', {
        category,
        sortBy,
        order: 'desc',
        limit: 50
      })

      if (response.success && response.data) {
        setCollections(response.data.collections || [])
      } else {
        setError(response.error || '获取收藏品列表失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取收藏品列表失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError])

  // 获取NFT代币列表
  const fetchTokens = useCallback(async (collectionId?: string, filters?: any) => {
    if (!isModuleAuthenticated) {
      setError('请先授权NFT模块')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getTokens', {
        collectionId,
        ...filters,
        limit: 50
      })

      if (response.success && response.data) {
        setTokens(response.data.tokens || [])
      } else {
        setError(response.error || '获取NFT代币失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取NFT代币失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, callService, setLoading, setError])

  // 获取我的NFT
  const fetchMyTokens = useCallback(async () => {
    if (!isModuleAuthenticated) {
      setError('请先授权NFT模块')
      return
    }

    if (!hasModulePermission('read:wallet')) {
      setError('没有读取钱包的权限')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getTokens', {
        owned: true,
        includeMetadata: true
      })

      if (response.success && response.data) {
        setMyTokens(response.data.tokens || [])
      } else {
        setError(response.error || '获取我的NFT失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取我的NFT失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError])

  // 获取创作者列表
  const fetchCreators = useCallback(async () => {
    if (!isModuleAuthenticated) {
      setError('请先授权NFT模块')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getCreators', {
        verified: true,
        sortBy: 'volume',
        limit: 20
      })

      if (response.success && response.data) {
        setCreators(response.data.creators || [])
      } else {
        setError(response.error || '获取创作者列表失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取创作者列表失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, callService, setLoading, setError])

  // 转移NFT
  const transferNFT = useCallback(async (tokenId: string, to: string) => {
    if (!isModuleAuthenticated) {
      setError('请先授权NFT模块')
      return null
    }

    if (!hasModulePermission('write:transaction')) {
      setError('没有执行交易的权限')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('transfer', {
        tokenId,
        to,
        gasLimit: 100000
      })

      if (response.success && response.data) {
        // 转移成功，刷新数据
        await fetchMyTokens()
        return response.data
      } else {
        setError(response.error || '转移NFT失败')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '转移NFT失败'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError, fetchMyTokens])

  // 铸造NFT
  const mintNFT = useCallback(async (collectionId: string, metadata: any) => {
    if (!isModuleAuthenticated) {
      setError('请先授权NFT模块')
      return null
    }

    if (!hasModulePermission('manage:collections')) {
      setError('没有管理收藏品的权限')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('mint', {
        collectionId,
        metadata,
        gasLimit: 200000
      })

      if (response.success && response.data) {
        // 铸造成功，刷新数据
        await fetchMyTokens()
        return response.data
      } else {
        setError(response.error || '铸造NFT失败')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '铸造NFT失败'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError, fetchMyTokens])

  // 获取NFT元数据
  const getNFTMetadata = useCallback(async (tokenId: string) => {
    if (!isModuleAuthenticated) {
      setError('请先授权NFT模块')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getMetadata', {
        tokenId
      })

      if (response.success && response.data) {
        return response.data
      } else {
        setError(response.error || '获取NFT元数据失败')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取NFT元数据失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, callService, setLoading, setError])

  // 自动获取数据
  useEffect(() => {
    if (isModuleAuthenticated) {
      fetchCollections()
      fetchMyTokens()
      fetchCreators()
    }
  }, [isModuleAuthenticated, fetchCollections, fetchMyTokens, fetchCreators])

  return {
    // 状态
    collections,
    tokens,
    myTokens,
    creators,
    loading: loading || isLoading,
    error: errorState || error,
    isModuleAuthenticated,
    
    // 操作函数
    fetchCollections,
    fetchTokens,
    fetchMyTokens,
    fetchCreators,
    transferNFT,
    mintNFT,
    getNFTMetadata,
    
    // 权限检查
    hasPermission: hasModulePermission
  }
}
