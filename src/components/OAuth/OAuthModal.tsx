'use client'

import React, { useState } from 'react'
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Card,
  CardBody,
  Divider,
  Chip,
  Spinner,
  Progress
} from '@heroui/react'
import { useModuleOAuth } from '../../hooks/useOAuth'

interface OAuthModalProps {
  isOpen: boolean
  onClose: () => void
  module: string
  provider?: string
  title?: string
  description?: string
  permissions?: string[]
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function OAuthModal({
  isOpen,
  onClose,
  module,
  provider = 'default',
  title,
  description,
  permissions = [],
  onSuccess,
  onError
}: OAuthModalProps) {
  const {
    isModuleAuthenticated,
    isModuleLoading,
    moduleError,
    loginToModule,
    hasModulePermission
  } = useModuleOAuth(module)

  const [currentStep, setCurrentStep] = useState(0)
  const [grantedPermissions, setGrantedPermissions] = useState<string[]>([])

  const steps = [
    { title: '模块介绍', description: '了解模块功能' },
    { title: '权限说明', description: '查看所需权限' },
    { title: '授权确认', description: '确认授权信息' },
    { title: '授权完成', description: '开始使用模块' }
  ]

  const handleStartAuth = async () => {
    try {
      setCurrentStep(1)
      await loginToModule(provider)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '授权失败'
      onError?.(errorMessage)
    }
  }

  const handlePermissionGrant = (permission: string) => {
    setGrantedPermissions(prev => [...prev, permission])
  }

  const getStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold mb-2">
                  {title || `${module} 模块`}
                </h3>
                <p className="text-gray-600">
                  {description || `授权访问 ${module} 模块，享受更多功能和服务。`}
                </p>
              </CardBody>
            </Card>
            
            <div className="space-y-2">
              <h4 className="font-medium">模块功能：</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>安全的代币交易</li>
                <li>实时价格查询</li>
                <li>交易历史记录</li>
                <li>个性化推荐</li>
              </ul>
            </div>
          </div>
        )

      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">权限说明</h3>
            <p className="text-gray-600">
              为了提供更好的服务，我们需要以下权限：
            </p>
            
            <div className="space-y-3">
              {permissions.map((permission, index) => (
                <Card key={index} className="border">
                  <CardBody className="py-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{permission}</h4>
                        <p className="text-sm text-gray-500">
                          {getPermissionDescription(permission)}
                        </p>
                      </div>
                      <Chip
                        color={hasModulePermission(permission) ? 'success' : 'default'}
                        size="sm"
                      >
                        {hasModulePermission(permission) ? '已授权' : '需要授权'}
                      </Chip>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">授权确认</h3>
            
            {isModuleLoading ? (
              <div className="text-center py-8">
                <Spinner size="lg" />
                <p className="mt-4">正在处理授权请求...</p>
              </div>
            ) : moduleError ? (
              <div className="text-center py-8">
                <p className="text-red-500 mb-4">授权失败: {moduleError}</p>
                <Button color="primary" onPress={handleStartAuth}>
                  重试
                </Button>
              </div>
            ) : isModuleAuthenticated ? (
              <div className="text-center py-8">
                <div className="text-green-500 text-6xl mb-4">✅</div>
                <h4 className="text-xl font-semibold text-green-600 mb-2">
                  授权成功！
                </h4>
                <p className="text-gray-600">
                  {module} 模块已成功授权，您现在可以使用所有功能了。
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <Card>
                  <CardBody>
                    <h4 className="font-semibold mb-2">授权摘要</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>模块名称:</span>
                        <span className="font-medium">{module}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>授权提供商:</span>
                        <span className="font-medium">{provider}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>所需权限:</span>
                        <span className="font-medium">{permissions.length} 项</span>
                      </div>
                    </div>
                  </CardBody>
                </Card>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>注意：</strong> 授权后，您可以在设置中随时撤销权限。
                  </p>
                </div>
              </div>
            )}
          </div>
        )

      default:
        return null
    }
  }

  const getPermissionDescription = (permission: string) => {
    const descriptions: Record<string, string> = {
      'read:wallet': '读取钱包地址和余额信息',
      'write:transaction': '创建和发送交易',
      'read:history': '查看交易历史记录',
      'manage:settings': '管理模块设置和偏好',
      'api:access': '访问外部API服务'
    }
    return descriptions[permission] || '模块功能权限'
  }

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      onSuccess?.()
      onClose()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const canProceed = () => {
    if (currentStep === 0) return true
    if (currentStep === 1) return true
    if (currentStep === 2) return isModuleAuthenticated || moduleError
    return false
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">
            {steps[currentStep].title}
          </h2>
          <p className="text-sm text-gray-500">
            {steps[currentStep].description}
          </p>
        </ModalHeader>
        
        <ModalBody>
          <div className="mb-4">
            <Progress
              value={(currentStep / (steps.length - 1)) * 100}
              className="w-full"
              color="primary"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              {steps.map((step, index) => (
                <span
                  key={index}
                  className={index <= currentStep ? 'text-primary' : 'text-gray-400'}
                >
                  {step.title}
                </span>
              ))}
            </div>
          </div>
          
          <Divider />
          
          {getStepContent()}
        </ModalBody>
        
        <ModalFooter>
          <div className="flex justify-between w-full">
            <Button
              variant="light"
              onPress={handleBack}
              isDisabled={currentStep === 0}
            >
              上一步
            </Button>
            
            <div className="flex gap-2">
              <Button variant="light" onPress={onClose}>
                取消
              </Button>
              <Button
                color="primary"
                onPress={currentStep === 0 ? handleStartAuth : handleNext}
                isDisabled={!canProceed()}
                isLoading={isModuleLoading}
              >
                {currentStep === 0 ? '开始授权' : 
                 currentStep === steps.length - 1 ? '完成' : '下一步'}
              </Button>
            </div>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
