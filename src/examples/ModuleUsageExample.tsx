'use client'

import React from 'react'
import { Card, CardBody, CardHeader, Button, Code } from '@heroui/react'
import { useModuleOAuth } from '../hooks/useOAuth'
import { useMCPService } from '../core/MCPService'
import { OAuthButton } from '../components/OAuth/OAuthButton'

// 使用示例组件
export function ModuleUsageExample() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">模块使用示例</h2>
      
      {/* OAuth Hook 使用示例 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">1. OAuth Hook 使用</h3>
        </CardHeader>
        <CardBody>
          <CodeExample />
        </CardBody>
      </Card>

      {/* MCP服务调用示例 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">2. MCP服务调用</h3>
        </CardHeader>
        <CardBody>
          <MCPServiceExample />
        </CardBody>
      </Card>

      {/* 模块组件示例 */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">3. 模块组件使用</h3>
        </CardHeader>
        <CardBody>
          <ModuleComponentExample />
        </CardBody>
      </Card>
    </div>
  )
}

// OAuth Hook 使用示例
function CodeExample() {
  const { isModuleAuthenticated, loginToModule, hasModulePermission } = useModuleOAuth('swap')

  const handleLogin = () => {
    loginToModule('metamask')
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded-lg">
        <Code>
{`// 使用模块OAuth Hook
const { 
  isModuleAuthenticated, 
  loginToModule, 
  hasModulePermission 
} = useModuleOAuth('swap')

// 检查模块是否已认证
if (isModuleAuthenticated) {
  // 模块已认证，可以使用功能
}

// 检查权限
if (hasModulePermission('read:wallet')) {
  // 有读取钱包的权限
}

// 登录到模块
await loginToModule('metamask')`}
        </Code>
      </div>
      
      <div className="flex items-center gap-4">
        <span>状态: {isModuleAuthenticated ? '已认证' : '未认证'}</span>
        <Button onPress={handleLogin} size="sm">
          登录到Swap模块
        </Button>
      </div>
    </div>
  )
}

// MCP服务调用示例
function MCPServiceExample() {
  const { callService, isLoading, error } = useMCPService('swap')

  const handleCallService = async () => {
    try {
      const result = await callService('getTokens', {
        includePrices: true
      })
      console.log('服务调用结果:', result)
    } catch (err) {
      console.error('服务调用失败:', err)
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded-lg">
        <Code>
{`// 使用MCP服务Hook
const { callService, isLoading, error } = useMCPService('swap')

// 调用服务方法
const result = await callService('getTokens', {
  includePrices: true,
  includeBalances: true
})

// 处理结果
if (result.success) {
  console.log('数据:', result.data)
} else {
  console.error('错误:', result.error)
}`}
        </Code>
      </div>
      
      <div className="flex items-center gap-4">
        <Button 
          onPress={handleCallService} 
          isLoading={isLoading}
          size="sm"
        >
          调用Swap服务
        </Button>
        {error && <span className="text-red-500">错误: {error}</span>}
      </div>
    </div>
  )
}

// 模块组件使用示例
function ModuleComponentExample() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-100 p-4 rounded-lg">
        <Code>
{`// 使用OAuth按钮组件
<OAuthButton 
  module="swap"
  provider="metamask"
  onSuccess={() => console.log('授权成功')}
  onError={(error) => console.error('授权失败:', error)}
>
  授权Swap模块
</OAuthButton>

// 使用模块状态组件
<ModuleStatus 
  module="swap" 
  showDetails={true} 
/>

// 使用OAuth模态框
<OAuthModal
  isOpen={isOpen}
  onClose={onClose}
  module="swap"
  permissions={['read:wallet', 'write:transaction']}
  onSuccess={() => console.log('授权完成')}
/>`}
        </Code>
      </div>
      
      <div className="flex items-center gap-4">
        <OAuthButton module="swap" size="sm">
          授权Swap模块
        </OAuthButton>
        <OAuthButton module="defi" size="sm">
          授权DeFi模块
        </OAuthButton>
        <OAuthButton module="nft" size="sm">
          授权NFT模块
        </OAuthButton>
      </div>
    </div>
  )
}
