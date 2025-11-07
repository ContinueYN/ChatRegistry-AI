<template>
  <div class="ai-assistant" :class="{ 'dark-mode': isDarkMode }">
    <!-- 头部 -->
    <header class="ai-header">
      <div class="header-content">
        <h1><img src="@/assets/icons/favicon.ico" alt="AI助手" class="header-icon"> AI助手</h1>
        <button class="back-btn" @click="goBack">返回</button>
        <div class="header-actions">
          <button class="theme-toggle" @click="toggleTheme" :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
            {{ isDarkMode ? '🌙' : '☀️' }}
          </button>
          <button class="clear-chat" @click="clearChat">
             清空对话
          </button>
        </div>
      </div>
    </header>

    <!-- 聊天区域 -->
    <main class="chat-container">
      <div class="messages-container" ref="messagesContainer">
        <!-- 欢迎消息 -->
        <div class="message ai-message welcome-message">
          <div class="avatar">
            <img src="@/assets/icons/favicon1.ico" alt="AI" class="avatar-icon">
          </div>
          <div class="message-content">
            <p>尊敬的主人，您好！我是您的AI助手，有什么可以帮助您的吗？</p>
            <div class="quick-questions">
              <h4>您可以问我：</h4>
              <div class="question-chips">
                <button 
                  v-for="question in quickQuestions" 
                  :key="question"
                  class="question-chip"
                  @click="sendQuickQuestion(question)"
                >
                  {{ question }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 消息列表 -->
        <div 
          v-for="(message, index) in messages" 
          :key="index"
          :class="['message', message.type === 'user' ? 'user-message' : 'ai-message']"
        >
          <div class="avatar">
            <!-- 用户消息使用用户图标 -->
            <img 
              v-if="message.type === 'user'" 
              src="@/assets/icons/favicon2.ico" 
              alt="用户" 
              class="avatar-icon"
            >
            <!-- AI消息使用机器人图标 -->
            <img 
              v-else 
              src="@/assets/icons/favicon1.ico" 
              alt="AI" 
              class="avatar-icon"
            >
          </div>
          <div class="message-content">
            <!-- 用户消息保持原样 -->
            <p v-if="message.type === 'user'">{{ message.content }}</p>
            
            <!-- AI消息显示打字效果 -->
            <div v-else-if="message.isTyping" class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
            
            <!-- AI消息渲染Markdown -->
            <div v-else class="ai-response-content" v-html="message.renderedContent"></div>
            
            <div class="message-time">{{ message.time }}</div>
          </div>
        </div>
      </div>
    </main>

    <!-- 输入区域 -->
    <footer class="input-container">
      <div class="input-wrapper">
        <textarea
          v-model="userInput"
          placeholder="输入您的问题..."
          @keydown.enter.exact.prevent="sendMessage"
          rows="1"
          ref="textInput"
          @input="autoResize"
        ></textarea>
        <button class="send-button" @click="sendMessage" :disabled="!userInput.trim()">发送
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import { marked } from 'marked'

const router = useRouter()

const goBack = () => {
  router.push('/more')
}

interface Message {
  type: 'user' | 'ai'
  content: string
  renderedContent?: string
  time: string
  isTyping?: boolean
}

// 配置marked选项 - 修复类型问题
marked.setOptions({
  breaks: true, // 将\n转换为<br>
  gfm: true // 使用GitHub风格的Markdown
})

// 响应式数据
const isDarkMode = ref(false)
const userInput = ref('')
const messages = ref<Message[]>([])
const messagesContainer = ref<HTMLElement>()
const textInput = ref<HTMLTextAreaElement>()

// 快捷问题示例
const quickQuestions = [
  '如何学习Vue3？',
  '推荐一些前端开发工具',
  '解释一下TypeScript的优点',
  '如何优化网站性能？',
  '什么是响应式设计？'
]

// 格式化时间
const formatTime = () => {
  const now = new Date()
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
}

// 处理AI回复内容，转换为HTML - 修复Promise问题
const processAIContent = (content: string): string => {
  try {
    // 先进行一些预处理
    let processedContent = content
      .replace(/##\s*/g, '## ') // 确保标题有空格
      .replace(/\*\*(.*?)\*\*/g, '**$1**') // 保持加粗
      .replace(/\*(.*?)\*/g, '*$1*') // 保持斜体
      .replace(/`(.*?)`/g, '`$1`') // 保持行内代码
    
    // 使用marked转换为HTML - 确保返回字符串而不是Promise
    const result = marked(processedContent)
    
    // 如果结果是Promise，返回默认处理
    if (result instanceof Promise) {
      console.warn('marked returned a Promise, using fallback processing')
      return content.replace(/\n/g, '<br>')
    }
    
    return result as string
  } catch (error) {
    console.error('Markdown处理错误:', error)
    // 如果处理失败，返回原始内容
    return content.replace(/\n/g, '<br>')
  }
}

// 发送消息 - 调用真实AI API
const sendMessage = async () => {
  if (!userInput.value.trim()) return

  const userMessage: Message = {
    type: 'user',
    content: userInput.value.trim(),
    time: formatTime()
  }

  messages.value.push(userMessage)
  const input = userInput.value
  userInput.value = ''

  // 添加"正在输入"的消息
  const typingMessageIndex = messages.value.length
  messages.value.push({
    type: 'ai',
    content: '',
    renderedContent: '',
    time: formatTime(),
    isTyping: true
  })

  await nextTick()
  scrollToBottom()

  try {
    // 调用后端AI API
    const response = await axios.post('http://localhost:5000/api/ai/chat', {
      message: input,
      conversationHistory: messages.value.slice(0, -1) // 排除当前的正在输入消息
    })

    if (response.data.success) {
      const aiContent = response.data.data.reply
      const renderedContent = processAIContent(aiContent)
      
      // 用完整的消息替换"正在输入"的消息
      messages.value[typingMessageIndex] = {
        type: 'ai',
        content: aiContent,
        renderedContent: renderedContent,
        time: formatTime(),
        isTyping: false
      }
    } else {
      throw new Error(response.data.message)
    }
  } catch (error: any) {
    console.error('AI调用失败:', error)
    const errorMessage = error.response?.data?.message || 'AI服务暂时不可用，请稍后重试。'
    const renderedErrorMessage = processAIContent(errorMessage)
    
    messages.value[typingMessageIndex] = {
      type: 'ai',
      content: errorMessage,
      renderedContent: renderedErrorMessage,
      time: formatTime(),
      isTyping: false
    }
  }
  
  scrollToBottom()
}

// 发送快捷问题
const sendQuickQuestion = (question: string) => {
  userInput.value = question
  sendMessage()
}

// 清空对话
const clearChat = () => {
  messages.value = []
}

// 切换主题
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
}

// 自动调整输入框高度
const autoResize = () => {
  if (textInput.value) {
    textInput.value.style.height = 'auto'
    textInput.value.style.height = textInput.value.scrollHeight + 'px'
  }
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 生命周期
onMounted(() => {
  if (textInput.value) {
    textInput.value.focus()
  }
})
</script>

<style scoped>
/* 精致滚动条样式 */
.messages-container {
  height: 100%;
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  
  /* Firefox */
  scrollbar-width: thin;
  scrollbar-color: rgba(76, 175, 80, 0.6) rgba(0, 0, 0, 0.1);
}

.messages-container::-webkit-scrollbar {
  width: 10px;
}

.messages-container::-webkit-scrollbar-track {
  background: linear-gradient(180deg, 
    rgba(240, 240, 240, 0.8) 0%, 
    rgba(230, 230, 230, 0.8) 50%, 
    rgba(240, 240, 240, 0.8) 100%);
  border-radius: 10px;
  margin: 5px 0;
}

.messages-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, 
    #4CAF50 0%, 
    #45a049 50%, 
    #4CAF50 100%);
  border-radius: 10px;
  border: 2px solid transparent;
  background-clip: padding-box;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.messages-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, 
    #45a049 0%, 
    #3d8b40 50%, 
    #45a049 100%);
  transform: scale(1.05);
}

.messages-container::-webkit-scrollbar-thumb:active {
  background: linear-gradient(180deg, 
    #3d8b40 0%, 
    #357a38 50%, 
    #3d8b40 100%);
}

/* 深色模式 */
.dark-mode .messages-container {
  scrollbar-color: rgba(102, 105, 187, 0.6) rgba(255, 255, 255, 0.1);
}

.dark-mode .messages-container::-webkit-scrollbar-track {
  background: linear-gradient(180deg, 
    rgba(60, 60, 60, 0.8) 0%, 
    rgba(50, 50, 50, 0.8) 50%, 
    rgba(60, 60, 60, 0.8) 100%);
}

.dark-mode .messages-container::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, 
    #66bb6a 0%, 
    #4caf50 50%, 
    #66bb6a 100%);
}

.dark-mode .messages-container::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, 
    #4caf50 0%, 
    #43a047 50%, 
    #4caf50 100%);
}

