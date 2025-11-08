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
app = FastAPI(title="AI Chat Service", version="2.0.0")

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

# 强化版的系统提示词
ENHANCED_SYSTEM_PROMPT = """你是一个专业、智能的AI助手，具有以下特点：

1. **知识丰富**：精通编程、技术、科学、文学、历史等各领域知识
2. **思维严谨**：分析问题逻辑清晰，提供结构化回答
3. **创意无限**：能够进行创意写作、头脑风暴、问题解决
4. **专业可靠**：回答准确、详细、有深度
5. **个性鲜明**：每句话末尾带上'喵~'，语气友好可爱

请遵循以下回答原则：
- 复杂问题分点解答，使用Markdown格式
- 技术问题提供代码示例和最佳实践
- 创意问题给出多个角度和方案
- 不确定的内容要明确说明
- 保持专业性和准确性的同时展现个性

现在请开始帮助用户吧！喵~"""

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
                "content": ENHANCED_SYSTEM_PROMPT
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

def call_zhipu_ai_with_cot(message: str, conversation_history: List[ChatMessage]) -> str:
    """
    使用思维链增强的AI调用
    """
    try:
        # 构建增强的提示词
        enhanced_message = f"""
请按照以下步骤思考这个问题：
1. 理解问题的核心要点
2. 分析相关的知识领域
3. 构建逻辑推理过程
4. 给出详细完整的答案

用户问题：{message}

请开始思考并回答：
"""
        
        # 使用增强提示词调用AI
        return call_zhipu_ai(enhanced_message, conversation_history)
    except Exception as e:
        logger.error(f"CoT enhanced call failed: {str(e)}")
        # 降级到普通调用
        return call_zhipu_ai(message, conversation_history)

def detect_domain_and_enhance(message: str) -> str:
    """
    检测问题领域并应用专业增强
    """
    domain_keywords = {
        "programming": ["代码", "编程", "Python", "Java", "前端", "后端", "算法", "数据结构", "函数", "类", "模块"],
        "technology": ["技术", "AI", "人工智能", "机器学习", "深度学习", "网络", "安全", "系统", "架构"],
        "academic": ["论文", "研究", "学术", "理论", "公式", "证明", "学科", "领域"],
        "creative": ["创意", "写作", "故事", "诗歌", "设计", "艺术", "创作", "想象"],
        "analysis": ["分析", "比较", "优缺点", "评估", "预测", "趋势", "统计"]
    }
    
    detected_domains = []
    for domain, keywords in domain_keywords.items():
        if any(keyword in message for keyword in keywords):
            detected_domains.append(domain)
    
    # 根据领域应用增强提示词
    enhancement = ""
    if "programming" in detected_domains:
        enhancement = "请提供可运行的代码示例，解释关键逻辑，并给出最佳实践建议。"
    elif "technology" in detected_domains:
        enhancement = "请从技术原理、应用场景、发展趋势等多角度深入分析。"
    elif "academic" in detected_domains:
        enhancement = "请确保回答的学术严谨性，引用相关理论，提供详细推导过程。"
    elif "creative" in detected_domains:
        enhancement = "请充分发挥创意，提供新颖独特的视角和丰富的细节描述。"
    elif "analysis" in detected_domains:
        enhancement = "请进行系统性分析，使用数据支持，提供多个维度的比较。"
    
    if enhancement:
        enhanced_message = f"{message}\n\n（专业要求：{enhancement}）"
        return enhanced_message
    
    return message

def enhance_with_context(message: str, conversation_history: List[ChatMessage]) -> str:
    """
    基于对话历史增强上下文理解
    """
    if not conversation_history:
        return message
    
    # 分析对话历史的关键主题
    recent_topics = []
    for msg in conversation_history[-4:]:  # 最近4条消息
        content = msg.content.lower()
        if len(content) > 10:  # 只分析有实质内容的消息
            recent_topics.append(content[:50])  # 取前50字符作为主题
    
    if recent_topics:
        context_summary = " | ".join(recent_topics[-2:])  # 最近2个主题
        enhanced_message = f"""
基于之前的对话上下文（涉及：{context_summary}），请继续深入回答：

当前问题：{message}

请确保回答与之前的对话连贯一致。
"""
        return enhanced_message
    
    return message

# 强化版的主聊天端点
@app.post("/chat/enhanced", response_model=ChatResponse)
async def enhanced_chat_endpoint(request: ChatRequest):
    """
    强化版的聊天端点
    """
    try:
        if not request.message or not request.message.strip():
            raise HTTPException(status_code=400, detail="消息内容不能为空")
        
        # 应用多重增强
        enhanced_message = request.message
        
        # 1. 领域检测增强
        enhanced_message = detect_domain_and_enhance(enhanced_message)
        
        # 2. 上下文理解增强
        enhanced_message = enhance_with_context(enhanced_message, request.conversationHistory)
        
        # 3. 使用思维链增强调用
        reply = call_zhipu_ai_with_cot(enhanced_message, request.conversationHistory)
        
        return ChatResponse(
            reply=reply,
            timestamp=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"Enhanced chat error: {str(e)}")
        # 降级到普通AI调用
        try:
            reply = call_zhipu_ai(request.message, request.conversationHistory)
            return ChatResponse(
                reply=reply,
                timestamp=datetime.now().isoformat()
            )
        except Exception:
            raise HTTPException(status_code=500, detail="AI服务暂时不可用")

# 原始聊天端点（保持兼容性）
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

# 专业分析端点
@app.post("/analyze", response_model=ChatResponse)
async def analyze_endpoint(request: ChatRequest):
    """专业分析模式"""
    analysis_prompt = f"请对以下内容进行专业深入的分析，提供结构化、多角度的见解：\n\n{request.message}"
    reply = call_zhipu_ai(analysis_prompt, request.conversationHistory)
    return ChatResponse(reply=reply, timestamp=datetime.now().isoformat())

# 创意模式端点
@app.post("/creative", response_model=ChatResponse)
async def creative_endpoint(request: ChatRequest):
    """创意模式"""
    creative_prompt = f"请以创意方式回答以下问题，充分发挥想象力和创造力：\n\n{request.message}"
    reply = call_zhipu_ai(creative_prompt, request.conversationHistory)
    return ChatResponse(reply=reply, timestamp=datetime.now().isoformat())

# 健康检查端点
@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "Python AI Service",
        "version": "2.0.0",
        "enhanced_features": True
    }

# 服务信息端点
@app.get("/info")
async def service_info():
    return {
        "service": "Python AI Chat Service",
        "version": "2.0.0",
        "supported_models": ["Zhipu AI GLM-4"],
        "enhanced_features": [
            "思维链推理",
            "领域专业增强", 
            "上下文理解",
            "专业分析模式",
            "创意模式"
        ],
        "endpoints": {
            "/chat": "标准聊天",
            "/chat/enhanced": "强化聊天",
            "/analyze": "专业分析",
            "/creative": "创意模式"
        },
        "status": "running"
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PYTHON_AI_PORT", "8000"))
    
    # 从环境变量获取端口，默认 8000
    print(f"Starting Enhanced Python AI Service on port {port}")
    
    # 使用 uvicorn 启动 FastAPI 应用
    uvicorn.run(app, host="0.0.0.0", port=port)