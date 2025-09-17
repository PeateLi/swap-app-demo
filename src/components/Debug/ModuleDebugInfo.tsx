'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardBody, CardHeader, Button, Code } from '@heroui/react'
import { moduleRegistry } from '../../core/ModuleRegistry'

export function ModuleDebugInfo() {
  const [modules, setModules] = useState<any[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const refreshModules = () => {
      const allModules = moduleRegistry.getAllModules()
      setModules(allModules)
    }

    refreshModules()
    
    // 每5秒刷新一次
    const interval = setInterval(refreshModules, 5000)
    return () => clearInterval(interval)
  }, [])

  if (!isVisible) {
    return (
      <Button
        size="sm"
        color="secondary"
        variant="flat"
        onPress={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
      >
        🔧 调试信息
      </Button>
    )
  }

  return (
    <Card className="fixed bottom-4 right-4 w-96 max-h-96 overflow-y-auto z-50 shadow-lg">
      <CardHeader className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">模块调试信息</h3>
        <Button
          size="sm"
          variant="light"
          onPress={() => setIsVisible(false)}
        >
          ✕
        </Button>
      </CardHeader>
      <CardBody className="space-y-2">
        <div className="text-sm">
          <strong>已注册模块数量:</strong> {modules.length}
        </div>
        
        {modules.map((module, index) => (
          <div key={module.id || index} className="border rounded p-2 text-xs">
            <div className="font-medium">
              {module.icon} {module.name} ({module.id})
            </div>
            <div className="text-gray-600">
              状态: {module.enabled ? '✅ 启用' : '❌ 禁用'}
            </div>
            <div className="text-gray-600">
              分类: {module.category}
            </div>
            <div className="text-gray-600">
              权限: {module.permissions?.length || 0} 项
            </div>
            <div className="text-gray-600">
              路由: {module.routes?.length || 0} 个
            </div>
          </div>
        ))}
        
        <div className="mt-4">
          <Button
            size="sm"
            color="primary"
            variant="flat"
            onPress={() => {
              const allModules = moduleRegistry.getAllModules()
              setModules(allModules)
            }}
          >
            刷新
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
