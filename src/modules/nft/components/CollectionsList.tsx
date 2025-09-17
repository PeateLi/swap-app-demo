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
  Divider
} from '@heroui/react'

interface CollectionsListProps {
  collections: any[]
}

export function CollectionsList({ collections }: CollectionsListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState('volume24h')

  const filteredCollections = collections.filter(collection => {
    const matchesSearch = collection.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         collection.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || collection.category === categoryFilter
    return matchesSearch && matchesCategory
  }).sort((a, b) => {
    switch (sortBy) {
      case 'volume24h':
        return b.volume24h - a.volume24h
      case 'volume7d':
        return b.volume7d - a.volume7d
      case 'volume30d':
        return b.volume30d - a.volume30d
      case 'floorPrice':
        return b.floorPrice - a.floorPrice
      case 'totalSupply':
        return b.totalSupply - a.totalSupply
      default:
        return 0
    }
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'art': return '🎨'
      case 'gaming': return '🎮'
      case 'music': return '🎵'
      case 'sports': return '⚽'
      case 'collectibles': return '📦'
      case 'utility': return '🔧'
      default: return '🎭'
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

  const formatPrice = (price: number) => {
    if (price >= 1) {
      return `${price.toFixed(2)} ETH`
    } else {
      return `${(price * 1000).toFixed(0)} GWEI`
    }
  }

  if (collections.length === 0) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <div className="text-4xl mb-4">📚</div>
          <h3 className="text-lg font-semibold mb-2">暂无收藏品</h3>
          <p className="text-gray-600">当前没有可用的收藏品</p>
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
              placeholder="搜索收藏品名称或描述..."
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
              <SelectItem key="art" value="art">🎨 艺术</SelectItem>
              <SelectItem key="gaming" value="gaming">🎮 游戏</SelectItem>
              <SelectItem key="music" value="music">🎵 音乐</SelectItem>
              <SelectItem key="sports" value="sports">⚽ 体育</SelectItem>
              <SelectItem key="collectibles" value="collectibles">📦 收藏品</SelectItem>
              <SelectItem key="utility" value="utility">🔧 实用工具</SelectItem>
            </Select>
            
            <Select
              placeholder="排序方式"
              selectedKeys={[sortBy]}
              onSelectionChange={(keys) => setSortBy(Array.from(keys)[0] as string)}
              className="w-full md:w-48"
            >
              <SelectItem key="volume24h" value="volume24h">24h交易量</SelectItem>
              <SelectItem key="volume7d" value="volume7d">7天交易量</SelectItem>
              <SelectItem key="volume30d" value="volume30d">30天交易量</SelectItem>
              <SelectItem key="floorPrice" value="floorPrice">地板价</SelectItem>
              <SelectItem key="totalSupply" value="totalSupply">总供应量</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* 收藏品列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCollections.map((collection) => (
          <Card key={collection.id} className="w-full">
            <CardBody className="p-0">
              {/* 横幅图片 */}
              <div className="relative h-32 overflow-hidden">
                <Image
                  src={collection.bannerImage || collection.image}
                  alt={collection.name}
                  className="w-full h-full object-cover"
                  fallbackSrc="https://via.placeholder.com/400x128?text=Collection"
                />
                <div className="absolute top-2 right-2">
                  {collection.verified && (
                    <Chip size="sm" color="success" variant="flat">
                      ✓ 已验证
                    </Chip>
                  )}
                </div>
              </div>

              <div className="p-4 space-y-4">
                {/* 收藏品信息 */}
                <div className="flex items-start gap-3">
                  <Image
                    src={collection.image}
                    alt={collection.name}
                    className="w-12 h-12 object-cover rounded-lg"
                    fallbackSrc="https://via.placeholder.com/48x48?text=Logo"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold truncate">{collection.name}</h3>
                    <p className="text-sm text-gray-600 truncate">{collection.symbol}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip size="sm" variant="flat" color="primary">
                        {getCategoryIcon(collection.category)} {collection.category}
                      </Chip>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2">{collection.description}</p>

                <Divider />

                {/* 统计数据 */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">地板价</span>
                    <div className="font-semibold">{formatPrice(collection.floorPrice)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">总供应量</span>
                    <div className="font-semibold">{formatNumber(collection.totalSupply)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">持有者</span>
                    <div className="font-semibold">{formatNumber(collection.owners)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">已上架</span>
                    <div className="font-semibold">{formatNumber(collection.listed)}</div>
                  </div>
                </div>

                <Divider />

                {/* 交易量统计 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">24h交易量</span>
                    <span className="font-semibold">{formatNumber(collection.volume24h)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">7天交易量</span>
                    <span className="font-semibold">{formatNumber(collection.volume7d)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">30天交易量</span>
                    <span className="font-semibold">{formatNumber(collection.volume30d)} ETH</span>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <Button 
                    color="primary" 
                    variant="flat"
                    className="flex-1"
                    size="sm"
                  >
                    查看详情
                  </Button>
                  <Button 
                    color="secondary" 
                    variant="flat"
                    className="flex-1"
                    size="sm"
                  >
                    浏览NFT
                  </Button>
                </div>

                {/* 社交媒体链接 */}
                {(collection.website || collection.twitter || collection.discord) && (
                  <div className="flex gap-2 pt-2">
                    {collection.website && (
                      <Button size="sm" variant="light" color="primary">
                        🌐 网站
                      </Button>
                    )}
                    {collection.twitter && (
                      <Button size="sm" variant="light" color="primary">
                        🐦 Twitter
                      </Button>
                    )}
                    {collection.discord && (
                      <Button size="sm" variant="light" color="primary">
                        💬 Discord
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {filteredCollections.length === 0 && (
        <Card>
          <CardBody className="text-center p-8">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold mb-2">未找到匹配的收藏品</h3>
            <p className="text-gray-600">尝试调整搜索条件或筛选器</p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}
