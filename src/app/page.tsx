"use client";

import React, { useEffect, useState } from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { useAtom } from 'jotai'
import { Card, CardBody, Spinner, Tabs, Tab } from '@heroui/react'
import TokenSelector from '../components/TokenSelector'
import ExchangePlansSelector from '../components/ExchangePlansSelector'
import { ModuleManager, ModuleDashboard } from '../components/ModuleManager/ModuleManager'
import { OAuthButton, ModuleStatus } from '../components/OAuth/OAuthButton'
import { ModuleDebugInfo } from '../components/Debug/ModuleDebugInfo'
import { DeFiInterface } from '../modules/defi/components/DeFiInterface'
import { NFTInterface } from '../modules/nft/components/NFTInterface'
import { useOAuth } from '../hooks/useOAuth'
import { moduleRegistry } from '../core/ModuleRegistry'
import { testModuleConfig } from '../modules/test/testModule'
import { swapModuleConfig } from '../modules/swap/swapModule'
import { defiModuleConfig } from '../modules/defi/defiModule'
import { nftModuleConfig } from '../modules/nft/nftModule'
import { loadingAtom, errorAtom } from '../store/tokenStore'

export default function YourApp() {
  const [loading] = useAtom(loadingAtom)
  const [error] = useAtom(errorAtom)
  const [selectedTab, setSelectedTab] = useState('swap')
  const oauth = useOAuth()

  // 初始化模块
  useEffect(() => {
    try {
      console.log('开始注册模块...')
      
      // 先注册测试模块
      if (testModuleConfig) {
        console.log('注册测试模块:', testModuleConfig.id)
        moduleRegistry.registerModule(testModuleConfig)
      } else {
        console.error('测试模块配置未定义')
      }
      
      // 检查模块配置是否存在
      if (swapModuleConfig) {
        console.log('注册Swap模块:', swapModuleConfig.id)
        moduleRegistry.registerModule(swapModuleConfig)
      } else {
        console.error('Swap模块配置未定义')
      }
      
      if (defiModuleConfig) {
        console.log('注册DeFi模块:', defiModuleConfig.id)
        moduleRegistry.registerModule(defiModuleConfig)
      } else {
        console.error('DeFi模块配置未定义')
      }
      
      if (nftModuleConfig) {
        console.log('注册NFT模块:', nftModuleConfig.id)
        moduleRegistry.registerModule(nftModuleConfig)
      } else {
        console.error('NFT模块配置未定义')
      }
      
      console.log('模块注册完成')
    } catch (error) {
      console.error('模块注册失败:', error)
    }
  }, [])

  // 处理OAuth回调
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const authSuccess = urlParams.get('auth_success')
    const authData = urlParams.get('auth_data')
    const error = urlParams.get('error')

    if (authSuccess === 'true' && authData) {
      try {
        const auth = JSON.parse(decodeURIComponent(authData))
        // 这里应该调用OAuth provider的方法来处理认证数据
        console.log('OAuth认证成功:', auth)
        // 清理URL参数
        window.history.replaceState({}, document.title, window.location.pathname)
      } catch (err) {
        console.error('解析认证数据失败:', err)
      }
    }

    if (error) {
      console.error('OAuth认证失败:', error)
      // 清理URL参数
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  // 代币列表获取
  useCopilotAction({
    name: "get_token_list",
    description: "获取可用的代币列表，用于代币兑换选择。",
    available: "disabled",
    render: ({status, result}: {status: string, result: any}) => {
      return (
        <div className="mt-4">
          {status !== "complete" && (
            <Card>
              <CardBody className="text-center p-8">
                <Spinner size="lg" />
                <p className="mt-2">正在获取代币列表...</p>
              </CardBody>
            </Card>
          )}
          {status === "complete" && result && (
            <TokenSelector data={typeof result === 'string' ? JSON.parse(result) : result} />
          )}
        </div>
      );
    },
  });

  // 兑换方案获取
  useCopilotAction({
    name: "get_exchange_plans",
    description: "根据用户需求生成多种兑换方案，让用户选择最优方案。",
    available: "disabled",
    render: ({status, result}: {status: string, result: any}) => {
      return (
        <div className="mt-4">
          {status !== "complete" && (
            <Card>
              <CardBody className="text-center p-8">
                <Spinner size="lg" />
                <p className="mt-2">正在生成兑换方案...</p>
              </CardBody>
            </Card>
          )}
          {status === "complete" && result && (
            <ExchangePlansSelector data={typeof result === 'string' ? JSON.parse(result) : result} />
          )}
        </div>
      );
    },
  });

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
              🚀 模块化DeFi平台
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              安全、快速、可扩展的区块链金融服务
            </p>

            {/* 用户认证状态 */}
            {oauth.isAuthenticated && (
              <Card className="max-w-md mx-auto mb-6">
                <CardBody className="text-center p-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-green-500">✅</span>
                    <span className="font-medium">已登录</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    欢迎, {oauth.user?.name || oauth.user?.email}
                  </p>
                  {oauth.currentModule && (
                    <p className="text-xs text-blue-600">
                      当前模块: {oauth.currentModule}
                    </p>
                  )}
                </CardBody>
              </Card>
            )}
            
            {loading && (
              <Card className="max-w-md mx-auto">
                <CardBody className="text-center p-8">
                  <Spinner size="lg" />
                  <p className="mt-2">处理中...</p>
                </CardBody>
              </Card>
            )}
            
            {error && (
              <Card className="max-w-md mx-auto">
                <CardBody className="text-center p-8">
                  <p className="text-red-500">{error}</p>
                </CardBody>
              </Card>
            )}
          </div>

          {/* 主内容区域 */}
          <div className="max-w-6xl mx-auto">
            <Tabs 
              selectedKey={selectedTab} 
              onSelectionChange={(key) => setSelectedTab(key as string)}
              className="w-full"
              classNames={{
                tabList: "w-full",
                tab: "flex-1"
              }}
            >
              <Tab key="swap" title="💱 代币兑换">
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">代币兑换</h2>
                    <div className="flex items-center gap-2">
                      <ModuleStatus module="swap" />
                      <OAuthButton module="swap" size="sm" />
                    </div>
                  </div>
                  {/* 原有的代币兑换内容 */}
                </div>
              </Tab>

              <Tab key="defi" title="🏦 DeFi服务">
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">去中心化金融</h2>
                    <div className="flex items-center gap-2">
                      <ModuleStatus module="defi" />
                      <OAuthButton module="defi" size="sm" />
                    </div>
                  </div>
                  <DeFiInterface />
                </div>
              </Tab>

              <Tab key="nft" title="🎨 NFT市场">
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">NFT市场</h2>
                    <div className="flex items-center gap-2">
                      <ModuleStatus module="nft" />
                      <OAuthButton module="nft" size="sm" />
                    </div>
                  </div>
                  <NFTInterface />
                </div>
              </Tab>

              <Tab key="modules" title="⚙️ 模块管理">
                <div className="mt-6">
                  <ModuleManager />
                </div>
              </Tab>

              <Tab key="dashboard" title="📊 仪表板">
                <div className="mt-6">
                  <ModuleDashboard />
                </div>
              </Tab>
            </Tabs>
          </div>
        </div>
      </div>
      
      {/* 调试信息组件 */}
      <ModuleDebugInfo />
      
      <CopilotSidebar
        defaultOpen={true}
        instructions={"您是一个专业的代币兑换助手。帮助用户选择代币、查看汇率、执行兑换操作，并提供详细的信息和风险评估。"}
        labels={{
          title: "代币兑换助手",
          initial: `# 💱 代币兑换助手

欢迎使用代币兑换平台！我可以帮助您：

## 🔍 查看代币列表
- 说"查看代币列表"或"显示代币"
- 查看所有可兑换的代币及其价格

## 💱 代币兑换
- 直接说"我要兑换 BTC 到 ETH"
- 或"1 BTC 换 USDT"
- 我会为您生成多种兑换方案

## ❓ 需要帮助
- 随时问我任何问题！

请告诉我您想要做什么？`,
        }}
      />
    </>
  );
}
