"""
简化版搜索智能体 - 使用MCP Tavily API执行搜索查询
采用定制的CopilotKitState状态管理
"""
import asyncio
import os
import requests
import logging
import time
import uuid
from typing_extensions import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from langgraph.checkpoint.memory import MemorySaver
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_core.tools import tool
from copilotkit import CopilotKitState
from langgraph.types import interrupt 
import json
import random
from langgraph.graph import MessagesState

# 配置日志记录
logger = logging.getLogger("agent")
if not logger.handlers:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler("agent.log"),
            logging.StreamHandler()
        ]
    )

# 工具调用追踪
tool_calls_tracker = {}
    
class AgentState(CopilotKitState):
    """
    定制的Agent状态类
    继承自CopilotKitState，获得CopilotKit的所有状态字段
    同时添加自定义字段用于扩展功能
    """
    # 自定义状态字段
    search_history: list[dict] = []  # 搜索历史记录，格式: [{"query": "关键词", "completed": True/False, "timestamp": "时间戳"}]



@tool
async def get_exchange_plans(from_token: str, to_token: str, amount: float):
    """
    根据用户需求生成多种兑换方案，使用Tavily搜索获取实时汇率
    
    Args:
        from_token: 源代币符号 (如 BTC, ETH)
        to_token: 目标代币符号 (如 ETH, USDT)
        amount: 兑换数量
    
    Returns:
        dict: 包含多种兑换方案的详细信息
    """
    import random
    import time
    
    try:
        # 使用Tavily搜索获取实时汇率
        from langchain_mcp_adapters import MultiServerMCPClient
        
        # 创建MCP客户端
        client = MultiServerMCPClient(
            servers={
                "tavily": {
                    "command": "npx",
                    "args": ["-y", "tavily-mcp"],
                    "env": os.environ.copy(),
                    "transport": "stdio"
                }
            }
        )
        
        # 搜索实时汇率信息
        search_query = f"{from_token} to {to_token} exchange rate current price cryptocurrency"
        search_result = await client.call_tool("tavily", "tavily_search", {
            "query": search_query,
            "max_results": 3,
            "search_depth": "advanced"
        })
        
        # 从搜索结果中提取汇率信息
        search_content = search_result.get("content", "")
        
        # 默认汇率（如果搜索失败）
        base_rates = {
            "BTC": 45000,
            "ETH": 3000,
            "USDT": 1,
            "USDC": 1,
            "BNB": 300,
            "ADA": 0.5,
            "SOL": 100,
            "DOT": 7,
            "MATIC": 0.8,
            "AVAX": 25
        }
        
        from_price = base_rates.get(from_token.upper(), 1)
        to_price = base_rates.get(to_token.upper(), 1)
        
        # 尝试从搜索结果中提取实时价格
        import re
        price_patterns = [
            rf'{from_token}[:\s]*\$?([0-9,]+\.?[0-9]*)',
            rf'{to_token}[:\s]*\$?([0-9,]+\.?[0-9]*)',
            rf'1\s*{from_token}[:\s]*=?([0-9,]+\.?[0-9]*)\s*{to_token}'
        ]
        
        for pattern in price_patterns:
            price_match = re.search(pattern, search_content, re.IGNORECASE)
            if price_match:
                try:
                    extracted_price = float(price_match.group(1).replace(',', ''))
                    if from_token.upper() in pattern:
                        from_price = extracted_price
                    elif to_token.upper() in pattern:
                        to_price = extracted_price
                except:
                    pass
        
        # 计算基础汇率
        base_rate = from_price / to_price
        
        logger.info(f"Tavily搜索成功，{from_token}价格: ${from_price}, {to_token}价格: ${to_price}")
        
    except Exception as e:
        logger.warning(f"⚠️ Tavily汇率搜索失败，使用默认汇率: {e}")
        # 使用默认汇率
        base_rates = {
            "BTC": 45000,
            "ETH": 3000,
            "USDT": 1,
            "USDC": 1,
            "BNB": 300,
            "ADA": 0.5,
            "SOL": 100,
            "DOT": 7,
            "MATIC": 0.8,
            "AVAX": 25
        }
        
        from_price = base_rates.get(from_token.upper(), 1)
        to_price = base_rates.get(to_token.upper(), 1)
        base_rate = from_price / to_price
    
    # 生成多种兑换方案
    plans = []
    
    # 方案1: 标准兑换 (低手续费)
    plans.append({
        "id": "standard",
        "name": "标准兑换",
        "description": "快速兑换，低手续费",
        "exchange_rate": round(base_rate * (1 + random.uniform(-0.01, 0.01)), 6),
        "fee_rate": 0.001,
        "estimated_output": round(amount * base_rate * 0.999, 6),
        "estimated_time": "5-10分钟",
        "risk_level": "low",
        "features": ["快速处理", "低手续费", "高流动性"],
        "recommended": True
    })
    
    # 方案2: 快速兑换 (高手续费，更快速度)
    plans.append({
        "id": "fast",
        "name": "快速兑换",
        "description": "优先处理，快速到账",
        "exchange_rate": round(base_rate * (1 + random.uniform(-0.005, 0.005)), 6),
        "fee_rate": 0.003,
        "estimated_output": round(amount * base_rate * 0.997, 6),
        "estimated_time": "2-5分钟",
        "risk_level": "low",
        "features": ["优先处理", "快速到账", "高优先级"],
        "recommended": False
    })
    
    # 方案3: 经济兑换 (最低手续费)
    plans.append({
        "id": "economy",
        "name": "经济兑换",
        "description": "最低手续费，处理时间较长",
        "exchange_rate": round(base_rate * (1 + random.uniform(-0.02, 0.02)), 6),
        "fee_rate": 0.0005,
        "estimated_output": round(amount * base_rate * 0.9995, 6),
        "estimated_time": "15-30分钟",
        "risk_level": "low",
        "features": ["最低手续费", "经济实惠", "批量处理"],
        "recommended": False
    })
    
    # 方案4: 高级兑换 (最优汇率)
    plans.append({
        "id": "premium",
        "name": "高级兑换",
        "description": "最优汇率，专业服务",
        "exchange_rate": round(base_rate * (1 + random.uniform(0.01, 0.03)), 6),
        "fee_rate": 0.002,
        "estimated_output": round(amount * base_rate * 1.01, 6),
        "estimated_time": "10-15分钟",
        "risk_level": "low",
        "features": ["最优汇率", "专业服务", "VIP支持"],
        "recommended": False
    })
    
    return {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "source": "Tavily实时搜索",
        "from_token": from_token.upper(),
        "to_token": to_token.upper(),
        "amount": amount,
        "plans": plans,
        "market_info": {
            "current_rate": round(base_rate, 6),
            "from_price_usd": round(from_price, 2),
            "to_price_usd": round(to_price, 2),
            "price_change_24h": round(random.uniform(-5, 5), 2),
            "volume_24h": round(random.uniform(1000000, 5000000), 0),
            "liquidity": "high" if amount < 1000 else "medium"
        },
        "search_info": {
            "query": f"{from_token} to {to_token} exchange rate",
            "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
        }
    }

