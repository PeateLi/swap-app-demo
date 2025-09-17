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
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Select,
  SelectItem
} from '@heroui/react'
import { useDeFiData } from '../hooks/useDeFiData'
import { PoolsList } from './PoolsList'
import { StakingInterface } from './StakingInterface'
import { PositionsList } from './PositionsList'

export function DeFiInterface() {
  const [selectedTab, setSelectedTab] = useState('pools')
  const [selectedPool, setSelectedPool] = useState<any>(null)
  const [isStakeModalOpen, setIsStakeModalOpen] = useState(false)
  const [stakeAmount, setStakeAmount] = useState('')
  const [lockPeriod, setLockPeriod] = useState('0')

  const {
    pools,
    stakingPositions,
    lendingPositions,
    loading,
    error,
    isModuleAuthenticated,
    stake,
    unstake,
    claimRewards,
    hasPermission
  } = useDeFiData()

  const handleStake = async () => {
    if (!selectedPool || !stakeAmount) return

    const result = await stake(selectedPool.id, parseFloat(stakeAmount), parseInt(lockPeriod))
    if (result) {
      setIsStakeModalOpen(false)
      setStakeAmount('')
      setSelectedPool(null)
    }
  }

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

  if (!isModuleAuthenticated) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold mb-2">需要授权</h3>
          <p className="text-gray-600 mb-4">
            请先授权DeFi模块以使用流动性挖矿、质押等功能
          </p>
        </CardBody>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">加载DeFi数据中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <p className="text-red-500">{error}</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* 概览统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-blue-600">{pools.length}</div>
            <div className="text-sm text-gray-600">活跃池</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-green-600">{stakingPositions.length}</div>
            <div className="text-sm text-gray-600">质押位置</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-purple-600">{lendingPositions.length}</div>
            <div className="text-sm text-gray-600">借贷位置</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              ${pools.reduce((sum, pool) => sum + pool.tvl, 0).toFixed(0)}M
            </div>
            <div className="text-sm text-gray-600">总锁定价值</div>
          </CardBody>
        </Card>
      </div>

      {/* 主要功能区域 */}
      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="w-full"
      >
        <Tab key="pools" title="💧 流动性池">
          <PoolsList 
            pools={pools}
            onStake={(pool) => {
              setSelectedPool(pool)
              setIsStakeModalOpen(true)
            }}
          />
        </Tab>

        <Tab key="staking" title="🔒 质押挖矿">
          <StakingInterface 
            positions={stakingPositions}
            onUnstake={unstake}
            onClaimRewards={claimRewards}
          />
        </Tab>

        <Tab key="positions" title="📊 我的位置">
          <PositionsList 
            stakingPositions={stakingPositions}
            lendingPositions={lendingPositions}
          />
        </Tab>
      </Tabs>

      {/* 质押模态框 */}
      <Modal isOpen={isStakeModalOpen} onClose={() => setIsStakeModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader>质押到 {selectedPool?.name}</ModalHeader>
          <ModalBody>
            {selectedPool && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">池信息</span>
                    <Chip color={getRiskColor(selectedPool.riskLevel)} size="sm">
                      {selectedPool.riskLevel === 'low' ? '低风险' : 
                       selectedPool.riskLevel === 'medium' ? '中风险' : '高风险'}
                    </Chip>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>APR: {selectedPool.apr}%</div>
                    <div>TVL: ${selectedPool.tvl}M</div>
                    <div>24h 交易量: ${selectedPool.volume24h}M</div>
                  </div>
                </div>

                <Input
                  label="质押数量"
                  placeholder="输入质押数量"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  type="number"
                />

                <Select
                  label="锁定期限"
                  placeholder="选择锁定期限"
                  selectedKeys={[lockPeriod]}
                  onSelectionChange={(keys) => setLockPeriod(Array.from(keys)[0] as string)}
                >
                  <SelectItem key="0" value="0">无锁定期</SelectItem>
                  <SelectItem key="30" value="30">30天 (+5% APR)</SelectItem>
                  <SelectItem key="90" value="90">90天 (+15% APR)</SelectItem>
                  <SelectItem key="180" value="180">180天 (+30% APR)</SelectItem>
                  <SelectItem key="365" value="365">365天 (+50% APR)</SelectItem>
                </Select>

                {lockPeriod !== '0' && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <strong>锁定期奖励:</strong> 额外 +{lockPeriod === '30' ? '5' : 
                        lockPeriod === '90' ? '15' : 
                        lockPeriod === '180' ? '30' : '50'}% APR
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsStakeModalOpen(false)}>
              取消
            </Button>
            <Button 
              color="primary" 
              onPress={handleStake}
              isDisabled={!stakeAmount || parseFloat(stakeAmount) <= 0}
            >
              确认质押
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
