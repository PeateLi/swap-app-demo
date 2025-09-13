# CopilotKit AI助手演示应用

这是一个使用 CopilotKit 构建的智能AI助手演示应用，展示了前端UI与后端Agent的交互。

## 项目结构

- **前端UI** - Next.js应用，提供用户界面
- **后端Agent** - Python Agent，处理AI逻辑

## 快速开始

### 启动前端UI

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev
```

前端将运行在 [http://localhost:3000](http://localhost:3000)

### 启动后端Agent

```bash
# 进入agent目录
cd agent-py

# 安装依赖（推荐使用uv）
uv sync

# 启动Agent
uv run python -m sample_agent.demo
```

## 技术栈

- **前端**: Next.js, TypeScript, TailwindCSS, CopilotKit
- **后端**: Python, CopilotKit Agent