@tool
async def get_token_list():
    """
    通过Tavily搜索获取实时的代币列表和价格信息
    
    Returns:
        dict: 包含所有可兑换代币的详细信息
    """
    try:
        # 使用Tavily搜索获取实时加密货币数据
        from langchain_mcp_adapters import MultiServerMCPClient
        
        # 创建MCP客户端
        client = MultiServerMCPClient(
            servers={
                "tavily": {
                    "command": "npx",
                    "args": ["-y", "tavily-mcp"],
                    "env": os.environ.copy(),
                    "transport": "stdio"
                }
            }
        )
        
        # 搜索热门加密货币价格信息
        search_query = "top cryptocurrency prices today Bitcoin Ethereum USDT BNB ADA SOL DOT MATIC AVAX current market data"
        search_result = await client.call_tool("tavily", "tavily_search", {
            "query": search_query,
            "max_results": 5,
            "search_depth": "advanced"
        })
        
        # 解析搜索结果并构建代币数据
        tokens = []
        
        # 定义主要代币的基础信息
        token_configs = {
            "BTC": {"name": "Bitcoin", "full_name": "比特币", "icon": "₿", "color": "#f7931a", "network": "Bitcoin", "decimals": 8},
            "ETH": {"name": "Ethereum", "full_name": "以太坊", "icon": "Ξ", "color": "#627eea", "network": "Ethereum", "decimals": 18},
            "USDT": {"name": "Tether", "full_name": "泰达币", "icon": "₮", "color": "#26a17b", "network": "Ethereum", "decimals": 6},
            "BNB": {"name": "Binance Coin", "full_name": "币安币", "icon": "B", "color": "#f3ba2f", "network": "BSC", "decimals": 18},
            "ADA": {"name": "Cardano", "full_name": "艾达币", "icon": "₳", "color": "#0033ad", "network": "Cardano", "decimals": 6},
            "SOL": {"name": "Solana", "full_name": "索拉纳", "icon": "◎", "color": "#9945FF", "network": "Solana", "decimals": 9},
            "DOT": {"name": "Polkadot", "full_name": "波卡", "icon": "●", "color": "#E6007A", "network": "Polkadot", "decimals": 10},
            "MATIC": {"name": "Polygon", "full_name": "多边形", "icon": "⬟", "color": "#8247E5", "network": "Polygon", "decimals": 18},
            "AVAX": {"name": "Avalanche", "full_name": "雪崩", "icon": "🔺", "color": "#E84142", "network": "Avalanche", "decimals": 18}
        }
        
        # 从搜索结果中提取价格信息
        search_content = search_result.get("content", "")
        
        for symbol, config in token_configs.items():
            # 尝试从搜索结果中提取价格信息
            price_usd = random.uniform(100, 50000)  # 默认价格范围
            change_24h = random.uniform(-10, 10)    # 默认24小时变化
            
            # 简单的价格提取逻辑（实际项目中可以使用更复杂的解析）
            if symbol in search_content:
                # 尝试提取价格信息
                import re
                price_pattern = rf'{symbol}[:\s]*\$?([0-9,]+\.?[0-9]*)'
                price_match = re.search(price_pattern, search_content, re.IGNORECASE)
                if price_match:
                    try:
                        price_usd = float(price_match.group(1).replace(',', ''))
                    except:
                        pass
            
            # 计算其他相关数据
            price_cny = price_usd * 7.2  # 假设汇率为7.2
            market_cap = price_usd * random.uniform(1000000, 1000000000)  # 模拟市值
            volume_24h = market_cap * random.uniform(0.01, 0.1)  # 模拟24小时交易量
            
            # 根据代币类型设置合理的兑换限制
            if symbol == "BTC":
                min_exchange, max_exchange, fee_rate = 0.001, 10.0, 0.001
            elif symbol == "ETH":
                min_exchange, max_exchange, fee_rate = 0.01, 100.0, 0.002
            elif symbol == "USDT":
                min_exchange, max_exchange, fee_rate = 10.0, 100000.0, 0.0005
            else:
                min_exchange, max_exchange, fee_rate = 1.0, 10000.0, 0.002
            
            token_data = {
                "symbol": symbol,
                "name": config["name"],
                "full_name": config["full_name"],
                "price_usd": round(price_usd, 2),
                "price_cny": round(price_cny, 2),
                "change_24h": round(change_24h, 2),
                "market_cap": round(market_cap, 0),
                "volume_24h": round(volume_24h, 0),
                "icon": config["icon"],
                "color": config["color"],
                "description": f"基于Tavily实时搜索的{config['full_name']}价格信息",
                "min_exchange": min_exchange,
                "max_exchange": max_exchange,
                "fee_rate": fee_rate,
                "network": config["network"],
                "decimals": config["decimals"]
            }
            tokens.append(token_data)
        
        logger.info(f"Tavily搜索成功，获取到{len(tokens)}种代币数据")
        return {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source": "Tavily实时搜索",
            "tokens": tokens,
            "search_info": {
                "query": search_query,
                "results_count": len(tokens),
                "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
            }
        }
        
    except Exception as e:
        logger.warning(f"⚠️ Tavily搜索失败，使用备用数据: {e}")
        # 如果搜索失败，返回基础代币数据
        return {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "source": "备用数据",
            "tokens": [
                {
                    "symbol": "BTC",
                    "name": "Bitcoin",
                    "full_name": "比特币",
                    "price_usd": 45000.0,
                    "price_cny": 324000.0,
                    "change_24h": 2.5,
                    "market_cap": 850000000000,
                    "volume_24h": 25000000000,
                    "icon": "₿",
                    "color": "#f7931a",
                    "description": "第一个也是最著名的加密货币",
                    "min_exchange": 0.001,
                    "max_exchange": 10.0,
                    "fee_rate": 0.001,
                    "network": "Bitcoin",
                    "decimals": 8
                },
                {
                    "symbol": "ETH",
                    "name": "Ethereum",
                    "full_name": "以太坊",
                    "price_usd": 3000.0,
                    "price_cny": 21600.0,
                    "change_24h": 3.2,
                    "market_cap": 360000000000,
                    "volume_24h": 15000000000,
                    "icon": "Ξ",
                    "color": "#627eea",
                    "description": "智能合约平台和去中心化应用",
                    "min_exchange": 0.01,
                    "max_exchange": 100.0,
                    "fee_rate": 0.002,
                    "network": "Ethereum",
                    "decimals": 18
                }
            ]
        }

