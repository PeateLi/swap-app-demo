'use client'

import { useState, useEffect, useCallback } from 'react'
import { useMCPService } from '../../../core/MCPService'
import { useModuleOAuth } from '../../../hooks/useOAuth'

// DeFi数据类型定义
export interface DeFiPool {
  id: string
  name: string
  description: string
  tokenA: string
  tokenB: string
  liquidity: number
  apr: number
  tvl: number
  volume24h: number
  fees24h: number
  riskLevel: 'low' | 'medium' | 'high'
  category: 'liquidity' | 'lending' | 'staking' | 'yield'
  isActive: boolean
  minDeposit: number
  maxDeposit?: number
  lockPeriod?: number
  rewards: {
    token: string
    amount: number
    apy: number
  }[]
}

export interface StakingPosition {
  id: string
  poolId: string
  amount: number
  stakedAt: number
  lockPeriod: number
  rewards: number
  apy: number
  status: 'active' | 'locked' | 'unlocking' | 'completed'
}

export interface LendingPosition {
  id: string
  asset: string
  supplied: number
  borrowed: number
  collateralRatio: number
  healthFactor: number
  liquidationThreshold: number
  interestRate: number
  status: 'active' | 'at_risk' | 'liquidated'
}

export function useDeFiData() {
  const { callService, isLoading, error } = useMCPService('defi')
  const { isModuleAuthenticated, hasModulePermission } = useModuleOAuth('defi')
  
  const [pools, setPools] = useState<DeFiPool[]>([])
  const [stakingPositions, setStakingPositions] = useState<StakingPosition[]>([])
  const [lendingPositions, setLendingPositions] = useState<LendingPosition[]>([])
  const [loading, setLoading] = useState(false)
  const [errorState, setError] = useState<string | null>(null)

  // 获取流动性池列表
  const fetchPools = useCallback(async (category?: string) => {
    if (!isModuleAuthenticated) {
      setError('请先授权DeFi模块')
      return
    }

    if (!hasModulePermission('read:wallet')) {
      setError('没有读取钱包的权限')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getPools', {
        category,
        includeStats: true,
        sortBy: 'tvl',
        order: 'desc'
      })

      if (response.success && response.data) {
        setPools(response.data.pools || [])
      } else {
        setError(response.error || '获取流动性池失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取流动性池失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError])

  // 获取质押位置
  const fetchStakingPositions = useCallback(async () => {
    if (!isModuleAuthenticated) {
      setError('请先授权DeFi模块')
      return
    }

    if (!hasModulePermission('manage:positions')) {
      setError('没有管理位置的权限')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getPositions', {
        type: 'staking',
        includeRewards: true
      })

      if (response.success && response.data) {
        setStakingPositions(response.data.positions || [])
      } else {
        setError(response.error || '获取质押位置失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取质押位置失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError])

  // 获取借贷位置
  const fetchLendingPositions = useCallback(async () => {
    if (!isModuleAuthenticated) {
      setError('请先授权DeFi模块')
      return
    }

    if (!hasModulePermission('manage:positions')) {
      setError('没有管理位置的权限')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getPositions', {
        type: 'lending',
        includeHealth: true
      })

      if (response.success && response.data) {
        setLendingPositions(response.data.positions || [])
      } else {
        setError(response.error || '获取借贷位置失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取借贷位置失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError])

  // 执行质押
  const stake = useCallback(async (poolId: string, amount: number, lockPeriod?: number) => {
    if (!isModuleAuthenticated) {
      setError('请先授权DeFi模块')
      return null
    }

    if (!hasModulePermission('write:transaction')) {
      setError('没有执行交易的权限')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('stake', {
        poolId,
        amount,
        lockPeriod,
        slippage: 0.5
      })

      if (response.success && response.data) {
        // 质押成功，刷新数据
        await fetchStakingPositions()
        return response.data
      } else {
        setError(response.error || '质押失败')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '质押失败'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError, fetchStakingPositions])

  // 取消质押
  const unstake = useCallback(async (positionId: string, amount?: number) => {
    if (!isModuleAuthenticated) {
      setError('请先授权DeFi模块')
      return null
    }

    if (!hasModulePermission('write:transaction')) {
      setError('没有执行交易的权限')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('unstake', {
        positionId,
        amount
      })

      if (response.success && response.data) {
        // 取消质押成功，刷新数据
        await fetchStakingPositions()
        return response.data
      } else {
        setError(response.error || '取消质押失败')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '取消质押失败'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError, fetchStakingPositions])

  // 领取奖励
  const claimRewards = useCallback(async (positionId: string) => {
    if (!isModuleAuthenticated) {
      setError('请先授权DeFi模块')
      return null
    }

    if (!hasModulePermission('write:transaction')) {
      setError('没有执行交易的权限')
      return null
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('claimRewards', {
        positionId
      })

      if (response.success && response.data) {
        // 领取奖励成功，刷新数据
        await fetchStakingPositions()
        return response.data
      } else {
        setError(response.error || '领取奖励失败')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '领取奖励失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError, fetchStakingPositions])

  // 自动获取数据
  useEffect(() => {
    if (isModuleAuthenticated) {
      fetchPools()
      fetchStakingPositions()
      fetchLendingPositions()
    }
  }, [isModuleAuthenticated, fetchPools, fetchStakingPositions, fetchLendingPositions])

  return {
    // 状态
    pools,
    stakingPositions,
    lendingPositions,
    loading: loading || isLoading,
    error: errorState || error,
    isModuleAuthenticated,
    
    // 操作函数
    fetchPools,
    fetchStakingPositions,
    fetchLendingPositions,
    stake,
    unstake,
    claimRewards,
    
    // 权限检查
    hasPermission: hasModulePermission
  }
}
