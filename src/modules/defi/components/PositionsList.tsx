'use client'

import React, { useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Tabs,
  Tab,
  Button,
  Chip,
  Progress,
  Divider
} from '@heroui/react'

interface PositionsListProps {
  stakingPositions: any[]
  lendingPositions: any[]
}

export function PositionsList({ stakingPositions, lendingPositions }: PositionsListProps) {
  const [selectedTab, setSelectedTab] = useState('staking')

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'locked': return 'warning'
      case 'unlocking': return 'primary'
      case 'completed': return 'default'
      case 'at_risk': return 'warning'
      case 'liquidated': return 'danger'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃'
      case 'locked': return '锁定中'
      case 'unlocking': return '解锁中'
      case 'completed': return '已完成'
      case 'at_risk': return '风险中'
      case 'liquidated': return '已清算'
      default: return '未知'
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getHealthColor = (healthFactor: number) => {
    if (healthFactor >= 2) return 'success'
    if (healthFactor >= 1.5) return 'warning'
    return 'danger'
  }

  const getHealthText = (healthFactor: number) => {
    if (healthFactor >= 2) return '健康'
    if (healthFactor >= 1.5) return '注意'
    return '危险'
  }

  return (
    <div className="space-y-6">
      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="w-full"
      >
        <Tab key="staking" title={`🔒 质押位置 (${stakingPositions.length})`}>
          <div className="space-y-4">
            {stakingPositions.length === 0 ? (
              <Card>
                <CardBody className="text-center p-8">
                  <div className="text-4xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold mb-2">暂无质押位置</h3>
                  <p className="text-gray-600">您还没有任何质押位置</p>
                </CardBody>
              </Card>
            ) : (
              stakingPositions.map((position) => (
                <Card key={position.id}>
                  <CardBody>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">质押位置 #{position.id.slice(-6)}</h3>
                          <Chip 
                            color={getStatusColor(position.status)} 
                            size="sm"
                            variant="flat"
                          >
                            {getStatusText(position.status)}
                          </Chip>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">质押数量:</span>
                            <div className="font-semibold">{position.amount}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">APY:</span>
                            <div className="font-semibold text-green-600">{position.apy}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">质押时间:</span>
                            <div className="font-semibold">{formatTime(position.stakedAt)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">待领取奖励:</span>
                            <div className="font-semibold text-green-600">{position.rewards.toFixed(4)}</div>
                          </div>
                        </div>

                        {position.lockPeriod > 0 && position.status === 'locked' && (
                          <div className="mt-3">
                            <div className="flex justify-between text-sm mb-1">
                              <span>解锁进度</span>
                              <span>
                                {Math.ceil((Date.now() - position.stakedAt) / (24 * 60 * 60 * 1000))} / {position.lockPeriod} 天
                              </span>
                            </div>
                            <Progress 
                              value={Math.min(100, ((Date.now() - position.stakedAt) / (position.lockPeriod * 24 * 60 * 60 * 1000)) * 100)}
                              className="w-full"
                              color="primary"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">总价值</div>
                          <div className="text-lg font-bold">
                            ${(position.amount * 1000).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" color="success" variant="flat">
                            查看详情
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </Tab>

        <Tab key="lending" title={`🏦 借贷位置 (${lendingPositions.length})`}>
          <div className="space-y-4">
            {lendingPositions.length === 0 ? (
              <Card>
                <CardBody className="text-center p-8">
                  <div className="text-4xl mb-4">🏦</div>
                  <h3 className="text-lg font-semibold mb-2">暂无借贷位置</h3>
                  <p className="text-gray-600">您还没有任何借贷位置</p>
                </CardBody>
              </Card>
            ) : (
              lendingPositions.map((position) => (
                <Card key={position.id}>
                  <CardBody>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-lg font-semibold">借贷位置 #{position.id.slice(-6)}</h3>
                          <Chip 
                            color={getStatusColor(position.status)} 
                            size="sm"
                            variant="flat"
                          >
                            {getStatusText(position.status)}
                          </Chip>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">资产:</span>
                            <div className="font-semibold">{position.asset}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">供应量:</span>
                            <div className="font-semibold">{position.supplied.toFixed(4)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">借贷量:</span>
                            <div className="font-semibold">{position.borrowed.toFixed(4)}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">利率:</span>
                            <div className="font-semibold">{position.interestRate}%</div>
                          </div>
                        </div>

                        <Divider className="my-3" />

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">抵押率:</span>
                            <div className="font-semibold">{position.collateralRatio.toFixed(2)}%</div>
                          </div>
                          <div>
                            <span className="text-gray-600">健康度:</span>
                            <div className="flex items-center gap-2">
                              <Chip 
                                color={getHealthColor(position.healthFactor)} 
                                size="sm"
                                variant="flat"
                              >
                                {getHealthText(position.healthFactor)}
                              </Chip>
                              <span className="font-semibold">{position.healthFactor.toFixed(2)}</span>
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">清算阈值:</span>
                            <div className="font-semibold">{position.liquidationThreshold}%</div>
                          </div>
                        </div>

                        {position.status === 'at_risk' && (
                          <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
                            <div className="text-sm text-yellow-800">
                              <strong>⚠️ 风险警告:</strong> 您的借贷位置健康度较低，请考虑增加抵押品或偿还部分债务。
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">总价值</div>
                          <div className="text-lg font-bold">
                            ${(position.supplied * 1000).toFixed(2)}
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button size="sm" color="primary" variant="flat">
                            管理
                          </Button>
                          <Button size="sm" color="warning" variant="flat">
                            调整
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  )
}