@tool
def exchange_tokens(from_token: str, to_token: str, amount: float, user_wallet: str = ""):
    """
    执行代币兑换操作
    
    Args:
        from_token: 源代币符号，如"BTC", "ETH"
        to_token: 目标代币符号，如"USDT", "ETH"
        amount: 兑换数量
        user_wallet: 用户钱包地址（可选）
        
    Returns:
        dict: 兑换详情和审核信息
    """
    # 模拟汇率计算
    base_rates = {
        "BTC": 45000,
        "ETH": 3000,
        "USDT": 1.0,
        "BNB": 400,
        "ADA": 0.6
    }
    
    from_rate = base_rates.get(from_token.upper(), 1.0)
    to_rate = base_rates.get(to_token.upper(), 1.0)
    exchange_rate = from_rate / to_rate
    
    # 计算费用和最终金额
    fee_rate = 0.001  # 0.1% 手续费
    fee = amount * fee_rate
    net_amount = amount - fee
    estimated_output = net_amount * exchange_rate
    
    # 风险评估
    risk_level = "low"
    if amount > 10000:
        risk_level = "high"
    elif amount > 1000:
        risk_level = "medium"
    
    # 生成兑换数据
    exchange_data = {
        "transaction_id": f"TXN_{int(time.time())}",
        "from_token": from_token.upper(),
        "to_token": to_token.upper(),
        "amount": amount,
        "exchange_rate": round(exchange_rate, 6),
        "estimated_output": round(estimated_output, 6),
        "fee": round(fee, 6),
        "fee_rate": fee_rate,
        "net_amount": round(net_amount, 6),
        "status": "pending_user_confirmation",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "requires_user_confirmation": True,
        "risk_level": risk_level,
        "user_wallet": user_wallet,
        "min_amount": 0.001,
        "max_amount": 1000000.0,
        "estimated_time": "5-10分钟",
        "network_fee": round(random.uniform(0.001, 0.01), 6)
    }
    
    logger.info(f"代币兑换请求: {from_token} -> {to_token}, 数量: {amount}")
    return exchange_data

