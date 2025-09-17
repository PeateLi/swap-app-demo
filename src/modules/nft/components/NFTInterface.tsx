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
  Spinner,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  Select,
  SelectItem,
  Image
} from '@heroui/react'
import { useNFTData } from '../hooks/useNFTData'
import { CollectionsList } from './CollectionsList'
import { NFTMarketplace } from './NFTMarketplace'
import { NFTCreator } from './NFTCreator'

export function NFTInterface() {
  const [selectedTab, setSelectedTab] = useState('marketplace')
  const [selectedNFT, setSelectedNFT] = useState<any>(null)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false)
  const [transferTo, setTransferTo] = useState('')
  const [isMintModalOpen, setIsMintModalOpen] = useState(false)
  const [mintData, setMintData] = useState({
    name: '',
    description: '',
    image: '',
    attributes: []
  })

  const {
    collections,
    tokens,
    myTokens,
    creators,
    loading,
    error,
    isModuleAuthenticated,
    transferNFT,
    mintNFT,
    hasPermission
  } = useNFTData()

  const handleTransfer = async () => {
    if (!selectedNFT || !transferTo) return

    const result = await transferNFT(selectedNFT.id, transferTo)
    if (result) {
      setIsTransferModalOpen(false)
      setTransferTo('')
      setSelectedNFT(null)
    }
  }

  const handleMint = async () => {
    if (!mintData.name || !mintData.description) return

    // 这里需要选择收藏品，简化处理
    const collectionId = collections[0]?.id
    if (!collectionId) return

    const result = await mintNFT(collectionId, mintData)
    if (result) {
      setIsMintModalOpen(false)
      setMintData({ name: '', description: '', image: '', attributes: [] })
    }
  }

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

  if (!isModuleAuthenticated) {
    return (
      <Card>
        <CardBody className="text-center p-8">
          <div className="text-6xl mb-4">🔐</div>
          <h3 className="text-xl font-semibold mb-2">需要授权</h3>
          <p className="text-gray-600 mb-4">
            请先授权NFT模块以使用市场交易、铸造等功能
          </p>
        </CardBody>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">加载NFT数据中...</span>
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
            <div className="text-2xl font-bold text-blue-600">{collections.length}</div>
            <div className="text-sm text-gray-600">收藏品</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-green-600">{tokens.length}</div>
            <div className="text-sm text-gray-600">NFT代币</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-purple-600">{myTokens.length}</div>
            <div className="text-sm text-gray-600">我的NFT</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-2xl font-bold text-orange-600">{creators.length}</div>
            <div className="text-sm text-gray-600">创作者</div>
          </CardBody>
        </Card>
      </div>

      {/* 主要功能区域 */}
      <Tabs 
        selectedKey={selectedTab} 
        onSelectionChange={(key) => setSelectedTab(key as string)}
        className="w-full"
      >
        <Tab key="marketplace" title="🛒 市场">
          <NFTMarketplace 
            tokens={tokens}
            onTransfer={(nft) => {
              setSelectedNFT(nft)
              setIsTransferModalOpen(true)
            }}
          />
        </Tab>

        <Tab key="collections" title="📚 收藏品">
          <CollectionsList collections={collections} />
        </Tab>

        <Tab key="my-nfts" title="🎨 我的NFT">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">我的NFT收藏</h3>
              <Button
                color="primary"
                onPress={() => setIsMintModalOpen(true)}
                isDisabled={!hasPermission('manage:collections')}
              >
                铸造NFT
              </Button>
            </div>
            
            {myTokens.length === 0 ? (
              <Card>
                <CardBody className="text-center p-8">
                  <div className="text-4xl mb-4">🎨</div>
                  <h3 className="text-lg font-semibold mb-2">暂无NFT</h3>
                  <p className="text-gray-600 mb-4">您还没有任何NFT</p>
                  <Button
                    color="primary"
                    onPress={() => setIsMintModalOpen(true)}
                    isDisabled={!hasPermission('manage:collections')}
                  >
                    铸造第一个NFT
                  </Button>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {myTokens.map((nft) => (
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
                      </div>
                      
                      <div className="p-4 space-y-2">
                        <h4 className="font-semibold truncate">{nft.name}</h4>
                        <p className="text-sm text-gray-600 truncate">{nft.collection.name}</p>
                        
                        {nft.price && (
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">价格:</span>
                            <span className="font-bold text-green-600">{nft.price} ETH</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            color="primary"
                            variant="flat"
                            className="flex-1"
                            onPress={() => {
                              setSelectedNFT(nft)
                              setIsTransferModalOpen(true)
                            }}
                          >
                            转移
                          </Button>
                          <Button
                            size="sm"
                            color="secondary"
                            variant="flat"
                            className="flex-1"
                          >
                            详情
                          </Button>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </Tab>

        <Tab key="create" title="✨ 创作">
          <NFTCreator 
            collections={collections}
            onMint={mintNFT}
          />
        </Tab>
      </Tabs>

      {/* 转移NFT模态框 */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)}>
        <ModalContent>
          <ModalHeader>转移NFT</ModalHeader>
          <ModalBody>
            {selectedNFT && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Image
                    src={selectedNFT.image}
                    alt={selectedNFT.name}
                    className="w-16 h-16 object-cover rounded-lg"
                    fallbackSrc="https://via.placeholder.com/64x64?text=NFT"
                  />
                  <div>
                    <h4 className="font-semibold">{selectedNFT.name}</h4>
                    <p className="text-sm text-gray-600">{selectedNFT.collection.name}</p>
                  </div>
                </div>

                <Input
                  label="接收地址"
                  placeholder="0x..."
                  value={transferTo}
                  onChange={(e) => setTransferTo(e.target.value)}
                />
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsTransferModalOpen(false)}>
              取消
            </Button>
            <Button 
              color="primary" 
              onPress={handleTransfer}
              isDisabled={!transferTo}
            >
              确认转移
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* 铸造NFT模态框 */}
      <Modal isOpen={isMintModalOpen} onClose={() => setIsMintModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader>铸造NFT</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Input
                label="NFT名称"
                placeholder="输入NFT名称"
                value={mintData.name}
                onChange={(e) => setMintData({...mintData, name: e.target.value})}
              />
              
              <Textarea
                label="描述"
                placeholder="输入NFT描述"
                value={mintData.description}
                onChange={(e) => setMintData({...mintData, description: e.target.value})}
              />
              
              <Input
                label="图片URL"
                placeholder="输入图片URL"
                value={mintData.image}
                onChange={(e) => setMintData({...mintData, image: e.target.value})}
              />
              
              <Select
                label="选择收藏品"
                placeholder="选择要铸造到的收藏品"
              >
                {collections.map((collection) => (
                  <SelectItem key={collection.id} value={collection.id}>
                    {collection.name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsMintModalOpen(false)}>
              取消
            </Button>
            <Button 
              color="primary" 
              onPress={handleMint}
              isDisabled={!mintData.name || !mintData.description}
            >
              铸造NFT
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
