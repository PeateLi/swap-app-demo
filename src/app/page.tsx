
"use client";

import React, { useState } from "react";
import { CopilotSidebar ,CopilotPopup} from "@copilotkit/react-ui"; 
import { useCoAgent, useCoAgentStateRender,useCopilotAction} from "@copilotkit/react-core";

export default function YourApp() {
  return (
    <>
    <Home/>    
    <CopilotSidebar
      defaultOpen={true}
      instructions={"您是一个专业的代币兑换助手。帮助用户选择代币、查看汇率、执行兑换操作，并提供详细的信息和风险评估。"}
      labels={{
      title: "代币兑换助手",
      initial: `# 💱 代币兑换助手

欢迎使用代币兑换平台！我可以帮助您：

- **查看代币列表**: 浏览所有可用的代币及其详细信息
- **直接兑换**: 直接说"我要兑换 1 BTC 到 ETH"获取多种兑换方案
- **选择兑换代币**: 在界面中选择源代币和目标代币
- **设置兑换参数**: 输入兑换数量并查看实时汇率
- **确认兑换**: 在确认界面中查看详细信息并确认兑换

**快速开始方式：**
1. 说"查看代币列表"浏览所有代币
2. 直接说"我要兑换 1 BTC 到 ETH"获取兑换方案
3. 在界面中选择最适合的兑换方案并确认`
      }}
    />  
    </>
  );
}

type AgentState = {
  search_history: Array<{
    query: string;
    completed: boolean;
    timestamp: string;
    tool_name?: string;
    completed_at?: string;
  }>
}