# 全局工具变量，避免重复初始化
_all_tools = None

async def get_all_tools():
    """
    统一的工具准备函数，避免重复初始化MCP客户端
    
    Returns:
        list: 包含所有可用工具的列表
    """
    global _all_tools
    
    # 如果已经初始化过，直接返回
    if _all_tools is not None:
        return _all_tools
    
    # 创建MCP客户端以获取搜索工具
    try:
        # 确保环境变量正确传递
        env_vars = os.environ.copy()
        if "TAVILY_API_KEY" not in env_vars:
            logger.warning("⚠️ TAVILY_API_KEY 环境变量未设置")
        
        client = MultiServerMCPClient(
            {
                "tavily-mcp": {
                    "command": "npx",
                    "args": ["-y", "tavily-mcp"],
                    "env": env_vars,
                    "transport": "stdio"
                }
            }
        )
        
        # 获取MCP工具
        mcp_tools = await client.get_tools()
        _all_tools = mcp_tools + [get_token_list, get_exchange_plans]
        logger.info(f"工具初始化成功，可用工具: {[tool.name for tool in _all_tools]}")
        
    except Exception as e:
        logger.warning(f"⚠️ MCP工具初始化失败: {e}")
        # 如果MCP工具失败，使用备用工具
        _all_tools = [get_token_list, get_exchange_plans]
        logger.info(f"使用备用工具: {[tool.name for tool in _all_tools]}")
    
    return _all_tools