.ai-assistant {
  height: 90vh;
  width: 60vw;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%,rgba(102, 226, 207,0.4) 50%, rgba(243, 250, 107, 0.7) 100%);
  transition: all 0.3s ease;
}

.ai-assistant.dark-mode {
  background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%,rgba(99, 23, 251, 0.4) 50%, rgba(4, 152, 244, 0.7) 100%);
  color: #e0e0e0;
}

/* 头部样式 */
.ai-header {
  border-radius: 20px;
  background: rgba(170, 233, 251, 0.441);
  border-bottom: 1px solid #61abf63c;
  padding: 1rem 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.dark-mode .ai-header {
  background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%,rgba(99, 23, 251, 0.856) 50%, rgba(1, 97, 157, 0.71) 100%);
  border-bottom-color: #404040;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.header-content h1 {
  margin: 0;
  font-size: 1.5rem;
  color: #2c3e50;
}

.dark-mode .header-content h1 {
  color: #e0e0e0;
}

.header-content h1 i {
  margin-right: 0.5rem;
  color: #4CAF50;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.clear-chat {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.theme-toggle {
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  background: #f8f9fa;
  color: #495057;
}

.dark-mode .theme-toggle {
  background: #404040;
  color: #f1c40f;
}

.theme-toggle:hover {
  background: #e9ecef;
  transform: scale(1.1);
}

