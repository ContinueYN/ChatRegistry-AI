from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import requests
import os
from typing import List, Optional
import logging
from datetime import datetime
from dotenv import load_dotenv

# 加载 .env 文件
load_dotenv()

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AI Chat Service", version="1.0.0")

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据模型
class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str

class ChatRequest(BaseModel):
    message: str
    conversationHistory: List[ChatMessage] = []

class ChatResponse(BaseModel):
    reply: str
    timestamp: str

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
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        data = {
            "model": "glm-4",
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1000
        }
        
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

# 本地模型调用（可选 - 需要安装相应库）
def call_local_model(message: str, conversation_history: List[ChatMessage]) -> str:
    """
    使用本地模型进行回复
    需要安装：transformers, torch 等
    """
    try:
        # 这里可以集成各种本地模型
        # 例如使用 ChatGLM、Qwen、LLaMA 等
        
        # 示例：使用简单的规则作为备用
        fallback_responses = {
            "你好": "你好！我是AI助手，有什么可以帮助您的吗？喵~",
            "你是谁": "我是由Python实现的AI助手，专门为这个应用提供服务！喵~",
            "再见": "再见！祝您有美好的一天！喵~"
        }
        
        for key, response in fallback_responses.items():
            if key in message:
                return response
        
        return f"关于\"{message}\"，这是一个很好的问题！目前我主要使用智谱AI服务来回答您。喵~"
        
    except Exception as e:
        logger.error(f"Error in local model: {str(e)}")
        raise

# 备用回复生成
def generate_fallback_response(message: str) -> str:
    fallback_responses = {
        '你好': '你好！我是AI助手，有什么可以帮助您的吗？',
        '你是谁': '我是由Python实现的AI助手！',
        '再见': '再见！祝您有美好的一天！'
    }
    
    for key, response in fallback_responses.items():
        if key in message:
            return response
    
    return f'关于"{message}"，这是一个很好的问题！目前AI服务正在维护中，我会尽快恢复。您也可以尝试重新提问或稍后再试。'

# 主聊天端点
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="消息内容不能为空")
        
        # 首先尝试智谱AI
        try:
            reply = call_zhipu_ai(request.message, request.conversationHistory)
        except Exception as e:
            logger.warning(f"Zhipu AI failed, falling back to local model: {str(e)}")
            # 备用方案：本地模型
            reply = call_local_model(request.message, request.conversationHistory)
        
        return ChatResponse(
            reply=reply,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        # 最终备用回复
        fallback_reply = generate_fallback_response(request.message)
        return ChatResponse(
            reply=fallback_reply,
            timestamp=datetime.now().isoformat()
        )

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
        "supported_models": ["Zhipu AI GLM-4", "Local Fallback"],
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    from datetime import datetime
    
    port = int(os.getenv("PYTHON_AI_PORT", "8000"))
    
    print(f"Starting Python AI Service on port {port}")
    print("Supported features:")
    print("- Zhipu AI integration")
    print("- Local fallback model")
    print("- Conversation history support")
    
    uvicorn.run(app, host="0.0.0.0", port=port)