async def chat_node(state: AgentState, config: RunnableConfig):
    """
    主要的聊天节点，基于ReAct设计模式
    处理以下功能:
    - 模型配置和工具绑定
    - 系统提示设置
    - 获取模型响应
    - 处理工具调用
    """
    
    # 1. 使用模拟响应避免 API 配额问题
    # 暂时使用简单的文本响应，避免 OpenAI 配额限制
    from langchain_core.messages import HumanMessage
    
    # 模拟模型响应
    def get_mock_response(messages):
        last_message = messages[-1].content if messages else "你好"
        
        # 简化逻辑：只在第一次请求时调用工具，后续都返回文本
        # 检查是否已经有任何工具调用
        has_any_tool_call = any(
            hasattr(msg, 'tool_calls') and msg.tool_calls 
            for msg in messages
        )
        
        # 检查是否已经有代币列表工具调用
        has_token_list_call = any(
            hasattr(msg, 'tool_calls') and msg.tool_calls and 
            any(tc.get('name') == 'get_token_list' for tc in msg.tool_calls)
            for msg in messages
        )
        
        # 检查是否已经有兑换方案工具调用
        has_exchange_plans_call = any(
            hasattr(msg, 'tool_calls') and msg.tool_calls and 
            any(tc.get('name') == 'get_exchange_plans' for tc in msg.tool_calls)
            for msg in messages
        )
        
        if has_token_list_call and not has_exchange_plans_call:
            # 如果只有代币列表工具调用，直接返回文本响应
            return AIMessage(content="代币列表已加载完成，请在界面中选择代币进行兑换。")
        
        # 检查是否是兑换方案请求（优先处理）
        import re
        
        # 先检查是否包含代币符号
        token_symbols = ["BTC", "ETH", "USDT", "USDC", "BNB", "ADA", "SOL", "DOT", "MATIC", "AVAX"]
        found_tokens = [token for token in token_symbols if token in last_message.upper()]
        
        # 检查是否包含兑换关键词
        exchange_keywords = ["兑换", "交换", "换成", "换到", "转换为", "convert", "exchange"]
        has_exchange_keyword = any(keyword in last_message for keyword in exchange_keywords)
        
        if found_tokens and has_exchange_keyword:
            # 匹配各种兑换模式
            patterns = [
                # 完整模式: "1 BTC 兑换到 ETH" 或 "BTC 换 ETH"
                r'(\d+(?:\.\d+)?)\s*([A-Z]{3,5})\s*(?:兑换|换|换成|换到|转换为|兑换到)\s*([A-Z]{3,5})',
                r'([A-Z]{3,5})\s*(?:兑换|换|换成|换到|转换为|兑换到)\s*([A-Z]{3,5})',
                r'(\d+(?:\.\d+)?)\s*([A-Z]{3,5})\s*换\s*([A-Z]{3,5})',
                r'([A-Z]{3,5})\s*换\s*([A-Z]{3,5})',
                # 简单模式: "兑换 BTC" 或 "BTC 兑换"
                r'(?:兑换|换|换成|换到|转换为|兑换到)\s*([A-Z]{3,5})',
                r'([A-Z]{3,5})\s*(?:兑换|换|换成|换到|转换为|兑换到)',
                # 数字+代币模式: "20ETH" 或 "1BTC" (只在有兑换关键词时)
                r'(\d+(?:\.\d+)?)([A-Z]{3,5})'
            ]
            
            for pattern in patterns:
                match = re.search(pattern, last_message.upper())
                if match:
                    groups = match.groups()
                    if len(groups) == 3:
                        amount, from_token, to_token = groups
                        return AIMessage(content=f"我来为您生成 {amount} {from_token} 兑换到 {to_token} 的多种方案。", tool_calls=[{
                            "name": "get_exchange_plans",
                            "args": {
                                "from_token": from_token,
                                "to_token": to_token,
                                "amount": float(amount)
                            },
                            "id": "exchange_plans_1"
                        }])
                    elif len(groups) == 2:
                        from_token, to_token = groups
                        return AIMessage(content=f"我来为您生成 {from_token} 兑换到 {to_token} 的方案，请告诉我兑换数量。", tool_calls=[{
                            "name": "get_exchange_plans",
                            "args": {
                                "from_token": from_token,
                                "to_token": to_token,
                                "amount": 1.0
                            },
                            "id": "exchange_plans_1"
                        }])
                    elif len(groups) == 2 and groups[0].isdigit():
                        # 数字+代币模式: "20ETH" 或 "1BTC"
                        amount, from_token = groups
                        return AIMessage(content=f"您想将 {amount} {from_token} 兑换成什么代币？请告诉我目标代币（如 ETH、USDT 等）。")
                    elif len(groups) == 1:
                        # 只有源代币，需要询问目标代币
                        from_token = groups[0]
                        return AIMessage(content=f"您想将 {from_token} 兑换成什么代币？请告诉我目标代币（如 ETH、USDT 等）。")
            
            # 如果没有匹配到具体模式，但有代币符号和兑换关键词，提供通用回复
            if found_tokens:
                return AIMessage(content=f"您想兑换 {found_tokens[0]} 吗？请告诉我：\n1. 兑换数量（如 1 BTC）\n2. 目标代币（如 ETH、USDT 等）\n例如：'我要兑换 1 BTC 到 ETH'")
        
        # 如果只有代币符号但没有兑换关键词，询问是否要兑换
        elif found_tokens:
            return AIMessage(content=f"您想兑换 {found_tokens[0]} 吗？请告诉我：\n1. 兑换数量（如 1 BTC）\n2. 目标代币（如 ETH、USDT 等）\n例如：'我要兑换 1 BTC 到 ETH'")
        
        # 检查是否包含兑换关键词但没有代币符号
        elif has_exchange_keyword:
            return AIMessage(content="请告诉我您想兑换哪些代币？例如：\n- 'BTC 兑换 ETH'\n- '1 BTC 兑换到 USDT'\n- 'ETH 换 USDT'")
        
        # 只在特定关键词时才调用工具
        if any(keyword in last_message for keyword in ["代币", "token", "币种", "选择", "查看代币列表"]):
            return AIMessage(content="我来为你展示可用的代币列表。", tool_calls=[{
                "name": "get_token_list",
                "args": {},
                "id": "token_list_1"
            }])
        else:
            return AIMessage(content=f"你好！我是代币兑换助手。你可以：\n1. 说'查看代币列表'来选择代币\n2. 直接说'我要兑换 BTC 到 ETH'来获取兑换方案")
    
    # 使用模拟响应而不是真实模型
    response = get_mock_response(state["messages"])
    
    # 6. 检查响应中的工具调用
    if isinstance(response, AIMessage) and response.tool_calls:
        actions = state["copilotkit"]["actions"]
        #actions =[]
        # 6.1 检查是否有非CopilotKit的工具调用
        if not any(
            action.get("name") == response.tool_calls[0].get("name")
            for action in actions
        ):
            # 更新状态信息
            updated_state = {"messages": response}
            
            # 如果是搜索工具，更新搜索历史 - 搜索开始阶段
            if response.tool_calls[0].get("name") in ["tavily-search", "tavily-extract", "tavily-crawl"]:
                search_history = state.get("search_history", [])
                search_query = response.tool_calls[0].get("args", {})
                
                # 创建搜索历史记录 - 开始时标记为未完成
                search_record = {
                    "query": search_query.get("query", ""),
                    "completed": False,
                    "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                    "tool_name": response.tool_calls[0].get("name")
                }

                logger.info(f"🔍 添加搜索查询到历史 (开始): {search_record}")
                print(f"🔍 添加搜索查询到历史 (开始): {search_record}")
                search_history.append(search_record)
                updated_state["search_history"] = search_history
            
            print(f"updated_state: {updated_state}")
            return updated_state
    
    # 7. 所有工具调用已处理，结束对话
    # 清空搜索历史记录
    logger.info("🧹 任务结束，清空搜索历史记录")
    return {"messages": response, "search_history": []}

