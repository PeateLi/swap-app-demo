'use client'

import React from 'react'
import { Button, Spinner } from '@heroui/react'
import { useModuleOAuth } from '../../hooks/useOAuth'

interface OAuthButtonProps {
  module: string
  provider?: string
  children?: React.ReactNode
  className?: string
  color?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger'
  variant?: 'solid' | 'bordered' | 'light' | 'flat' | 'faded' | 'shadow' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function OAuthButton({
  module,
  provider = 'default',
  children,
  className,
  color = 'primary',
  variant = 'solid',
  size = 'md',
  onSuccess,
  onError
}: OAuthButtonProps) {
  const { 
    isModuleAuthenticated, 
    isModuleLoading, 
    moduleError, 
    loginToModule,
    logoutFromModule 
  } = useModuleOAuth(module)

  const handleClick = async () => {
    try {
      if (isModuleAuthenticated) {
        logoutFromModule()
      } else {
        await loginToModule(provider)
        onSuccess?.()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '操作失败'
      onError?.(errorMessage)
    }
  }

  const getButtonText = () => {
    if (isModuleLoading) return '授权中...'
    if (isModuleAuthenticated) return '已授权'
    return children || `授权 ${module} 模块`
  }

  return (
    <Button
      color={isModuleAuthenticated ? 'success' : color}
      variant={isModuleAuthenticated ? 'bordered' : variant}
      size={size}
      className={className}
      onPress={handleClick}
      isDisabled={isModuleLoading}
      startContent={isModuleLoading ? <Spinner size="sm" /> : undefined}
    >
      {getButtonText()}
    </Button>
  )
}

// 模块状态指示器组件
interface ModuleStatusProps {
  module: string
  showDetails?: boolean
}

export function ModuleStatus({ module, showDetails = false }: ModuleStatusProps) {
  const { isModuleAuthenticated, isModuleLoading, moduleError } = useModuleOAuth(module)

  if (isModuleLoading) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Spinner size="sm" />
        <span>授权中...</span>
      </div>
    )
  }

  if (moduleError) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <span className="text-red-500">⚠️</span>
        <span>授权失败: {moduleError}</span>
      </div>
    )
  }

  if (isModuleAuthenticated) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <span className="text-green-500">✅</span>
        <span>{module} 模块已授权</span>
        {showDetails && (
          <span className="text-xs text-gray-500">(点击重新授权)</span>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-gray-500">
      <span className="text-gray-400">⭕</span>
      <span>{module} 模块未授权</span>
    </div>
  )
}
