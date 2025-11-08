# FastAPI: 现代 Python Web 框架，用于构建 API
from fastapi import FastAPI, HTTPException

# CORS: 跨域资源共享中间件，允许前端访问
from fastapi.middleware.cors import CORSMiddleware

# Pydantic: 数据验证库，确保输入数据格式正确
from pydantic import BaseModel

# requests: 发送 HTTP 请求的库
import requests

# os: 操作系统接口，用于读取环境变量
import os

# typing: 类型提示，让代码更清晰
from typing import List

# logging: 日志记录，用于调试和错误追踪
import logging
from logging.handlers import RotatingFileHandler

# datetime: 日期时间处理
from datetime import datetime

# dotenv: 从 .env 文件加载环境变量
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 创建日志目录
log_dir = "logs"
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        # 文件日志，最大 10MB，保留 5 个备份
        RotatingFileHandler(
            os.path.join(log_dir, "ai_service.log"),
            maxBytes=10*1024*1024,  # 10MB
            backupCount=5,
            encoding='utf-8'
        )
    ]
)
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用实例
app = FastAPI(title="AI Chat Service", version="1.0.0")

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # 允许所有域名访问
    allow_credentials=True, # 允许携带凭证（如 cookies）
    allow_methods=["*"], # 允许所有 HTTP 方法
    allow_headers=["*"], # 允许所有请求头
)

# 数据模型
# 单条聊天消息，包含角色和内容
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
 
# 客户端发送的请求，包含消息和对话历史
class ChatRequest(BaseModel):
    message: str
    conversationHistory: List[ChatMessage] = []

# 服务端返回的响应，包含回复和时间戳
class ChatResponse(BaseModel):
    reply: str
    timestamp: str

# 智谱AI请求模型
class ZhipuAIRequest(BaseModel):
    model: str = "glm-4"
    messages: List[dict]
    temperature: float = 0.7
    max_tokens: int = 1000

# 智谱AI调用
def call_zhipu_ai(message: str, conversation_history: List[ChatMessage]) -> str:
    try:
        api_key = os.getenv("ZHIPU_API_KEY")
        if not api_key:
            # 记录警告并抛出异常
            logger.warning("ZHIPU_API_KEY not found in environment variables")
            raise ValueError("API key not configured")
        
        # 构建消息历史
        messages = [
            {
                "role": "user",
                "content": "你是一个有帮助的AI助手，用中文回答用户的问题。回答要简洁明了，专业且友好。同时每句话末尾带上'喵~'。"
            }
        ]
        
        # 添加对话历史（最近6条）
        for msg in conversation_history[-6:]:
            messages.append({
                "role": "user" if msg.role == "user" else "assistant",
                "content": msg.content
            })
        
        # 添加当前消息
        messages.append({
            "role": "user",
            "content": message
        })
        
        # 调用智谱AI API
        # 设置请求头，包含认证信息
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        # 构建请求数据：使用 GLM-4 模型，温度 0.7（创造性），最大 token 数 1000
        data = {
            "model": "glm-4",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
        # 发送 POST 请求到智谱AI API 设置 30 秒超时
        response = requests.post(
            "https://open.bigmodel.cn/api/paas/v4/chat/completions",
            headers=headers,
            json=data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            return result["choices"][0]["message"]["content"]
        else:
            logger.error(f"Zhipu AI API error: {response.status_code} - {response.text}")
            raise Exception(f"API request failed: {response.status_code}")
            
    except Exception as e:
        logger.error(f"Error calling Zhipu AI: {str(e)}")
        raise

# 主聊天端点
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="消息内容不能为空")
        
        # 直接使用智谱AI
        reply = call_zhipu_ai(request.message, request.conversationHistory)
        
        # 返回格式化的响应，包含回复和时间戳
        return ChatResponse(
            reply=reply,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        # 直接抛出异常，由TS端处理备用回复
        raise HTTPException(status_code=500, detail="AI服务暂时不可用")

# 健康检查端点
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "Python AI Service"}

# 服务信息端点
@app.get("/info")
async def service_info():
    return {
        "service": "Python AI Chat Service",
        "version": "1.0.0",
        "supported_models": ["Zhipu AI GLM-4"],
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PYTHON_AI_PORT", "8000"))
    
    # 从环境变量获取端口，默认 8000
    print(f"Starting Python AI Service on port {port}")
    
    # 使用 uvicorn 启动 FastAPI 应用
    uvicorn.run(app, host="0.0.0.0", port=port)