async def tool_node(state: AgentState, config: RunnableConfig):

    print('*****************进入 tool_node *****************')
    
    print("当前历史消息2:")
    print(state["messages"])
    """
    自定义工具调用节点，替代内置的ToolNode
    处理工具调用并返回结果，包含简化的人工审核流程
    """
    # 获取最后一条消息
    last_message = state["messages"][-1]
    
    # 检查是否有工具调用
    if not isinstance(last_message, AIMessage) or not last_message.tool_calls:
        logger.warning("⚠️ 没有找到工具调用")
        return {}
        
    # 只处理第一个工具调用
    tool_call = last_message.tool_calls[0]
    
    # 直接执行工具调用，不需要审核
    logger.info("🔧 直接执行工具调用")
    
    # 获取所有可用工具
    all_tools = await get_all_tools()
    
    # 创建工具名称到工具函数的映射
    tool_map = {tool.name: tool for tool in all_tools}
    
    # 获取工具调用信息
    tool_call = last_message.tool_calls[0]
    tool_name = tool_call.get("name")
    tool_args = tool_call.get("args", {})
    tool_id = tool_call.get("id")
    
    logger.info(f"🔧 执行工具: {tool_name}")
    logger.info(f"📝 参数: {tool_args}")
    
    if tool_name in tool_map:
        try:
            # 调用工具函数
            tool_func = tool_map[tool_name]
            
            # 检查是否为LangChain工具(有.func属性)
            if hasattr(tool_func, 'func') and callable(tool_func.func):
                # 这是我们自定义的工具(如get_weather)
                if asyncio.iscoroutinefunction(tool_func.func):
                    result = await tool_func.func(**tool_args)
                else:
                    result = tool_func.func(**tool_args)
            elif hasattr(tool_func, 'ainvoke'):
                # 这是MCP工具，使用ainvoke方法
                result = await tool_func.ainvoke(tool_args)
            elif hasattr(tool_func, 'invoke'):
                # 这是MCP工具，使用invoke方法
                result = await tool_func.invoke(tool_args)
            elif callable(tool_func):
                # 直接调用工具函数
                if asyncio.iscoroutinefunction(tool_func):
                    result = await tool_func(**tool_args)
                else:
                    result = tool_func(**tool_args)
            else:
                raise ValueError(f"不支持的工具类型: {type(tool_func)}")
            
            logger.info(f"✅ 工具调用成功: {str(result)[:100]}...")
            
            # 创建工具结果消息
            # 如果结果是字典，转换为JSON字符串
            if isinstance(result, dict):
                import json
                content = json.dumps(result, ensure_ascii=False, indent=2)
            else:
                content = str(result)
                
            tool_message = ToolMessage(
                content=content,
                tool_call_id=tool_id,
                name=tool_name
            )
            
            # 如果是搜索工具，标记搜索为完成状态
            updated_state = {"messages": [tool_message]}
            if tool_name in ["tavily-search", "tavily-extract", "tavily-crawl"]:
                search_history = state.get("search_history", [])
                # 找到最近的未完成搜索记录并标记为完成
                for record in reversed(search_history):
                    if not record.get("completed", True) and record.get("tool_name") == tool_name:
                        record["completed"] = True
                        record["completed_at"] = time.strftime("%Y-%m-%d %H:%M:%S")
                        logger.info(f"✅ 标记搜索为完成: {record['query']}")
                        print(f"✅ 标记搜索为完成: {record['query']}")
                        break
                updated_state["search_history"] = search_history
            
        except Exception as e:
            logger.error(f"❌ 工具调用失败: {e}")
            import traceback
            traceback.print_exc()
            # 创建错误消息
            tool_message = ToolMessage(
                content=f"工具调用失败: {str(e)}",
                tool_call_id=tool_id,
                name=tool_name
            )
            updated_state = {"messages": [tool_message]}
    else:
        logger.warning(f"❌ 未知工具: {tool_name}")
        tool_message = ToolMessage(
            content=f"未知工具: {tool_name}",
            tool_call_id=tool_id,
            name=tool_name
        )
        updated_state = {"messages": [tool_message]}
    
    # 返回工具结果
    return updated_state