.dark-mode .theme-toggle:hover {
  background: #555;
}

.clear-chat {
  background: #ff4757;
  color: white;
}

.clear-chat:hover {
  background: #ff3742;
}

/* 聊天区域样式 */
.chat-container {
  flex: 1;
  border-radius: 20px;
  overflow: hidden;
  padding: 1rem;
}

.messages-container {
  height: 100%;
  overflow-y: auto;
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

/* 消息样式 */
.message {
  display: flex;
  margin-bottom: 1.5rem;
  animation: fadeIn 0.3s ease;
}

.user-message {
  flex-direction: row-reverse;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0.75rem;
  flex-shrink: 0;
}

.user-message .avatar {
  background: #4CAF50;
  color: white;
}

.ai-message .avatar {
  background: #2196F3;
  color: white;
}

.message-content {
  max-width: 60%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  position: relative;
}

.user-message .message-content {
  background: #8bca8d4d;
  color: rgb(13, 13, 13);
  border-bottom-right-radius: 4px;
}

.ai-message .message-content {
  background: rgba(204, 235, 233, 0.694);
  color: #333;
  border-bottom-left-radius: 4px;
  border: 1px solid #d4e5f7;
}

.dark-mode .ai-message .message-content {
  background: #2d2d2d;
  color: #f4f3f3;
  border-color: #404040;
}

.message-time {
  font-size: 0.75rem;
  opacity: 0.7;
  margin-top: 0.25rem;
}

/* 欢迎消息样式 */
.welcome-message .message-content {
  background: rgb(237, 238, 238);
  color: rgb(37, 37, 37);
  border-radius: 18px;
}

.quick-questions {
  margin-top: 1rem;
}

.quick-questions h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

.question-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.question-chip {
  background: rgba(85, 85, 85, 0.2);
  border: 1px solid rgba(255,255,255,0.3);
  color: rgb(138, 137, 137);
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.question-chip:hover {
  background: rgba(255,255,255,0.3);
}

/* 输入区域样式 */
.input-container {
  background: rgba(195, 240, 190, 0.39);
  border-radius: 20px;
  border-top: 1px solid #e1e5e9;
  padding: 1.5rem;
}

.dark-mode .input-container {
  background: #3e38e346;
  border-top-color: #404040;
}

.input-wrapper {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: flex-end;
  gap: 1rem;
}

.input-wrapper textarea {
  flex: 1;
  border: 1px solid #e1e5e9;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  resize: none;
  max-height: 120px;
  outline: none;
  transition: all 0.3s ease;
  background: #f8f9fa;
}

.dark-mode .input-wrapper textarea {
  background: #404040;
  border-color: #555;
  color: #e0e0e0;
}

.input-wrapper textarea:focus {
  border-color: #4CAF50;
  background: white;
}

.dark-mode .input-wrapper textarea:focus {
  background: #4a4a4a;
}

.send-button {
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 12px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.send-button:hover:not(:disabled) {
  background: #45a049;
  transform: scale(1.05);
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.back-btn {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e1e5e9;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  position: relative;
  overflow: hidden;
  z-index: 1;
}

.back-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, 
    transparent, 
    rgba(102, 234, 214, 0.3), 
    rgba(247, 249, 120, 0.3), 
    transparent);
  transition: left 0.6s ease;
  z-index: -1;
}

.back-btn:hover::before {
  left: 100%;
}

.back-btn:hover {
  background: #e9ecef;
  border-color: #66ead6;
}

/* 打字指示器 */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #999;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) { animation-delay: -0.32s; }
.typing-indicator span:nth-child(2) { animation-delay: -0.16s; }

/* AI回复内容样式 */
.ai-response-content {
  line-height: 1.6;
}

.ai-response-content h1,
.ai-response-content h2,
.ai-response-content h3,
.ai-response-content h4,
.ai-response-content h5,
.ai-response-content h6 {
  margin: 1rem 0 0.5rem 0;
  color: inherit;
}

.ai-response-content h1 { font-size: 1.4em; }
.ai-response-content h2 { font-size: 1.3em; }
.ai-response-content h3 { font-size: 1.2em; }
.ai-response-content h4 { font-size: 1.1em; }

.ai-response-content p {
  margin: 0.5rem 0;
}

.ai-response-content ul,
.ai-response-content ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.ai-response-content li {
  margin: 0.25rem 0;
}

.ai-response-content code {
  background: rgba(0, 0, 0, 0.1);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
}

.dark-mode .ai-response-content code {
  background: rgba(255, 255, 255, 0.1);
}

.ai-response-content pre {
  background: rgba(0, 0, 0, 0.05);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.dark-mode .ai-response-content pre {
  background: rgba(255, 255, 255, 0.05);
}

.ai-response-content pre code {
  background: none;
  padding: 0;
}

.ai-response-content blockquote {
  border-left: 4px solid #4CAF50;
  padding-left: 1rem;
  margin: 0.5rem 0;
  color: #666;
}

.dark-mode .ai-response-content blockquote {
  border-left-color: #66bb6a;
  color: #aaa;
}

.ai-response-content strong {
  font-weight: bold;
  color: inherit;
}

.ai-response-content em {
  font-style: italic;
}

.ai-response-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5rem 0;
}

.ai-response-content th,
.ai-response-content td {
  border: 1px solid #ddd;
  padding: 0.5rem;
  text-align: left;
}

.dark-mode .ai-response-content th,
.dark-mode .ai-response-content td {
  border-color: #555;
}

.ai-response-content th {
  background: rgba(0, 0, 0, 0.05);
  font-weight: bold;
}

.dark-mode .ai-response-content th {
  background: rgba(255, 255, 255, 0.05);
}

/* 头部图标样式 */
.header-icon {
  width: 30px;
  height: 30px;
  margin-right: 0.5rem;
  vertical-align: middle;
}

/* 头像图标样式 */
.avatar-icon {
  width: 90%;
  height: 90%;
  object-fit: contain;
}

/* 调整头像容器样式 */
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 0.75rem;
  flex-shrink: 0;
  background: transparent;
}

.user-message .avatar {
  background: #4caf4f42; /* 用户头像背景色 */
}

.ai-message .avatar {
  background: #2195f32e; /* AI头像背景色 */
}

@keyframes typing {
  0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .message-content {
    max-width: 85%;
  }
  
  .input-wrapper {
    flex-direction: column;
  }
  
  .send-button {
    align-self: flex-end;
  }

  .ai-assistant{
    width: 90vw;
  }
}
</style>