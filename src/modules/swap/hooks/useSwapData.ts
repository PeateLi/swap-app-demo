'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAtom } from 'jotai'
import { useMCPService } from '../../../core/MCPService'
import { useModuleOAuth } from '../../../hooks/useOAuth'
import {
  tokenListAtom,
  selectedFromTokenAtom,
  selectedToTokenAtom,
  exchangeAmountAtom,
  exchangePlansAtom,
  loadingAtom,
  errorAtom
} from '../../../store/tokenStore'

export function useSwapData() {
  const { callService, isLoading, error } = useMCPService('swap')
  const { isModuleAuthenticated, hasModulePermission } = useModuleOAuth('swap')
  
  const [tokenList, setTokenList] = useAtom(tokenListAtom)
  const [selectedFromToken, setSelectedFromToken] = useAtom(selectedFromTokenAtom)
  const [selectedToToken, setSelectedToToken] = useAtom(selectedToTokenAtom)
  const [exchangeAmount, setExchangeAmount] = useAtom(exchangeAmountAtom)
  const [exchangePlans, setExchangePlans] = useAtom(exchangePlansAtom)
  const [loading, setLoading] = useAtom(loadingAtom)
  const [errorState, setError] = useAtom(errorAtom)

  // 获取代币列表
  const fetchTokenList = useCallback(async () => {
    if (!isModuleAuthenticated) {
      setError('请先授权Swap模块')
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
        includePrices: true,
        includeBalances: true
      })

      if (response.success && response.data) {
        setTokenList(response.data.tokens || [])
      } else {
        setError(response.error || '获取代币列表失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取代币列表失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError, setTokenList])

  // 获取兑换方案
  const fetchExchangePlans = useCallback(async (fromToken: string, toToken: string, amount: number) => {
    if (!isModuleAuthenticated) {
      setError('请先授权Swap模块')
      return
    }

    if (!hasModulePermission('api:access')) {
      setError('没有访问API的权限')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getRates', {
        fromToken,
        toToken,
        amount,
        includePlans: true
      })

      if (response.success && response.data) {
        setExchangePlans(response.data.plans || [])
      } else {
        setError(response.error || '获取兑换方案失败')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取兑换方案失败'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError, setExchangePlans])

  // 执行兑换
  const executeSwap = useCallback(async (planId: string, fromToken: string, toToken: string, amount: number) => {
    if (!isModuleAuthenticated) {
      setError('请先授权Swap模块')
      return
    }

    if (!hasModulePermission('write:transaction')) {
      setError('没有执行交易的权限')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('executeSwap', {
        planId,
        fromToken,
        toToken,
        amount,
        slippage: 0.5 // 0.5% 滑点
      })

      if (response.success && response.data) {
        // 兑换成功，刷新数据
        await fetchTokenList()
        return response.data
      } else {
        setError(response.error || '兑换失败')
        return null
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '兑换失败'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError, fetchTokenList])

  // 获取兑换历史
  const fetchSwapHistory = useCallback(async (limit = 20, offset = 0) => {
    if (!isModuleAuthenticated) {
      setError('请先授权Swap模块')
      return
    }

    if (!hasModulePermission('read:history')) {
      setError('没有读取历史的权限')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await callService('getHistory', {
        limit,
        offset,
        type: 'swap'
      })

      if (response.success && response.data) {
        return response.data.history || []
      } else {
        setError(response.error || '获取兑换历史失败')
        return []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '获取兑换历史失败'
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [isModuleAuthenticated, hasModulePermission, callService, setLoading, setError])

  // 自动获取代币列表
  useEffect(() => {
    if (isModuleAuthenticated && tokenList.length === 0) {
      fetchTokenList()
    }
  }, [isModuleAuthenticated, tokenList.length, fetchTokenList])

  // 当选择代币和数量变化时，自动获取兑换方案
  useEffect(() => {
    if (selectedFromToken && selectedToToken && exchangeAmount > 0) {
      fetchExchangePlans(selectedFromToken.symbol, selectedToToken.symbol, exchangeAmount)
    }
  }, [selectedFromToken, selectedToToken, exchangeAmount, fetchExchangePlans])

  return {
    // 状态
    tokenList,
    selectedFromToken,
    selectedToToken,
    exchangeAmount,
    exchangePlans,
    loading: loading || isLoading,
    error: errorState || error,
    isModuleAuthenticated,
    
    // 设置函数
    setSelectedFromToken,
    setSelectedToToken,
    setExchangeAmount,
    
    // 操作函数
    fetchTokenList,
    fetchExchangePlans,
    executeSwap,
    fetchSwapHistory,
    
    // 权限检查
    hasPermission: hasModulePermission
  }
}
