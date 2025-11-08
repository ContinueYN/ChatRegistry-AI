// Node.js 的 Web 框架，用于创建服务器和路由
import express, { Request, Response, Application } from 'express';

// 跨域资源共享中间件，允许不同域的客户端访问
import cors from 'cors';

// 文件系统模块的 Promise 版本，用于异步文件操作
import { promises as fs } from 'fs';
import * as fsSync from 'fs';

// 路径处理模块，用于安全地构建文件路径
import path from 'path';

// 生成唯一标识符的库，{ v4: uuidv4 } 是解构赋值语法
import { v4 as uuidv4 } from 'uuid';

// 添加管理员路由
import { ensureAdminsFile, verifyAdmin, addAdmin, readAdmins } from './utils/adminAuth';

// 请求引入
import axios from 'axios';


// 加载环境变量
require('dotenv').config();


// 创建 Express 应用实例
const app: Application = express();

// 中间件
app.use(cors()); // 启用跨域请求
app.use(express.json()); // 解析 JSON 格式的请求体

// 数据文件路径 & path.join(): 安全地拼接路径，避免跨平台问题
const DATA_DIR: string = path.join(__dirname, 'data'); // __dirname: Node.js 全局变量，表示当前文件所在目录src/ + data
const USERS_FILE: string = path.join(DATA_DIR, 'users.json'); // :~/data/ + users.json
const REPLIES_FILE: string = path.join(DATA_DIR, 'replies.txt'); // :~/data/ + replies.txt

// 自定义回复映射（从 replies.txt 加载）
interface CustomReplyRule {
  raw: string; // 原始 key 字符串（为记录/调试保留）
  reply: string; // 对应的回复文本
  type: 'regex' | 'aliases' | 'tokens' | 'include'; // 分别对应不同匹配方式 : 正则、别名、tokens、包含
  regex?: RegExp;
  alternatives?: string[];
  tokens?: string[];
}

let customReplyRules: CustomReplyRule[] = [];

async function loadCustomReplies(): Promise<void> { // 异步函数 — 加载并解析 replies.txt
  try {
    const exists = await fs.access(REPLIES_FILE).then(() => true).catch(() => false); // 检查文件是否存在
    if (!exists) {
      // 如果文件不存在，不要报错，保留空映射
      customReplyRules = [];
      return;
    }

    const data = await fs.readFile(REPLIES_FILE, 'utf8');
    const lines = data.split(/\r?\n/);
    const rules: CustomReplyRule[] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('#')) continue; // 支持注释

      // 支持 key=>value 或 key:value 两种格式，按首次分割
      let sepIndex = line.indexOf('=>');
      let rawKey = '';
      let value = '';
      if (sepIndex !== -1) {
        rawKey = line.slice(0, sepIndex).trim(); // slice(): 截取字符串(左闭右开) .trim()去掉多余空格，只保留单词之间的一个
        value = line.slice(sepIndex + 2).trim();
      } else {
        sepIndex = line.indexOf(':');
        if (sepIndex !== -1) {
          rawKey = line.slice(0, sepIndex).trim();
          value = line.slice(sepIndex + 1).trim();
        } else {
          continue; // 无效行
        }
      }

      if (!rawKey) continue;

      // 识别规则类型：正则 /pattern/flags, 别名 a|b|c, 词 tokens（包含空格或逗号），或默认包含匹配
      if (rawKey.startsWith('/') && rawKey.lastIndexOf('/') > 0) {
        // parse regex /pattern/flags
        const lastSlash = rawKey.lastIndexOf('/');
        const pattern = rawKey.slice(1, lastSlash);
        const flags = rawKey.slice(lastSlash + 1);
        try {
          const regex = new RegExp(pattern, flags);
          rules.push({ raw: rawKey, reply: value, type: 'regex', regex });
        } catch (err) {
          console.warn('无效的正则规则，跳过:', rawKey);
        }
      } else if (rawKey.includes('|')) {
        const alternatives = rawKey.split('|').map(s => s.trim()).filter(Boolean);
        if (alternatives.length) {
          rules.push({ raw: rawKey, reply: value, type: 'aliases', alternatives });
        }
      } else if (rawKey.includes(' ') || rawKey.includes(',')) {
        const tokens = rawKey.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
        if (tokens.length) {
          rules.push({ raw: rawKey, reply: value, type: 'tokens', tokens });
        }
      } else {
        rules.push({ raw: rawKey, reply: value, type: 'include' });
      }
    }

    customReplyRules = rules;
    console.log('已加载自定义回复规则:', customReplyRules.length, '条');
  } catch (err) {
    console.error('加载自定义回复失败:', err);
    customReplyRules = [];
  }
}