function Home() {
  
  const {state, setState} = useCoAgent<AgentState>({
    name: "sample_agent",
    initialState: {
      search_history: []
    },
  })

  useCopilotAction({
    name: "sayHello",              // Action 名称，Agent 将通过此名称来调用工具
    description: "向指定用户问好", // 对该 Action 的描述（供 Agent 理解用途）
    parameters: [                 // 定义参数列表
      { name: "name", type: "string", description: "要问好的对象名字" }
    ],
    render: "正在发送问候...",    // (可选) 执行时在Chat中显示的提示文本
    handler: async ({ name }) => { // 定义具体执行逻辑的函数（异步支持）
      alert(`Hello, ${name}!`);    // 这里在浏览器弹出提示框
      return('问候已发送给' + name); // 返回结果将显示在Chat中
      }
  });
    
  useCoAgentStateRender<AgentState>({
      name: "sample_agent", // the name the agent is served as
      render: ({ state }) => (
        <div>
          {state.search_history?.map((search, index) => (
            <div key={index}>
              {search.completed ? "✅" : "❌"} 正在执行：{search.query} {search.completed ? "" : "..."}
            </div>
          ))}
        </div>
      ),
  });

  useCopilotAction({
    name: "get_token_list",
    description: "获取可用的代币列表，用于代币兑换选择。",
    available: "disabled",
    render: ({status, result}) => {
      return (
        <div className="mt-4">
          {status !== "complete" && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
              <span>正在获取代币列表...</span>
            </div>
          )}
          {status === "complete" && result && (
            <TokenSelector data={typeof result === 'string' ? JSON.parse(result) : result} />
          )}
        </div>
      );
    },
  });

  useCopilotAction({
    name: "get_exchange_plans",
    description: "根据用户需求生成多种兑换方案，包括不同手续费和速度的选项。",
    available: "disabled",
    render: ({status, result}) => {
      return (
        <div className="mt-4">
          {status !== "complete" && (
            <div className="flex items-center gap-2 text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>正在生成兑换方案...</span>
            </div>
          )}
          {status === "complete" && result && (
            <ExchangePlansSelector data={typeof result === 'string' ? JSON.parse(result) : result} />
          )}
        </div>
      );
    },
  });


  
  return (
    <div
      style={{ backgroundColor: '#6366f1' }}
      className="h-screen w-screen flex justify-center items-center flex-col transition-colors duration-300"
    >
      <div className="bg-white/20 backdrop-blur-md p-24 rounded-4xl shadow-xl max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-white mb-2 text-center">CopilotKit演示主应用</h1>
        <p className="text-gray-200 text-center italic mb-6">这里可以是你的任何现有的企业应用！</p>
        <hr className="border-white/20 my-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 搜索历史区域 */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">搜索历史</h2>
            <div className="flex flex-col gap-3">
              {state.search_history?.map((search, index) => (
                <div 
                  key={index} 
                  className={`bg-white/15 p-4 rounded-xl text-white relative group hover:bg-white/20 transition-all ${
                    search.completed ? 'border-l-4 border-green-400' : 'border-l-4 border-yellow-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-blue-200">🔍</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{search.query}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {search.completed ? (
                        <span className="text-green-400 text-xs bg-green-400/20 px-2 py-1 rounded-full">
                          ✅ 已完成
                        </span>
                      ) : (
                        <span className="text-yellow-400 text-xs bg-yellow-400/20 px-2 py-1 rounded-full">
                          ⏳ 进行中
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {state.search_history?.length === 0 && <p className="text-center text-white/80 italic my-8">
              暂无搜索历史。
            </p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-14 h-14 text-yellow-200">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" strokeWidth="2" stroke="currentColor" />
    </svg>
  );
}

function WeatherCard({ location, result, themeColor }: { location?: string, result?: any, themeColor: string }) {
  return (
    <div
    style={{ backgroundColor: themeColor }}
    className="rounded-xl shadow-xl mt-6 mb-4 max-w-md w-full"
  >
    <div className="bg-white/20 p-4 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white capitalize">{location}</h3>
          <p className="text-white">天气</p>
        </div>
        <SunIcon />
      </div>
      
      <div className="mt-4 flex items-end justify-between">
        <div className="text-3xl font-bold text-white">{result.temperature || '--'}</div>
        <div className="text-sm text-white">{result.condition || '未知'}</div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-white">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-white text-xs">湿度</p>
            <p className="text-white font-medium">{result.humidity || '--'}%</p>
          </div>
          <div>
            <p className="text-white text-xs">风速</p>
            <p className="text-white font-medium">{result.wind?.speed || 0}级</p>
          </div>
          <div>
            <p className="text-white text-xs">日期</p>
            <p className="text-white font-medium">{result.updated_at?.substring(0, 10)}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

// 兑换方案选择器组件
function ExchangePlansSelector({ data }: { data: any }) {
  const [selectedPlan, setSelectedPlan] = React.useState<any>(null);
  const [isConfirming, setIsConfirming] = React.useState(false);

  if (!data || !data.plans) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">暂无兑换方案</p>
          <p className="text-gray-400 text-sm mt-1">请稍后重试</p>
        </div>
      </div>
    );
  }

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
  };

  const handleConfirmExchange = () => {
    setIsConfirming(true);
    setTimeout(() => {
      alert(`兑换方案已确认！正在处理 ${data.amount} ${data.from_token} 到 ${data.to_token} 的兑换...`);
      setIsConfirming(false);
      setSelectedPlan(null);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 头部信息 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white">💱</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            兑换方案选择
          </h2>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-100 max-w-md mx-auto">
          <div className="flex items-center justify-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{data.amount}</div>
              <div className="text-sm text-gray-600">{data.from_token}</div>
            </div>
            <div className="text-2xl text-gray-400">→</div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">?</div>
              <div className="text-sm text-gray-600">{data.to_token}</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">
            当前汇率: 1 {data.from_token} = {data.market_info.current_rate} {data.to_token}
            {data.source && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                {data.source}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 兑换方案列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {data.plans.map((plan: any, index: number) => (
          <div
            key={plan.id}
            className={`relative bg-white rounded-2xl shadow-lg border-2 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
              selectedPlan?.id === plan.id
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-blue-300'
            } ${plan.recommended ? 'ring-2 ring-green-200 border-green-300' : ''}`}
            onClick={() => handleSelectPlan(plan)}
          >
            {plan.recommended && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  推荐
                </span>
              </div>
            )}
            
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  plan.risk_level === 'low' ? 'bg-green-100 text-green-700' : 
                  plan.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 
                  'bg-red-100 text-red-700'
                }`}>
                  {plan.risk_level === 'low' ? '低风险' : 
                   plan.risk_level === 'medium' ? '中风险' : '高风险'}
                </div>
              </div>
              
              <p className="text-gray-600 mb-4">{plan.description}</p>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">预估输出:</span>
                  <span className="font-bold text-lg text-green-600">
                    {plan.estimated_output} {data.to_token}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">汇率:</span>
                  <span className="font-semibold">1 {data.from_token} = {plan.exchange_rate} {data.to_token}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">手续费:</span>
                  <span className="font-semibold text-red-500">{(plan.fee_rate * 100).toFixed(3)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">处理时间:</span>
                  <span className="font-semibold">{plan.estimated_time}</span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="text-sm text-gray-600 mb-2">特色功能:</div>
                <div className="flex flex-wrap gap-2">
                  {plan.features.map((feature: string, idx: number) => (
                    <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 确认按钮 */}
      {selectedPlan && (
        <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">确认兑换方案</h3>
          <div className="bg-white rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600">选择的方案:</span>
              <span className="font-bold text-lg">{selectedPlan.name}</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">兑换数量:</span>
                <span className="font-semibold">{data.amount} {data.from_token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">预估输出:</span>
                <span className="font-semibold text-green-600">{selectedPlan.estimated_output} {data.to_token}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">手续费:</span>
                <span className="font-semibold text-red-500">{(selectedPlan.fee_rate * 100).toFixed(3)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">处理时间:</span>
                <span className="font-semibold">{selectedPlan.estimated_time}</span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleConfirmExchange}
              disabled={isConfirming}
              className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
            >
              {isConfirming ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="text-lg">处理中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-lg">确认兑换</span>
                </div>
              )}
            </button>
            <button
              onClick={() => setSelectedPlan(null)}
              disabled={isConfirming}
              className="px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl font-bold text-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-300"
            >
              重新选择
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 代币选择器组件
function TokenSelector({ data }: { data: any }) {
  const [selectedFrom, setSelectedFrom] = React.useState<any>(null);
  const [selectedTo, setSelectedTo] = React.useState<any>(null);
  const [amount, setAmount] = React.useState<string>("");
  const [showExchange, setShowExchange] = React.useState(false);
  const [exchangeData, setExchangeData] = React.useState<any>(null);
  const [isConfirming, setIsConfirming] = React.useState(false);

  if (!data || !data.tokens) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <p className="text-gray-500 text-lg">暂无代币数据</p>
          <p className="text-gray-400 text-sm mt-1">请稍后重试</p>
        </div>
      </div>
    );
  }

  const handleExchange = () => {
    if (selectedFrom && selectedTo && amount) {
      // 模拟生成兑换数据
      const mockExchangeData = {
        transaction_id: `TXN_${Date.now()}`,
        from_token: selectedFrom.symbol,
        to_token: selectedTo.symbol,
        amount: parseFloat(amount),
        exchange_rate: (selectedFrom.price_usd / selectedTo.price_usd).toFixed(6),
        estimated_output: (parseFloat(amount) * selectedFrom.price_usd / selectedTo.price_usd).toFixed(6),
        fee: (parseFloat(amount) * 0.001).toFixed(6),
        fee_rate: 0.001,
        net_amount: (parseFloat(amount) - parseFloat(amount) * 0.001).toFixed(6),
        status: "pending_user_confirmation",
        timestamp: new Date().toLocaleString(),
        risk_level: parseFloat(amount) > 1000 ? "medium" : "low",
        estimated_time: "5-10分钟",
        network_fee: (Math.random() * 0.01).toFixed(6)
      };
      setExchangeData(mockExchangeData);
      setShowExchange(true);
    }
  };

  const handleConfirmExchange = () => {
    setIsConfirming(true);
    // 模拟兑换处理
    setTimeout(() => {
      alert('兑换已确认！交易正在处理中...');
      setIsConfirming(false);
      setShowExchange(false);
      setExchangeData(null);
    }, 2000);
  };

  const handleCancelExchange = () => {
    setShowExchange(false);
    setExchangeData(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 头部标题 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
            <span className="text-2xl text-white">₿</span>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            代币兑换平台
          </h2>
        </div>
                      <p className="text-gray-600 text-lg">安全、快速、低手续费的代币兑换服务</p>
                      <div className="flex items-center gap-4 mt-2">
                        <p className="text-sm text-gray-500">更新时间: {data.timestamp}</p>
                        {data.source && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                            {data.source}
                          </span>
                        )}
                      </div>
      </div>

      {/* 代币选择区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* 源代币选择 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              选择源代币
            </h3>
            <p className="text-blue-100 text-sm mt-1">选择您要兑换的代币</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {data.tokens.map((token: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedFrom(token)}
                  className={`group p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    selectedFrom?.symbol === token.symbol
                      ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:shadow-md bg-white'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{token.icon}</div>
                    <div className="font-bold text-gray-800 text-lg">{token.symbol}</div>
                    <div className="text-sm text-gray-600 mt-1">{token.full_name}</div>
                    <div className="text-xs text-gray-500 mt-2 font-semibold">${token.price_usd?.toLocaleString()}</div>
                    <div className={`text-xs mt-1 ${token.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {token.change_24h >= 0 ? '+' : ''}{token.change_24h}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 目标代币选择 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              选择目标代币
            </h3>
            <p className="text-green-100 text-sm mt-1">选择您要兑换到的代币</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4">
              {data.tokens.map((token: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedTo(token)}
                  className={`group p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                    selectedTo?.symbol === token.symbol
                      ? 'border-green-500 bg-green-50 shadow-lg ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-green-300 hover:shadow-md bg-white'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-3xl mb-3 group-hover:scale-110 transition-transform duration-200">{token.icon}</div>
                    <div className="font-bold text-gray-800 text-lg">{token.symbol}</div>
                    <div className="text-sm text-gray-600 mt-1">{token.full_name}</div>
                    <div className="text-xs text-gray-500 mt-2 font-semibold">${token.price_usd?.toLocaleString()}</div>
                    <div className={`text-xs mt-1 ${token.change_24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {token.change_24h >= 0 ? '+' : ''}{token.change_24h}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 兑换设置 */}
      {selectedFrom && selectedTo && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              兑换设置
            </h3>
            <p className="text-purple-100 text-sm mt-1">输入您要兑换的代币数量</p>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1 relative">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={`最小: ${selectedFrom.min_exchange}`}
                  className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm font-semibold">
                  {selectedFrom.symbol}
                </div>
              </div>
              <button
                onClick={handleExchange}
                disabled={!amount || parseFloat(amount) < selectedFrom.min_exchange}
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold text-lg rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
              >
                开始兑换
              </button>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">可用余额:</span>
                  <span className="font-semibold text-gray-800">∞ {selectedFrom.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">最小兑换:</span>
                  <span className="font-semibold text-gray-800">{selectedFrom.min_exchange} {selectedFrom.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">最大兑换:</span>
                  <span className="font-semibold text-gray-800">{selectedFrom.max_exchange} {selectedFrom.symbol}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">手续费率:</span>
                  <span className="font-semibold text-gray-800">{(selectedFrom.fee_rate * 100).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 兑换确认界面 */}
      {showExchange && exchangeData && (
        <div className="bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-6">
            <h3 className="text-xl font-semibold text-white flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              确认兑换
            </h3>
            <p className="text-orange-100 text-sm mt-1">请仔细确认兑换详情</p>
          </div>
          <div className="p-6">
          
            {/* 兑换信息 */}
            <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center justify-center mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                      style={{ backgroundColor: selectedFrom.color }}
                    >
                      {selectedFrom.icon}
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800 text-lg">{selectedFrom.symbol}</h5>
                      <p className="text-sm text-gray-500">{selectedFrom.full_name}</p>
                    </div>
                  </div>
                  <div className="mx-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </div>
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg"
                      style={{ backgroundColor: selectedTo.color }}
                    >
                      {selectedTo.icon}
                    </div>
                    <div>
                      <h5 className="font-bold text-gray-800 text-lg">{selectedTo.symbol}</h5>
                      <p className="text-sm text-gray-500">{selectedTo.full_name}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 兑换详情 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">兑换数量:</span>
                    <span className="font-bold text-lg">{exchangeData.amount} {selectedFrom.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">兑换汇率:</span>
                    <span className="font-bold text-lg">{exchangeData.exchange_rate}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">预估输出:</span>
                    <span className="font-bold text-lg text-green-600">{exchangeData.estimated_output} {selectedTo.symbol}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">手续费:</span>
                    <span className="font-bold text-lg text-red-500">{exchangeData.fee} {selectedFrom.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">网络费用:</span>
                    <span className="font-bold text-lg">{exchangeData.network_fee} {selectedFrom.symbol}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 px-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 font-medium">预估时间:</span>
                    <span className="font-bold text-lg">{exchangeData.estimated_time}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 风险提示 */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                </div>
                <div>
                  <span className="text-yellow-800 font-semibold">
                    风险等级: {exchangeData.risk_level === 'low' ? '低风险' : exchangeData.risk_level === 'medium' ? '中风险' : '高风险'}
                  </span>
                  <p className="text-sm text-yellow-700 mt-1">
                    请仔细核对兑换信息，确认无误后再进行兑换操作
                  </p>
                </div>
              </div>
            </div>

            {/* 确认按钮 */}
            <div className="flex gap-4">
              <button
                onClick={handleConfirmExchange}
                disabled={isConfirming}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
              >
                {isConfirming ? (
                  <div className="flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span className="text-lg">处理中...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-lg">确认兑换</span>
                  </div>
                )}
              </button>
              <button
                onClick={handleCancelExchange}
                disabled={isConfirming}
                className="flex-1 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:shadow-none"
              >
                <div className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="text-lg">取消兑换</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

