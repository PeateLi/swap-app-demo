'use client'

import React, { useState, useEffect } from 'react'
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Chip,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Switch,
  Divider,
  Spinner,
  Progress
} from '@heroui/react'
import { moduleRegistry } from '../../core/ModuleRegistry'
import { OAuthButton, ModuleStatus } from '../OAuth/OAuthButton'
import { OAuthModal } from '../OAuth/OAuthModal'

interface ModuleManagerProps {
  className?: string
}

export function ModuleManager({ className }: ModuleManagerProps) {
  const [modules, setModules] = useState(moduleRegistry.getAllModules())
  const [selectedModule, setSelectedModule] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 刷新模块列表
  const refreshModules = () => {
    setModules(moduleRegistry.getAllModules())
  }

  // 切换模块启用状态
  const toggleModule = (moduleId: string, enabled: boolean) => {
    moduleRegistry.toggleModule(moduleId, enabled)
    refreshModules()
  }

  // 打开模块授权模态框
  const openAuthModal = (moduleId: string) => {
    setSelectedModule(moduleId)
    setIsModalOpen(true)
  }

  // 关闭模态框
  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedModule(null)
  }

  // 获取模块状态颜色
  const getModuleStatusColor = (module: any) => {
    if (!module.enabled) return 'default'
    return 'success'
  }

  // 获取模块状态文本
  const getModuleStatusText = (module: any) => {
    if (!module.enabled) return '已禁用'
    return '已启用'
  }

  // 检查模块依赖
  const checkModuleDependencies = (moduleId: string) => {
    return moduleRegistry.checkDependencies(moduleId)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">模块管理</h2>
        <Button
          color="primary"
          variant="light"
          onPress={refreshModules}
          isLoading={isLoading}
        >
          刷新
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => {
          const dependencies = checkModuleDependencies(module.id)
          
          return (
            <Card key={module.id} className="w-full">
              <CardHeader className="flex flex-col gap-2">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{module.icon}</span>
                    <h3 className="text-lg font-semibold">{module.name}</h3>
                  </div>
                  <Chip
                    color={getModuleStatusColor(module)}
                    size="sm"
                    variant="flat"
                  >
                    {getModuleStatusText(module)}
                  </Chip>
                </div>
                <p className="text-sm text-gray-600">{module.description}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">版本: {module.version}</span>
                  <Chip size="sm" variant="flat" color="secondary">
                    {module.category}
                  </Chip>
                </div>
              </CardHeader>

              <CardBody className="space-y-4">
                {/* 权限列表 */}
                <div>
                  <h4 className="text-sm font-medium mb-2">所需权限</h4>
                  <div className="flex flex-wrap gap-1">
                    {module.permissions.slice(0, 3).map((permission, index) => (
                      <Chip key={index} size="sm" variant="flat">
                        {permission}
                      </Chip>
                    ))}
                    {module.permissions.length > 3 && (
                      <Chip size="sm" variant="flat" color="default">
                        +{module.permissions.length - 3}
                      </Chip>
                    )}
                  </div>
                </div>

                {/* 依赖检查 */}
                {!dependencies.satisfied && (
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>缺少依赖:</strong> {dependencies.missing.join(', ')}
                    </p>
                  </div>
                )}

                {/* 模块状态 */}
                <ModuleStatus module={module.id} showDetails={true} />

                <Divider />

                {/* 操作按钮 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      isSelected={module.enabled}
                      onValueChange={(enabled) => toggleModule(module.id, enabled)}
                      size="sm"
                    />
                    <span className="text-sm">启用模块</span>
                  </div>
                  
                  {module.enabled && (
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => openAuthModal(module.id)}
                    >
                      授权
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>

      {/* 模块授权模态框 */}
      {selectedModule && (
        <OAuthModal
          isOpen={isModalOpen}
          onClose={closeModal}
          module={selectedModule}
          title={modules.find(m => m.id === selectedModule)?.name}
          description={modules.find(m => m.id === selectedModule)?.description}
          permissions={modules.find(m => m.id === selectedModule)?.permissions || []}
          onSuccess={() => {
            closeModal()
            refreshModules()
          }}
        />
      )}
    </div>
  )
}

// 模块仪表板组件
export function ModuleDashboard() {
  const [modules, setModules] = useState(moduleRegistry.getAllModules())
  const [enabledModules, setEnabledModules] = useState(moduleRegistry.getEnabledModules())

  useEffect(() => {
    setModules(moduleRegistry.getAllModules())
    setEnabledModules(moduleRegistry.getEnabledModules())
  }, [])

  const moduleStats = {
    total: modules.length,
    enabled: enabledModules.length,
    categories: modules.reduce((acc, module) => {
      acc[module.category] = (acc[module.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">模块仪表板</h2>
      
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-blue-600">{moduleStats.total}</div>
            <div className="text-sm text-gray-600">总模块数</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-green-600">{moduleStats.enabled}</div>
            <div className="text-sm text-gray-600">已启用</div>
          </CardBody>
        </Card>
        
        <Card>
          <CardBody className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {Math.round((moduleStats.enabled / moduleStats.total) * 100)}%
            </div>
            <div className="text-sm text-gray-600">启用率</div>
          </CardBody>
        </Card>
      </div>

      {/* 分类统计 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">模块分类</h3>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(moduleStats.categories).map(([category, count]) => (
              <div key={category} className="text-center">
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{category}</div>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* 最近启用的模块 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">已启用模块</h3>
        </CardHeader>
        <CardBody>
          <div className="space-y-3">
            {enabledModules.map((module) => (
              <div key={module.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{module.icon}</span>
                  <div>
                    <div className="font-medium">{module.name}</div>
                    <div className="text-sm text-gray-600">{module.description}</div>
                  </div>
                </div>
                <ModuleStatus module={module.id} />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
