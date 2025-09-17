'use client'

import React, { useState } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Image,
  Chip,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter
} from '@heroui/react'

interface NFTCreatorProps {
  collections: any[]
  onMint: (collectionId: string, metadata: any) => Promise<any>
}

export function NFTCreator({ collections, onMint }: NFTCreatorProps) {
  const [selectedCollection, setSelectedCollection] = useState('')
  const [nftData, setNftData] = useState({
    name: '',
    description: '',
    image: '',
    attributes: [] as Array<{trait_type: string, value: string}>
  })
  const [newAttribute, setNewAttribute] = useState({ trait_type: '', value: '' })
  const [isMinting, setIsMinting] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  const handleAddAttribute = () => {
    if (newAttribute.trait_type && newAttribute.value) {
      setNftData({
        ...nftData,
        attributes: [...nftData.attributes, newAttribute]
      })
      setNewAttribute({ trait_type: '', value: '' })
    }
  }

  const handleRemoveAttribute = (index: number) => {
    setNftData({
      ...nftData,
      attributes: nftData.attributes.filter((_, i) => i !== index)
    })
  }

  const handleMint = async () => {
    if (!selectedCollection || !nftData.name || !nftData.description) return

    setIsMinting(true)
    try {
      const result = await onMint(selectedCollection, nftData)
      if (result) {
        // 重置表单
        setNftData({
          name: '',
          description: '',
          image: '',
          attributes: []
        })
        setSelectedCollection('')
      }
    } finally {
      setIsMinting(false)
    }
  }

  const canMint = selectedCollection && nftData.name && nftData.description

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-xl font-semibold">创建NFT</h3>
          <p className="text-gray-600">铸造您自己的非同质化代币</p>
        </CardHeader>
        <CardBody className="space-y-6">
          {/* 选择收藏品 */}
          <div>
            <label className="block text-sm font-medium mb-2">选择收藏品</label>
            <Select
              placeholder="选择要铸造到的收藏品"
              selectedKeys={selectedCollection ? [selectedCollection] : []}
              onSelectionChange={(keys) => setSelectedCollection(Array.from(keys)[0] as string)}
            >
              {collections.map((collection) => (
                <SelectItem key={collection.id} value={collection.id}>
                  <div className="flex items-center gap-2">
                    <Image
                      src={collection.image}
                      alt={collection.name}
                      className="w-6 h-6 object-cover rounded"
                      fallbackSrc="https://via.placeholder.com/24x24?text=Logo"
                    />
                    <span>{collection.name}</span>
                    {collection.verified && (
                      <Chip size="sm" color="success">✓</Chip>
                    )}
                  </div>
                </SelectItem>
              ))}
            </Select>
          </div>

          {/* NFT基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="NFT名称"
              placeholder="输入NFT名称"
              value={nftData.name}
              onChange={(e) => setNftData({...nftData, name: e.target.value})}
              isRequired
            />
            
            <Input
              label="图片URL"
              placeholder="输入图片URL"
              value={nftData.image}
              onChange={(e) => setNftData({...nftData, image: e.target.value})}
            />
          </div>

          <Textarea
            label="描述"
            placeholder="输入NFT描述"
            value={nftData.description}
            onChange={(e) => setNftData({...nftData, description: e.target.value})}
            isRequired
            minRows={3}
          />

          {/* 属性管理 */}
          <div>
            <label className="block text-sm font-medium mb-2">属性</label>
            <div className="space-y-3">
              {/* 添加属性 */}
              <div className="flex gap-2">
                <Input
                  placeholder="属性名称"
                  value={newAttribute.trait_type}
                  onChange={(e) => setNewAttribute({...newAttribute, trait_type: e.target.value})}
                  className="flex-1"
                />
                <Input
                  placeholder="属性值"
                  value={newAttribute.value}
                  onChange={(e) => setNewAttribute({...newAttribute, value: e.target.value})}
                  className="flex-1"
                />
                <Button
                  color="primary"
                  variant="flat"
                  onPress={handleAddAttribute}
                  isDisabled={!newAttribute.trait_type || !newAttribute.value}
                >
                  添加
                </Button>
              </div>

              {/* 属性列表 */}
              {nftData.attributes.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">已添加的属性:</p>
                  <div className="flex flex-wrap gap-2">
                    {nftData.attributes.map((attr, index) => (
                      <Chip
                        key={index}
                        onClose={() => handleRemoveAttribute(index)}
                        variant="flat"
                        color="primary"
                      >
                        {attr.trait_type}: {attr.value}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 预览和铸造 */}
          <Divider />
          
          <div className="flex justify-between items-center">
            <Button
              color="secondary"
              variant="flat"
              onPress={() => setIsPreviewModalOpen(true)}
              isDisabled={!nftData.name || !nftData.image}
            >
              预览NFT
            </Button>
            
            <Button
              color="primary"
              onPress={handleMint}
              isLoading={isMinting}
              isDisabled={!canMint}
            >
              {isMinting ? '铸造中...' : '铸造NFT'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* 预览模态框 */}
      <Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} size="lg">
        <ModalContent>
          <ModalHeader>NFT预览</ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <div className="text-center">
                <Image
                  src={nftData.image || 'https://via.placeholder.com/300x300?text=NFT+Preview'}
                  alt={nftData.name}
                  className="w-64 h-64 object-cover rounded-lg mx-auto"
                  fallbackSrc="https://via.placeholder.com/300x300?text=NFT+Preview"
                />
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold">{nftData.name || '未命名NFT'}</h3>
                <p className="text-gray-600">{nftData.description || '暂无描述'}</p>
              </div>
              
              {nftData.attributes.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">属性</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {nftData.attributes.map((attr, index) => (
                      <div key={index} className="p-2 border rounded text-sm">
                        <div className="text-gray-600">{attr.trait_type}</div>
                        <div className="font-semibold">{attr.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setIsPreviewModalOpen(false)}>
              关闭
            </Button>
            <Button 
              color="primary" 
              onPress={() => {
                setIsPreviewModalOpen(false)
                handleMint()
              }}
              isDisabled={!canMint}
            >
              确认铸造
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}
