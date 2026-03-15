# ChatRegistry AI

一个现代化的全栈 Web 应用项目，包含用户注册管理系统和 AI 聊天服务。

## 项目结构

```
ChatRegistry AI/
├── backend/          # Python FastAPI 后端（AI 聊天服务）
│   └── ai/          # AI 服务代码
├── backend-js/      # Node.js Express 后端（用户管理系统）
│   └── data/        # 用户数据存储
├── .github/         # GitHub Actions 工作流配置
└── .vscode/         # VS Code 配置
```

## 技术栈

### Node.js 后端（用户注册管理）
- **框架**: Express.js
- **功能**: 用户注册、登录、信息管理
- **特性**:
  - 邮箱和手机号验证
  - 用户数据持久化（JSON 文件存储）
  - 完整的 CRUD 操作
  - CORS 跨域支持

### Python 后端（AI 聊天服务）
- **框架**: FastAPI
- **AI 集成**: 智谱 AI GLM-4
- **特性**:
  - 思维链推理（CoT）
  - 领域专业增强（编程、技术、学术、创意、分析）
  - 上下文理解
  - 多种聊天模式（标准、增强、专业分析、创意）
  - 详细日志记录

## 快速开始

### Node.js 后端

```bash
cd backend-js

# 安装依赖
npm install

# 开发模式
npm run dev

# 生产模式
npm start
```

服务将运行在 `http://localhost:5000`

### Python AI 服务

```bash
cd backend/ai

# 创建虚拟环境（可选）
python -m venv venv

# 激活虚拟环境
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 启动服务
python ai.py
```

服务将运行在 `http://localhost:8000`

## API 端点

### Node.js 用户管理 API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/users/register` | POST | 注册新用户 |
| `/api/users` | GET | 获取所有用户 |
| `/api/users/:id` | GET | 获取单个用户 |
| `/api/users/:id` | PUT | 更新用户信息 |
| `/api/users/:id` | DELETE | 删除用户 |
| `/api/health` | GET | 健康检查 |

### Python AI 服务 API

| 端点 | 方法 | 描述 |
|------|------|------|
| `/chat` | POST | 标准聊天 |
| `/chat/enhanced` | POST | 增强聊天（思维链 + 领域增强） |
| `/analyze` | POST | 专业分析模式 |
| `/creative` | POST | 创意模式 |
| `/health` | GET | 健康检查 |
| `/info` | GET | 服务信息 |

## 环境变量配置

### Python AI 服务

创建 `.env` 文件在 `backend/ai/` 目录：

```env
ZHIPU_API_KEY=your_api_key_here
PYTHON_AI_PORT=8000
```

### Node.js 后端

```env
PORT=5000
```

## 主要功能

### 用户管理系统
- ✅ 用户注册（用户名、邮箱、密码、手机、性别、爱好等）
- ✅ 邮箱格式验证
- ✅ 手机号格式验证
- ✅ 用户名和邮箱唯一性检查
- ✅ 用户信息更新
- ✅ 用户删除
- ✅ 密码不返回给客户端

### AI 聊天服务
- ✅ 标准聊天模式
- ✅ 增强聊天模式（思维链推理 + 领域检测 + 上下文理解）
- ✅ 专业分析模式
- ✅ 创意模式
- ✅ 系统提示词定制（AI 助手会在回复末尾添加"喵~"）
- ✅ 对话历史管理
- ✅ 错误降级处理

## 开发工作流

项目包含 GitHub Actions 配置：

- **deploy.yml**: 主分支推送时自动部署
- **test.yml**: 自动化测试（如有配置）

## 注意事项

1. **密码安全**: 当前版本密码以明文存储，生产环境应使用密码加密（如 bcrypt）
2. **数据存储**: 当前使用 JSON 文件存储，生产环境建议使用数据库（如 MongoDB、PostgreSQL）
3. **API 密钥**: 智谱 AI API 密钥需要单独申请，请勿将密钥提交到版本控制
4. **日志文件**: AI 服务日志保存在 `backend/ai/logs/ai_service.log`

## 许可证

本项目仅供学习和开发使用。

## 联系方式

如有问题或建议，欢迎提交 Issue。
