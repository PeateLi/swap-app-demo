'use client'

import React, { useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Divider
} from '@heroui/react'

interface NFTMarketplaceProps {
  tokens: any[]
  onTransfer: (nft: any) => void
}

export function NFTMarketplace({ tokens, onTransfer }: NFTMarketplaceProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [collectionFilter, setCollectionFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('price')
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  const filteredTokens = tokens.filter(token => {
    const matchesSearch = token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         token.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCollection = collectionFilter === 'all' || token.collection.id === collectionFilter
    const matchesPrice = priceFilter === 'all' || 
      (priceFilter === 'under1' && token.price && token.price < 1) ||
      (priceFilter === '1to10' && token.price && token.price >= 1 && token.price <= 10) ||
      (priceFilter === 'over10' && token.price && token.price > 10)
    return matchesSearch && matchesCollection && matchesPrice
  }).sort((a, b) => {
    switch (sortBy) {
      case 'price':
        return (a.price || 0) - (b.price || 0)
      case 'rarity':
        return (b.rarity?.score || 0) - (a.rarity?.score || 0)
      case 'recent':
        return b.createdAt - a.createdAt
      default:
        return 0
    }
  })

  const getRarityColor = (tier?: string) => {
    switch (tier) {
      case 'common': return 'default'
      case 'uncommon': return 'success'
      case 'rare': return 'primary'
      case 'epic': return 'secondary'
      case 'legendary': return 'warning'
      default: return 'default'
    }
  }

  const getRarityText = (tier?: string) => {
    switch (tier) {
      case 'common': return '普通'
      case 'uncommon': return '不常见'
      case 'rare': return '稀有'
      case 'epic': return '史诗'
      case 'legendary': return '传说'
      default: return '未知'
    }
  }

  const formatPrice = (price?: number) => {
    if (!price) return '未定价'
    if (price >= 1) {
      return `${price.toFixed(2)} ETH`
    } else {
      return `${(price * 1000).toFixed(0)} GWEI`
    }
  }

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handleViewDetails = (nft: any) => {
    setSelectedNFT(nft)
    setIsDetailModalOpen(true)
  }

  if (tokens.length === 0) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-semibold mb-2">暂无NFT</h3>
          <p className="text-gray-600">当前没有可用的NFT</p>
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
              placeholder="搜索NFT名称或描述..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            <Select
              placeholder="选择收藏品"
              selectedKeys={[collectionFilter]}
              onSelectionChange={(keys) => setCollectionFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="all" value="all">全部收藏品</SelectItem>
              {Array.from(new Set(tokens.map(token => token.collection.id))).map(collectionId => {
                const collection = tokens.find(token => token.collection.id === collectionId)?.collection
                return (
                  <SelectItem key={collectionId} value={collectionId}>
                    {collection?.name || collectionId}
                  </SelectItem>
                )
              })}
            </Select>
            
            <Select
              placeholder="价格范围"
              selectedKeys={[priceFilter]}
              onSelectionChange={(keys) => setPriceFilter(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="all" value="all">全部价格</SelectItem>
              <SelectItem key="under1" value="under1">低于 1 ETH</SelectItem>
              <SelectItem key="1to10" value="1to10">1-10 ETH</SelectItem>
              <SelectItem key="over10" value="over10">高于 10 ETH</SelectItem>
            </Select>
            
            <Select
              placeholder="排序方式"
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="price" value="price">按价格排序</SelectItem>
              <SelectItem key="rarity" value="rarity">按稀有度排序</SelectItem>
              <SelectItem key="recent" value="recent">按时间排序</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* NFT列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredTokens.map((nft) => (
          <Card key={nft.id} className="w-full">
            <CardBody className="p-0">
              <div className="relative">
                <Image
                  src={nft.image}
                  alt={nft.name}
                  className="w-full h-48 object-cover"
                  fallbackSrc="https://via.placeholder.com/300x300?text=NFT"
                />
                {nft.rarity && (
                  <Chip
                    color={getRarityColor(nft.rarity.tier)}
                    size="sm"
                    className="absolute top-2 right-2"
                  >
                    {getRarityText(nft.rarity.tier)}
                  </Chip>
                )}
                {nft.listed && (
                  <Chip
                    color="success"
                    size="sm"
                    className="absolute top-2 left-2"
                  >
                    在售
                  </Chip>
                )}
              </div>
              
              <div className="p-4 space-y-3">
                <div>
                  <h4 className="font-semibold truncate">{nft.name}</h4>
                  <p className="text-sm text-gray-600 truncate">{nft.collection.name}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">价格</span>
                  <span className="font-bold text-green-600">{formatPrice(nft.price)}</span>
                </div>
                
                {nft.lastSale && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">上次售价</span>
                    <span className="font-semibold">{formatPrice(nft.lastSale.price)}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">创建时间</span>
                  <span className="text-sm">{formatTime(nft.createdAt)}</span>
                </div>

                {nft.attributes && nft.attributes.length > 0 && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">属性</p>
                    <div className="flex flex-wrap gap-1">
                      {nft.attributes.slice(0, 3).map((attr: any, index: number) => (
                        <Chip key={index} size="sm" variant="flat">
                          {attr.trait_type}: {attr.value}
                        </Chip>
                      ))}
                      {nft.attributes.length > 3 && (
                        <Chip size="sm" variant="flat" color="default">
                          +{nft.attributes.length - 3}
                        </Chip>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    className="flex-1"
                    onPress={() => handleViewDetails(nft)}
                  >
                    查看详情
                  </Button>
                  <Button
                    size="sm"
                    color="secondary"
                    variant="flat"
                    className="flex-1"
                    onPress={() => onTransfer(nft)}
                  >
                    转移
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredTokens.length === 0 && (
        <Card>
          <CardBody className="text-center p-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">未找到匹配的NFT</h3>
            <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
          </CardBody>
        </Card>
      )}

      {/* NFT详情模态框 */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader>NFT详情</ModalHeader>
          <ModalBody>
            {selectedNFT && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1">
                    <Image
                      src={selectedNFT.image}
                      alt={selectedNFT.name}
                      className="w-full h-64 object-cover rounded-lg"
                      fallbackSrc="https://via.placeholder.com/400x400?text=NFT"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <div>
                      <h3 className="text-2xl font-bold">{selectedNFT.name}</h3>
                      <p className="text-gray-600">{selectedNFT.collection.name}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">描述</h4>
                      <p className="text-gray-600">{selectedNFT.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-gray-600">价格</span>
                        <div className="font-bold text-green-600">{formatPrice(selectedNFT.price)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">所有者</span>
                        <div className="font-semibold">{selectedNFT.owner.slice(0, 6)}...{selectedNFT.owner.slice(-4)}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">Token ID</span>
                        <div className="font-semibold">{selectedNFT.tokenId}</div>
                      </div>
                      <div>
                        <span className="text-sm text-gray-600">合约地址</span>
                        <div className="font-semibold text-xs">{selectedNFT.collection.contractAddress.slice(0, 6)}...{selectedNFT.collection.contractAddress.slice(-4)}</div>
                      </div>
                    </div>
                    
                    {selectedNFT.rarity && (
                      <div>
                        <h4 className="font-semibold mb-2">稀有度</h4>
                        <div className="flex items-center gap-2">
                          <Chip color={getRarityColor(selectedNFT.rarity.tier)}>
                            {getRarityText(selectedNFT.rarity.tier)}
                          </Chip>
                          <span className="text-sm text-gray-600">
                            排名: #{selectedNFT.rarity.rank} | 分数: {selectedNFT.rarity.score}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedNFT.attributes && selectedNFT.attributes.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">属性</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedNFT.attributes.map((attr: any, index: number) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <div className="text-sm text-gray-600">{attr.trait_type}</div>
                          <div className="font-semibold">{attr.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsDetailModalOpen(false)}>
              关闭
            </Button>
            <Button color="primary" onPress={() => onTransfer(selectedNFT)}>
              转移NFT
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
