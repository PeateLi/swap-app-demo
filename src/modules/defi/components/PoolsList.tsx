'use client'

import React, { useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Progress,
  Input,
  Select,
  SelectItem,
  Divider
} from '@heroui/react'

interface PoolsListProps {
  pools: any[]
  onStake: (pool: any) => void
}

export function PoolsList({ pools, onStake }: PoolsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('tvl')

  const filteredPools = pools.filter(pool => {
    const matchesSearch = pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pool.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || pool.category === categoryFilter
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    switch (sortBy) {
      case 'tvl':
        return b.tvl - a.tvl
      case 'apr':
        return b.apr - a.apr
      case 'volume':
        return b.volume24h - a.volume24h
      case 'risk':
        const riskOrder = { low: 1, medium: 2, high: 3 }
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
      default:
        return 0
    }
  })

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'danger'
      default: return 'default'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'liquidity': return '💧'
      case 'lending': return '🏦'
      case 'staking': return '🔒'
      case 'yield': return '📈'
      default: return '💰'
    }
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`
    }
    return num.toFixed(2)
  }

  if (pools.length === 0) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <div className="text-4xl mb-4">💧</div>
          <h3 className="text-lg font-semibold mb-2">暂无流动性池</h3>
          <p className="text-gray-600">当前没有可用的流动性池</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 筛选和搜索 */}
      <Card>
        <CardBody>
          <div className="flex flex-col md:flex-row gap-4">
            <Input
              placeholder="搜索池名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            <Select
              placeholder="选择分类"
              selectedKeys={[categoryFilter]}
              onSelectionChange={(keys) => setCategoryFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="all" value="all">全部分类</SelectItem>
              <SelectItem key="liquidity" value="liquidity">💧 流动性</SelectItem>
              <SelectItem key="lending" value="lending">🏦 借贷</SelectItem>
              <SelectItem key="staking" value="staking">🔒 质押</SelectItem>
              <SelectItem key="yield" value="yield">📈 收益</SelectItem>
            </Select>
            
            <Select
              placeholder="排序方式"
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="tvl" value="tvl">按TVL排序</SelectItem>
              <SelectItem key="apr" value="apr">按APR排序</SelectItem>
              <SelectItem key="volume" value="volume">按交易量排序</SelectItem>
              <SelectItem key="risk" value="risk">按风险排序</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* 池列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPools.map((pool) => (
          <Card key={pool.id} className="w-full">
            <CardHeader className="flex flex-col gap-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getCategoryIcon(pool.category)}</span>
                  <h3 className="text-lg font-semibold">{pool.name}</h3>
                </div>
                <Chip 
                  color={getRiskColor(pool.riskLevel)} 
                  size="sm"
                  variant="flat"
                >
                  {pool.riskLevel === 'low' ? '低风险' : 
                   pool.riskLevel === 'medium' ? '中风险' : '高风险'}
                </Chip>
              </div>
              <p className="text-sm text-gray-600">{pool.description}</p>
              <div className="flex items-center gap-2">
                <Chip size="sm" variant="flat" color="primary">
                  {pool.tokenA}/{pool.tokenB}
                </Chip>
                <Chip size="sm" variant="flat" color="secondary">
                  {pool.category}
                </Chip>
              </div>
            </CardHeader>

            <CardBody className="space-y-4">
              {/* 关键指标 */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">APR</span>
                  <span className="font-bold text-green-600">{pool.apr}%</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">TVL</span>
                  <span className="font-semibold">${formatNumber(pool.tvl)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">24h 交易量</span>
                  <span className="font-semibold">${formatNumber(pool.volume24h)}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">24h 手续费</span>
                  <span className="font-semibold">${formatNumber(pool.fees24h)}</span>
                </div>
              </div>

              <Divider />

              {/* 奖励信息 */}
              {pool.rewards && pool.rewards.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">奖励代币</h4>
                  <div className="space-y-1">
                    {pool.rewards.map((reward: any, index: number) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <span>{reward.token}</span>
                        <span className="text-green-600">+{reward.apy}% APY</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="space-y-2">
                <Button 
                  color="primary" 
                  className="w-full"
                  onPress={() => onStake(pool)}
                  isDisabled={!pool.isActive}
                >
                  {pool.isActive ? '开始质押' : '暂不可用'}
                </Button>
                
                {pool.minDeposit > 0 && (
                  <p className="text-xs text-gray-500 text-center">
                    最小质押: {pool.minDeposit} {pool.tokenA}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredPools.length === 0 && (
        <Card>
          <CardBody className="text-center p-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">未找到匹配的池</h3>
            <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