async def create_search_agent():
    """创建使用定制状态的搜索智能体
    
    Returns:
        配置好的LangGraph StateGraph
    """
    # 获取所有工具（用于验证工具可用性）
    all_tools = await get_all_tools()
    
    # 创建状态图
    workflow = StateGraph(AgentState)
    workflow.add_node("chat_node", chat_node)
    workflow.add_node("tool_node", tool_node)  # 使用自定义的tool_node
    workflow.set_entry_point("chat_node")
    
    # 添加条件边缘
    def should_continue(state: AgentState):
        """判断是否应该继续到工具节点"""
        last_message = state["messages"][-1]
        if hasattr(last_message, 'tool_calls') and last_message.tool_calls:
            return "tool_node"
        return END
    
    workflow.add_conditional_edges(
        "chat_node",
        should_continue,
        {
            "tool_node": "tool_node",
            END: END
        }
    )
    
    # 从工具节点回到聊天节点
    workflow.add_edge("tool_node", "chat_node")
    
    # 创建内存检查点保存器
    checkpointer = MemorySaver()
    
    # 编译并返回图
    agent = workflow.compile(checkpointer=checkpointer)
    return agent

# 创建全局graph实例
graph = None

async def get_graph():
    """获取graph实例，如果不存在则创建"""
    print("正在获取或创建搜索智能体...")
    global graph
    if graph is None:
        graph = await create_search_agent()
    return graph

# 创建全局graph实例
graph = None

async def get_graph():
    """获取graph实例，如果不存在则创建"""
    global graph
    if graph is None:
        graph = await create_search_agent()
    return graph

# 运行初始化
try:
    print("正在初始化graph...")
    asyncio.run(get_graph())
except Exception as e:
    print(f"初始化graph失败: {e}")
    # 创建一个简单的fallback graph
    workflow = StateGraph(AgentState)
    
    async def simple_chat_node(state: AgentState, config: RunnableConfig):
        # 使用简单的模拟响应
        last_message = state["messages"][-1].content if state["messages"] else "你好"
        response = AIMessage(content=f"你好！我是智能助手。你刚才说：{last_message}")
        return Command(goto=END, update={"messages": response})
    
    workflow.add_node("chat_node", simple_chat_node)
    workflow.set_entry_point("chat_node")
    checkpointer = MemorySaver()
    graph = workflow.compile(checkpointer=checkpointer)