// 尝试初始加载，并监听文件变更以热重载（若运行时支持）
loadCustomReplies().catch(err => console.error(err));
try {
  // watchFile 在某些环境（如打包后）仍然可用
  fsSync.watchFile(REPLIES_FILE, { interval: 1000 }, (curr, prev) => {
    if (curr.mtimeMs !== prev.mtimeMs) {
      console.log('replies.txt 变更，重新加载自定义回复');
      loadCustomReplies().catch(err => console.error(err));
    }
  });
} catch (err) {
  // 忽略不可用的情况
}

// 定义用户接口类型
interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  hobbies: string[];
  otherHobby: string;
  bio: string;
  agreeTerms: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  phone?: string;
  gender?: string;
  hobbies?: string[];
  otherHobby?: string;
  bio?: string;
  agreeTerms: boolean;
}

interface UpdateUserRequest {
  username?: string;
  email?: string;
  phone?: string;
  gender?: string;
  hobbies?: string[];
  otherHobby?: string;
  bio?: string;
}

// 确保数据目录和文件存在
const ensureDataFile = async (): Promise<void> => {
  try {
    await fs.access(DATA_DIR); // fs.access(): 检查文件/目录是否存在
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true }); // 没有就当场建一个呗~
  }
  
  try {
    await fs.access(USERS_FILE); // 如上~~~
  } catch {
    // 文件不存在，创建空的 JSON 数组
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2)); // JSON.stringify([], null, 2): 将空数组格式化为美观的 JSON
  }
};

// 读取用户数据
const readUsers = async (): Promise<User[]> => {
  try {
    const data: string = await fs.readFile(USERS_FILE, 'utf8'); // fs.readFile(): 异步读取文件内容
    return JSON.parse(data) as User[]; // JSON.parse(): 将 JSON 字符串解析为 JavaScript 对象
  } catch (error) {
    console.error('读取用户数据失败:', error); // 返回了错误信息~
    return [];
  }
};

// 写入用户数据
const writeUsers = async (users: User[]): Promise<boolean> => {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2)); // 同上，把要存的东西转成JSON格式存入
    return true;
  } catch (error) {
    console.error('写入用户数据失败:', error);
    return false;
  }
};

// 验证邮箱格式
const isValidEmail = (email: string): boolean => {
  const emailRegex: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email); // test() 方法检查字符串是否匹配正则，正则就是上面一行
};

// 验证手机格式
const isValidPhone = (phone: string): boolean => {
  if (!phone) return true; // 手机号可选
  const phoneRegex: RegExp = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 注册新用户
app.post('/api/users/register', async (req: Request<{}, {}, CreateUserRequest>, res: Response) => {
  try {
    const { username, email, password, phone, gender, hobbies, otherHobby, bio, agreeTerms }: CreateUserRequest = req.body;

    // 基本验证
    if (!username || username.length < 3) {
      return res.status(400).json({
        success: false,
        message: '用户名至少3个字符'
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的邮箱地址'
      });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({
        success: false,
        message: '密码至少6个字符'
      });
    }

    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        message: '请输入有效的手机号码'
      });
    }

    if (!agreeTerms) {
      return res.status(400).json({
        success: false,
        message: '必须同意用户协议和隐私政策'
      });
    }

    // 读取现有用户
    const users: User[] = await readUsers();

    // 检查用户是否已存在
    const existingUserByEmail: User | undefined = users.find(user => user.email === email);
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册'
      });
    }

    const existingUserByUsername: User | undefined = users.find(user => user.username === username);
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已被使用'
      });
    }

    // 创建新用户 
    const newUser: User = {
      id: uuidv4(), // uuidv4(): 生成唯一 ID
      username,
      email,
      password, // 注意：实际项目中应该加密密码
      phone: phone || '',
      gender: gender || '',
      hobbies: hobbies || [],
      otherHobby: otherHobby || '',
      bio: bio || '',
      agreeTerms: !!agreeTerms,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // 保存用户
    users.push(newUser); // array.push(): 向数组末尾添加元素
    const writeSuccess: boolean = await writeUsers(users);

    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        message: '保存用户数据失败'
      });
    }

    // 返回用户信息（不包含密码）
    const { password: _, ...userResponse } = newUser; // 扩展运算符 ...: 创建对象的浅拷贝

    res.status(201).json({
      success: true,
      message: '用户注册成功',
      data: userResponse
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 获取所有用户（用于管理）
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const users: User[] = await readUsers();
    // 不返回密码
    const usersWithoutPassword = users.map(user => {
      const { password, ...userWithoutPassword } = user; // 剩余参数语法：{ password, ...userWithoutPassword } 提取 password，剩余属性放入新对象
      return userWithoutPassword;
    });

    res.json({
      success: true,
      data: usersWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 根据ID获取用户
app.get('/api/users/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const users: User[] = await readUsers();
    const user: User | undefined = users.find(u => u.id === req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 不返回密码 结构函数，相当于构建一个没有password的userWithoutPassword对象
    const { password, ...userWithoutPassword } = user;

    res.json({
      success: true,
      data: userWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取用户信息失败'
    });
  }
});

// 健康检查端点
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: '服务器运行正常' });
});

