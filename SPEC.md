# AI 辩论赛 Web 应用规范

## 1. 项目概述

- **项目名称**: AI Debate Arena
- **项目类型**: Web应用 (Next.js App Router)
- **核心功能**: 用户创建AI智能体进行辩论，支持多Agent轮询发言
- **目标用户**: 想要体验AI辩论、测试不同AI模型辩论能力的用户

## 2. UI/UX 规范

### 布局结构

- **页面结构**:
  - 顶部导航栏 (固定)
  - 主内容区: 左侧配置面板 + 右侧辩论展示区
  - 底部状态栏 (可选)

- **响应式断点**:
  - Mobile: < 768px (单列布局)
  - Tablet: 768px - 1024px (紧凑双列)
  - Desktop: > 1024px (完整双列)

### 视觉设计

- **色彩方案** (深色科技风):
  - 背景主色: `#0a0a0f` (深空黑)
  - 背景次色: `#12121a` (深灰蓝)
  - 卡片背景: `#1a1a24` (暗紫灰)
  - 主色调: `#6366f1` (靛蓝)
  - 强调色: `#22d3ee` (青色)
  - 正方色: `#22c55e` (绿色)
  - 反方色: `#ef4444` (红色)
  - 裁判色: `#f59e0b` (琥珀色)
  - 文字主色: `#f8fafc`
  - 文字次色: `#94a3b8`

- **字体**:
  - 标题: `JetBrains Mono` (等宽科技感)
  - 正文: `Inter` (清晰可读)
  - 代码/终端: `Fira Code`

- **间距系统**:
  - 基础单位: 4px
  - 组件内边距: 16px / 24px
  - 卡片间距: 16px
  - 页面边距: 24px (desktop) / 16px (mobile)

- **视觉效果**:
  - 卡片: `border: 1px solid rgba(99, 102, 241, 0.2)`
  - 阴影: `0 4px 24px rgba(0, 0, 0, 0.4)`
  - 玻璃拟态效果: `backdrop-filter: blur(12px)`
  - 渐变边框动画

### 组件列表

1. **Header**: Logo + 标题 + 主题切换
2. **DebateTopicInput**: 辩题输入框
3. **AgentList**: Agent列表展示 (可拖拽排序)
4. **AgentCard**: 单个Agent配置卡片
5. **AgentForm**: Agent配置表单 (名称、立场、模型、URL、Key、Prompt)
6. **DebateDisplay**: 辩论消息流展示
7. **MessageBubble**: 单条消息气泡 (带立场颜色)
8. **ControlPanel**: 开始/暂停/重置按钮
9. **SettingsModal**: API设置弹窗

## 3. 功能规范

### 数据类型 (TypeScript Interfaces)

```typescript
// 辩论立场
type Stance = 'pro' | 'con' | 'judge';

// AI模型配置
interface AgentConfig {
  id: string;
  name: string;
  stance: Stance;
  model: string;
  baseUrl: string;
  apiKey: string;
  systemPrompt: string;
}

// 单条辩论消息
interface DebateMessage {
  id: string;
  agentId: string;
  agentName: string;
  stance: Stance;
  content: string;
  timestamp: number;
}

// 辩论会话状态
interface DebateSession {
  topic: string;
  agents: AgentConfig[];
  messages: DebateMessage[];
  isRunning: boolean;
  currentTurn: number;
  currentAgentIndex: number;
}

// 应用全局状态
interface AppState {
  agents: AgentConfig[];
  session: DebateSession | null;
}
```

### 核心功能

1. **辩题设置**
   - 输入辩题文本
   - 支持空辩题(自由辩论模式)

2. **Agent管理**
   - 添加新Agent
   - 编辑Agent配置
   - 删除Agent
   - 拖拽排序发言顺序
   - 复制/导入/导出配置

3. **API配置**
   - Base URL (支持OpenAI兼容接口)
   - API Key (本地存储)
   - 模型名称
   - 可保存多个API配置

4. **辩论流程**
   - 开始辩论: 根据顺序轮询发言
   - 暂停/继续
   - 重置辩论
   - 手动触发下一轮
   - 流式输出显示

5. **消息展示**
   - 按时间顺序显示
   - 立场颜色区分
   - 时间戳显示
   - 复制消息内容

### 安全要求

- 所有API Key存储在浏览器LocalStorage
- 不发送任何数据到后端服务器
- API调用直接在客户端进行

## 4. 验收标准

- [ ] 项目可正常启动 (npm run dev)
- [ ] 可以添加/编辑/删除Agent
- [ ] Agent配置正确保存到LocalStorage
- [ ] 可以设置辩题并开始辩论
- [ ] 辩论消息正确显示
- [ ] API调用使用流式输出
- [ ] 响应式布局正常工作
- [ ] 界面符合深色科技风设计
