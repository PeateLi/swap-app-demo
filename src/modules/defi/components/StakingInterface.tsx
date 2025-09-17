'use client'

import React, { useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Progress,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Divider
} from '@heroui/react'

interface StakingInterfaceProps {
  positions: any[]
  onUnstake: (positionId: string, amount?: number) => Promise<any>
  onClaimRewards: (positionId: string) => Promise<any>
}

export function StakingInterface({ positions, onUnstake, onClaimRewards }: StakingInterfaceProps) {
  const [selectedPosition, setSelectedPosition] = useState<any>(null)
  const [isUnstakeModalOpen, setIsUnstakeModalOpen] = useState(false)
  const [unstakeAmount, setUnstakeAmount] = useState('')
  const [isClaiming, setIsClaiming] = useState<string | null>(null)

  const handleUnstake = async () => {
    if (!selectedPosition) return

    const amount = unstakeAmount ? parseFloat(unstakeAmount) : undefined
    const result = await onUnstake(selectedPosition.id, amount)
    if (result) {
      setIsUnstakeModalOpen(false)
      setUnstakeAmount('')
      setSelectedPosition(null)
    }
  }

  const handleClaimRewards = async (positionId: string) => {
    setIsClaiming(positionId)
    try {
      await onClaimRewards(positionId)
    } finally {
      setIsClaiming(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success'
      case 'locked': return 'warning'
      case 'unlocking': return 'primary'
      case 'completed': return 'default'
      default: return 'default'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return '活跃'
      case 'locked': return '锁定中'
      case 'unlocking': return '解锁中'
      case 'completed': return '已完成'
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

  const getTimeRemaining = (stakedAt: number, lockPeriod: number) => {
    const now = Date.now()
    const unlockTime = stakedAt + (lockPeriod * 24 * 60 * 60 * 1000)
    const remaining = unlockTime - now

    if (remaining <= 0) return '已解锁'
    
    const days = Math.ceil(remaining / (24 * 60 * 60 * 1000))
    return `${days} 天`
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-lg font-semibold mb-2">暂无质押位置</h3>
          <p className="text-gray-600 mb-4">您还没有任何质押位置</p>
          <p className="text-sm text-gray-500">
            前往"流动性池"标签页开始您的第一次质押
          </p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 总览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-blue-600">{positions.length}</div>
            <div className="text-sm text-gray-600">总位置数</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {positions.reduce((sum, pos) => sum + pos.amount, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">总质押量</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {positions.reduce((sum, pos) => sum + pos.rewards, 0).toFixed(4)}
            </div>
            <div className="text-sm text-gray-600">待领取奖励</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {(positions.reduce((sum, pos) => sum + pos.apy, 0) / positions.length).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">平均APY</div>
          </CardBody>
        </Card>
      </div>

      {/* 质押位置列表 */}
      <div className="space-y-4">
        {positions.map((position) => (
          <Card key={position.id}>
            <CardBody>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* 位置信息 */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">位置 #{position.id.slice(-6)}</h3>
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
                      <span className="text-gray-600">锁定期:</span>
                      <div className="font-semibold">
                        {position.lockPeriod > 0 ? 
                          `${position.lockPeriod} 天` : 
                          '无锁定期'
                        }
                      </div>
                    </div>
                  </div>

                  {/* 解锁进度 */}
                  {position.lockPeriod > 0 && position.status === 'locked' && (
                    <div className="mt-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span>解锁进度</span>
                        <span>{getTimeRemaining(position.stakedAt, position.lockPeriod)}</span>
                      </div>
                      <Progress 
                        value={Math.min(100, ((Date.now() - position.stakedAt) / (position.lockPeriod * 24 * 60 * 60 * 1000)) * 100)}
                        className="w-full"
                        color="primary"
                      />
                    </div>
                  )}
                </div>

                {/* 奖励信息 */}
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <div className="text-sm text-gray-600">待领取奖励</div>
                    <div className="text-lg font-bold text-green-600">
                      {position.rewards.toFixed(4)}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      color="success"
                      variant="flat"
                      onPress={() => handleClaimRewards(position.id)}
                      isLoading={isClaiming === position.id}
                      isDisabled={position.rewards <= 0}
                    >
                      领取奖励
                    </Button>
                    
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => {
                        setSelectedPosition(position)
                        setIsUnstakeModalOpen(true)
                      }}
                      isDisabled={position.status === 'locked'}
                    >
                      取消质押
                    </Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 取消质押模态框 */}
      <Modal isOpen={isUnstakeModalOpen} onClose={() => setIsUnstakeModalOpen(false)}>
        <ModalContent>
          <ModalHeader>取消质押</ModalHeader>
          <ModalBody>
            {selectedPosition && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">位置信息</h4>
                  <div className="text-sm space-y-1">
                    <div>位置ID: #{selectedPosition.id.slice(-6)}</div>
                    <div>质押数量: {selectedPosition.amount}</div>
                    <div>当前状态: {getStatusText(selectedPosition.status)}</div>
                  </div>
                </div>

                <Input
                  label="取消质押数量"
                  placeholder={`最大: ${selectedPosition.amount}`}
                  value={unstakeAmount}
                  onChange={(e) => setUnstakeAmount(e.target.value)}
                  type="number"
                  max={selectedPosition.amount}
                  description="留空表示取消全部质押"
                />

                {selectedPosition.lockPeriod > 0 && selectedPosition.status === 'locked' && (
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <div className="text-sm text-yellow-800">
                      <strong>注意:</strong> 此位置仍在锁定期内，取消质押可能需要等待解锁时间。
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsUnstakeModalOpen(false)}>
              取消
            </Button>
            <Button 
              color="danger" 
              onPress={handleUnstake}
              isDisabled={selectedPosition?.status === 'locked'}
            >
              确认取消质押
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