// 删除用户
app.delete('/api/users/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const users: User[] = await readUsers();
    const userIndex: number = users.findIndex(user => user.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 删除用户
    users.splice(userIndex, 1);
    const writeSuccess: boolean = await writeUsers(users);

    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        message: '删除用户失败'
      });
    }

    res.json({
      success: true,
      message: '用户删除成功'
    });

  } catch (error) {
    console.error('删除用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 更新用户信息
app.put('/api/users/:id', async (req: Request<{ id: string }, {}, UpdateUserRequest>, res: Response) => {
  try {
    const { username, email, phone, gender, hobbies, otherHobby, bio }: UpdateUserRequest = req.body;
    const users: User[] = await readUsers();
    const userIndex: number = users.findIndex(user => user.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户信息
    users[userIndex] = {
      ...users[userIndex], // 展开原对象
      username: username || users[userIndex].username,
      email: email || users[userIndex].email,
      phone: phone || users[userIndex].phone,
      gender: gender || users[userIndex].gender,
      hobbies: hobbies || users[userIndex].hobbies,
      otherHobby: otherHobby || users[userIndex].otherHobby,
      bio: bio || users[userIndex].bio,
      updatedAt: new Date().toISOString() // 强制更新字段
    };

    const writeSuccess: boolean = await writeUsers(users);

    if (!writeSuccess) {
      return res.status(500).json({
        success: false,
        message: '更新用户信息失败'
      });
    }

    // 不返回密码
    const { password, ...updatedUser } = users[userIndex];

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: updatedUser
    });

  } catch (error) {
    console.error('更新用户错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 初始化数据文件
ensureDataFile().then(() => {
  console.log('数据文件初始化完成');
});

// 管理员文件初始化
ensureAdminsFile().then(() => {
  console.log('管理员文件初始化完成');
});

// 管理员登录端点
app.post('/api/admin/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }

    const isValid = await verifyAdmin(username, password);

    if (isValid) {
      res.json({
        success: true,
        message: '登录成功',
        data: {
          username,
          role: 'admin',
          loginTime: new Date().toISOString()
        }
      });
    } else {
      res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
  } catch (error) {
    console.error('管理员登录错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误，请稍后重试'
    });
  }
});

// 管理员注销端点
app.post('/api/admin/logout', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: '注销成功'
  });
});

// 获取管理员列表
app.get('/api/admin/users', async (req: Request, res: Response) => {
  try {
    const admins = await readAdmins();
    // 不返回密码
    const adminsWithoutPassword = admins.map(admin => {
      const { password, ...adminWithoutPassword } = admin;
      return adminWithoutPassword;
    });

    res.json({
      success: true,
      data: adminsWithoutPassword
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '获取管理员列表失败'
    });
  }
});

