"use client";

import React from "react";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useCopilotAction } from "@copilotkit/react-core";
import { useAtom } from 'jotai'
import { Card, CardBody, Spinner } from '@heroui/react'
import TokenSelector from '../components/TokenSelector'
import ExchangePlansSelector from '../components/ExchangePlansSelector'
import { loadingAtom, errorAtom } from '../store/tokenStore'

export default function YourApp() {
  const [loading] = useAtom(loadingAtom)
  const [error] = useAtom(errorAtom)

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
              💱 代币兑换平台
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              安全、快速、低手续费的代币兑换服务
            </p>
            
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
        </div>
      </div>
      
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
