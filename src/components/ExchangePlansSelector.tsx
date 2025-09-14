'use client'

import React from 'react'
import { useAtom } from 'jotai'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Spinner
} from '@heroui/react'
import {
  exchangePlansAtom,
  selectedPlanAtom,
  loadingAtom,
  errorAtom,
  dataSourceAtom
} from '../store/tokenStore'

interface ExchangePlansSelectorProps {
  data: {
    timestamp: string
    source?: string
    from_token: string
    to_token: string
    amount: number
    plans: Array<{
      id: string
      name: string
      description: string
      exchange_rate: number
      fee_rate: number
      estimated_output: number
      estimated_time: string
      risk_level: string
      features: string[]
      recommended: boolean
    }>
    market_info: {
      current_rate: number
      from_price_usd?: number
      to_price_usd?: number
      price_change_24h: number
      volume_24h: number
      liquidity: string
    }
  }
}

export default function ExchangePlansSelector({ data }: ExchangePlansSelectorProps) {
  const [exchangePlans, setExchangePlans] = useAtom(exchangePlansAtom)
  const [selectedPlan, setSelectedPlan] = useAtom(selectedPlanAtom)
  const [loading, setLoading] = useAtom(loadingAtom)
  const [error, setError] = useAtom(errorAtom)
  const [dataSource, setDataSource] = useAtom(dataSourceAtom)
  
  const { isOpen, onOpen, onClose } = useDisclosure()

  React.useEffect(() => {
    if (data) {
      setExchangePlans(data.plans)
      setDataSource(data.source || '')
    }
  }, [data, setExchangePlans, setDataSource])

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan)
    onOpen()
  }

  const handleConfirmExchange = () => {
    // 这里处理实际的兑换逻辑
    console.log('确认兑换方案:', selectedPlan)
    onClose()
  }

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low': return 'success'
      case 'medium': return 'warning'
      case 'high': return 'danger'
      default: return 'default'
    }
  }

  const getLiquidityColor = (liquidity: string) => {
    switch (liquidity) {
      case 'high': return 'success'
      case 'medium': return 'warning'
      case 'low': return 'danger'
      default: return 'default'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">加载兑换方案中...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardBody className="text-center p-8">
          <p className="text-red-500">{error}</p>
        </CardBody>
      </Card>
    )
  }

  if (!exchangePlans || exchangePlans.length === 0) {
    return (
      <Card className="w-full">
        <CardBody className="text-center p-8">
          <p className="text-gray-500">暂无兑换方案</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* 头部信息 */}
      <Card>
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center justify-between w-full">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              兑换方案选择
            </h2>
            {dataSource && (
              <Chip color="primary" variant="flat">
                {dataSource}
              </Chip>
            )}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-lg">
              {data.amount} {data.from_token} → {data.to_token}
            </span>
            <Chip color="secondary" variant="flat">
              当前汇率: {data.market_info.current_rate}
            </Chip>
          </div>
          <p className="text-sm text-gray-500">更新时间: {data.timestamp}</p>
        </CardHeader>
      </Card>

      {/* 市场信息 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">市场信息</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-600">当前汇率</p>
              <p className="text-lg font-bold">{data.market_info.current_rate}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">24h变化</p>
              <p className={`text-lg font-bold ${data.market_info.price_change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {data.market_info.price_change_24h >= 0 ? '+' : ''}{data.market_info.price_change_24h}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">24h交易量</p>
              <p className="text-lg font-bold">${(data.market_info.volume_24h / 1000000).toFixed(1)}M</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-600">流动性</p>
              <Chip 
                color={getLiquidityColor(data.market_info.liquidity)} 
                size="sm"
                variant="flat"
              >
                {data.market_info.liquidity}
              </Chip>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 兑换方案列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {exchangePlans.map((plan, index) => (
          <Card 
            key={plan.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              plan.recommended ? 'ring-2 ring-blue-500' : ''
            }`}
            isPressable
            onPress={() => handleSelectPlan(plan)}
          >
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{plan.name}</h3>
                {plan.recommended && (
                  <Chip color="primary" size="sm">推荐</Chip>
                )}
              </div>
              <Chip 
                color={getRiskColor(plan.risk_level)} 
                size="sm"
                variant="flat"
              >
                {plan.risk_level === 'low' ? '低风险' : plan.risk_level === 'medium' ? '中风险' : '高风险'}
              </Chip>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-gray-600">{plan.description}</p>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">汇率</span>
                  <span className="font-semibold">{plan.exchange_rate.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">手续费</span>
                  <span className="font-semibold">{(plan.fee_rate * 100).toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">预计到账</span>
                  <span className="font-semibold text-green-600">{plan.estimated_output.toFixed(6)} {data.to_token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">预计时间</span>
                  <span className="font-semibold">{plan.estimated_time}</span>
                </div>
              </div>

              <Divider />

              <div>
                <p className="text-sm text-gray-600 mb-2">特色功能</p>
                <div className="flex flex-wrap gap-1">
                  {plan.features.map((feature: string, idx: number) => (
                    <Chip key={idx} size="sm" variant="flat" color="default">
                      {feature}
                    </Chip>
                  ))}
                </div>
              </div>

              <Button 
                color="primary" 
                className="w-full"
                onPress={() => handleSelectPlan(plan)}
              >
                选择此方案
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* 兑换确认模态框 */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalContent>
          <ModalHeader>确认兑换</ModalHeader>
          <ModalBody>
            {selectedPlan && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">{selectedPlan.name}</h4>
                  <p className="text-gray-600 mb-4">{selectedPlan.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>兑换数量</span>
                      <span className="font-semibold">{data.amount} {data.from_token}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>汇率</span>
                      <span className="font-semibold">{selectedPlan.exchange_rate.toFixed(6)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>手续费</span>
                      <span className="font-semibold">{(selectedPlan.fee_rate * 100).toFixed(2)}%</span>
                    </div>
                    <Divider />
                    <div className="flex justify-between text-lg font-bold">
                      <span>预计到账</span>
                      <span className="text-green-600">{selectedPlan.estimated_output.toFixed(6)} {data.to_token}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>预计时间</span>
                      <span className="font-semibold">{selectedPlan.estimated_time}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={onClose}>
              取消
            </Button>
            <Button color="primary" onPress={handleConfirmExchange}>
              确认兑换
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