// AI聊天端点
app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: '消息内容不能为空'
      });
    }

    // 规范化输入（去掉常见标点和多余空白）
    const normalize = (s: string) => s.replace(/[\p{P}\p{S}]/gu, '').replace(/\s+/g, ' ').toLowerCase().trim();
    const normalizedMessage = normalize(message);

    // 优先使用自定义回复（从 data/replies.txt 加载），支持正则、别名、tokens、包含匹配
    const matchRule = (rule: CustomReplyRule, msgNorm: string): boolean => {
      try {
        if (rule.type === 'regex' && rule.regex) {
          return rule.regex.test(message);
        }

        if (rule.type === 'aliases' && rule.alternatives) {
          return rule.alternatives.some(alt => msgNorm.includes(normalize(alt)));
        }

        if (rule.type === 'tokens' && rule.tokens) {
          return rule.tokens.every(t => msgNorm.includes(normalize(t)));
        }

        // include
        return msgNorm.includes(normalize(rule.raw));
      } catch (err) {
        return false;
      }
    };

    for (const rule of customReplyRules) {
      if (matchRule(rule, normalizedMessage)) {
        return res.json({
          success: true,
          data: {
            reply: rule.reply,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // 兜底的内置短语（仅当文件中没有匹配时使用）
    const specialReplies: { [key: string]: string } = {
      '你是谁': '我是由余诺设计出来的兽耳小萝莉'
    };

    for (const [key, reply] of Object.entries(specialReplies)) {
      if (message.includes(key)) {
        return res.json({
          success: true,
          data: {
            reply,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    // 调用国内AI服务
    const aiResponse = await callChineseAIService(message, conversationHistory);

    res.json({
      success: true,
      data: {
        reply: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('AI聊天错误:', error);
    res.status(500).json({
      success: false,
      message: 'AI服务暂时不可用，请稍后重试'
    });
  }
});

// 优化的 AI 服务调用函数
async function callChineseAIService(message: string, conversationHistory: any[]): Promise<string> {
  const pythonServiceUrl = 'http://127.0.0.1:8000';
  
  try {
    const pythonResp = await axios.post(`${pythonServiceUrl}/chat`, {
      message,
      conversationHistory: conversationHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
    }, {
      timeout: 30000
    });

    if (pythonResp?.data?.reply) {
      return pythonResp.data.reply;
    }
  } catch (err: any) {
    console.error('Python AI 服务调用失败:', err?.message || err);
    
    // 如果 Python 服务完全不可用，尝试直接调用智谱AI作为备用
    try {
      console.log('尝试备用方案：直接调用智谱AI');
      return await callZhipuAI(message, conversationHistory);
    } catch (error) {
      console.error('所有AI服务均失败，使用本地备用回复');
      return generateFallbackResponse(message);
    }
  }
  
  return generateFallbackResponse(message);
}

// 智谱AI调用函数
async function callZhipuAI(message: string, conversationHistory: any[]): Promise<string> {
  const apiKey = process.env.ZHIPU_API_KEY ; // 从环境变量获取
  
  // 构建对话历史
  const messages = [
    {
      role: "user",
      content: "你是一个有帮助的AI助手，用中文回答用户的问题。回答要简洁明了，专业且友好。同时每句话末尾带上“喵~”。"
    },
    ...conversationHistory.slice(-6).map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    {
      role: "user",
      content: message
    }
  ];

  const response = await axios.post('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    model: "glm-4.5v", // 使用GLM-4.5v模型
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  return response.data.choices[0]?.message?.content || '抱歉，我没有理解您的问题。';
}

// 本地部署备用方案（未引用）有密钥再加
async function callOlama(message: string, conversationHistory: any[]): Promise<string> {
  const apiKey = process.env.ZHIPU_API_KEY; // 从环境变量获取
  
  // 构建对话历史
  const messages = [
    {
      role: "user",
      content: "你是一个有帮助的AI助手，用中文回答用户的问题。回答要简洁明了，专业且友好。"
    },
    ...conversationHistory.slice(-6).map((msg: any) => ({
      role: msg.type === 'user' ? 'user' : 'assistant',
      content: msg.content
    })),
    {
      role: "user",
      content: message
    }
  ];

  const response = await axios.post('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
    model: "deepseek-llm:7b", // 使用Olama的list拥有模型（deepseek-llm:7b）
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000
  }, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: 30000
  });

  return response.data.choices[0]?.message?.content || '抱歉，我没有理解您的问题。';
}

// 备用回复生成（当AI服务不可用时）
function generateFallbackResponse(message: string): string {
  const fallbackResponses: { [key: string]: string } = {
    '你好': '你好！我是AI助手，有什么可以帮助您的吗？',
    '你是谁': '我是由余诺设计出来的兽耳小萝莉！',
    '再见': '再见！祝您有美好的一天！'
  };

  // 检查是否有匹配的回复
  for (const [key, response] of Object.entries(fallbackResponses)) {
    if (message.includes(key)) {
      return response;
    }
  }

  // 默认回复
  return `关于"${message}"，这是一个很好的问题！目前AI服务正在维护中，我会尽快恢复。您也可以尝试重新提问或稍后再试。`;
}

const PORT: string | number = process.env.PORT || 5000; // 因为没有设置env，所以为右边的5000

// 在 Express 路由处理函数中，当你调用 res.json()、res.send()、res.status().json() 等方法时，响应就已经发送给客户端了，函数后续不会再有其他代码执行。

// 只有在非测试环境才启动服务器
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
    console.log(`用户数据将保存在: ${USERS_FILE}`);
  });
}

// 导出
export { app, isValidEmail, isValidPhone };