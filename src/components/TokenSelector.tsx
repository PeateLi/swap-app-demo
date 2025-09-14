'use client'

import React from 'react'
import { useAtom } from 'jotai'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Spinner,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure
} from '@heroui/react'
import {
  tokenListAtom,
  selectedFromTokenAtom,
  selectedToTokenAtom,
  exchangeAmountAtom,
  exchangeConfirmAtom,
  loadingAtom,
  errorAtom,
  dataSourceAtom
} from '../store/tokenStore'

interface TokenSelectorProps {
  data: {
    timestamp: string
    source?: string
    tokens: Array<{
      symbol: string
      name: string
      full_name: string
      price_usd: number
      price_cny: number
      change_24h: number
      market_cap: number
      volume_24h: number
      icon: string
      color: string
      description: string
      min_exchange: number
      max_exchange: number
      fee_rate: number
      network: string
      decimals: number
    }>
  }
}

export default function TokenSelector({ data }: TokenSelectorProps) {
  const [tokenList, setTokenList] = useAtom(tokenListAtom)
  const [selectedFromToken, setSelectedFromToken] = useAtom(selectedFromTokenAtom)
  const [selectedToToken, setSelectedToToken] = useAtom(selectedToTokenAtom)
  const [exchangeAmount, setExchangeAmount] = useAtom(exchangeAmountAtom)
  const [exchangeConfirm, setExchangeConfirm] = useAtom(exchangeConfirmAtom)
  const [loading, setLoading] = useAtom(loadingAtom)
  const [error, setError] = useAtom(errorAtom)
  const [dataSource, setDataSource] = useAtom(dataSourceAtom)
  
  const { isOpen, onOpen, onClose } = useDisclosure()

  React.useEffect(() => {
    if (data) {
      setTokenList(data.tokens)
      setDataSource(data.source || '')
    }
  }, [data, setTokenList, setDataSource])

  const handleExchange = () => {
    if (selectedFromToken && selectedToToken && exchangeAmount > 0) {
      setExchangeConfirm(true)
      onOpen()
    }
  }

  const handleConfirmExchange = () => {
    // 这里处理实际的兑换逻辑
    console.log('确认兑换:', {
      from: selectedFromToken,
      to: selectedToToken,
      amount: exchangeAmount
    })
    setExchangeConfirm(false)
    onClose()
  }

  const handleCancelExchange = () => {
    setExchangeConfirm(false)
    onClose()
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">加载代币数据中...</span>
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

  if (!tokenList || tokenList.length === 0) {
    return (
      <Card className="w-full">
        <CardBody className="text-center p-8">
          <p className="text-gray-500">暂无代币数据</p>
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
              代币兑换平台
            </h2>
            {dataSource && (
              <Chip color="primary" variant="flat">
                {dataSource}
              </Chip>
            )}
          </div>
          <p className="text-gray-600 text-lg">安全、快速、低手续费的代币兑换服务</p>
          <div className="flex items-center gap-4">
            <p className="text-sm text-gray-500">更新时间: {data.timestamp}</p>
          </div>
        </CardHeader>
      </Card>

      {/* 代币选择区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 源代币选择 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">源代币</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="选择源代币"
              placeholder="请选择要兑换的代币"
              selectedKeys={selectedFromToken ? [selectedFromToken.symbol] : []}
              onSelectionChange={(keys) => {
                const symbol = Array.from(keys)[0] as string
                const token = tokenList.find(t => t.symbol === symbol)
                setSelectedFromToken(token || null)
              }}
            >
              {tokenList.map((token) => (
                <SelectItem key={token.symbol}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: token.color }}>{token.icon}</span>
                    <span>{token.symbol}</span>
                    <span className="text-gray-500">- {token.full_name}</span>
                  </div>
                </SelectItem>
              ))}
            </Select>
            
            {selectedFromToken && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: selectedFromToken.color }} className="text-2xl">
                      {selectedFromToken.icon}
                    </span>
                    <div>
                      <p className="font-semibold">{selectedFromToken.symbol}</p>
                      <p className="text-sm text-gray-600">{selectedFromToken.full_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${selectedFromToken.price_usd}</p>
                    <p className={`text-sm ${selectedFromToken.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedFromToken.change_24h >= 0 ? '+' : ''}{selectedFromToken.change_24h}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* 目标代币选择 */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">目标代币</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <Select
              label="选择目标代币"
              placeholder="请选择要兑换到的代币"
              selectedKeys={selectedToToken ? [selectedToToken.symbol] : []}
              onSelectionChange={(keys) => {
                const symbol = Array.from(keys)[0] as string
                const token = tokenList.find(t => t.symbol === symbol)
                setSelectedToToken(token || null)
              }}
            >
              {tokenList.map((token) => (
                <SelectItem key={token.symbol}>
                  <div className="flex items-center gap-2">
                    <span style={{ color: token.color }}>{token.icon}</span>
                    <span>{token.symbol}</span>
                    <span className="text-gray-500">- {token.full_name}</span>
                  </div>
                </SelectItem>
              ))}
            </Select>
            
            {selectedToToken && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span style={{ color: selectedToToken.color }} className="text-2xl">
                      {selectedToToken.icon}
                    </span>
                    <div>
                      <p className="font-semibold">{selectedToToken.symbol}</p>
                      <p className="text-sm text-gray-600">{selectedToToken.full_name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">${selectedToToken.price_usd}</p>
                    <p className={`text-sm ${selectedToToken.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {selectedToToken.change_24h >= 0 ? '+' : ''}{selectedToToken.change_24h}%
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 兑换设置 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">兑换设置</h3>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            type="number"
            label="兑换数量"
            placeholder="请输入兑换数量"
            value={exchangeAmount.toString()}
            onChange={(e) => setExchangeAmount(parseFloat(e.target.value) || 0)}
            min={selectedFromToken?.min_exchange || 0}
            max={selectedFromToken?.max_exchange || 1000000}
          />
          
          {selectedFromToken && selectedToToken && exchangeAmount > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">兑换预览</h4>
              <div className="flex items-center justify-between">
                <span>
                  {exchangeAmount} {selectedFromToken.symbol}
                </span>
                <span>→</span>
                <span>
                  {(exchangeAmount * selectedFromToken.price_usd / selectedToToken.price_usd).toFixed(6)} {selectedToToken.symbol}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                汇率: 1 {selectedFromToken.symbol} = {(selectedFromToken.price_usd / selectedToToken.price_usd).toFixed(6)} {selectedToToken.symbol}
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 兑换按钮 */}
      <div className="flex justify-center">
        <Button
          color="primary"
          size="lg"
          onPress={handleExchange}
          isDisabled={!selectedFromToken || !selectedToToken || exchangeAmount <= 0}
        >
          开始兑换
        </Button>
      </div>

      {/* 兑换确认模态框 */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalHeader>确认兑换</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <p>您确定要进行以下兑换吗？</p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {exchangeAmount} {selectedFromToken?.symbol}
                  </span>
                  <span>→</span>
                  <span className="font-semibold">
                    {(exchangeAmount * (selectedFromToken?.price_usd || 0) / (selectedToToken?.price_usd || 1)).toFixed(6)} {selectedToToken?.symbol}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  手续费: {((selectedFromToken?.fee_rate || 0) * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="danger" variant="light" onPress={handleCancelExchange}>
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
