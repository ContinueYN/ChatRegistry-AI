//Node.js 的 Web 框架，用于创建服务器和路由
const express = require('express');

//跨域资源共享中间件，允许不同域的客户端访问
const cors = require('cors');

//文件系统模块的 Promise 版本，用于异步文件操作
const fs = require('fs').promises;

//路径处理模块，用于安全地构建文件路径
const path = require('path');

//生成唯一标识符的库，{ v4: uuidv4 } 是解构赋值语法
const { v4: uuidv4 } = require('uuid');

//创建 Express 应用实例
const app = express();

// 中间件
app.use(cors());//启用跨域请求
app.use(express.json());//解析 JSON 格式的请求体

// 数据文件路径 & path.join(): 安全地拼接路径，避免跨平台问题
const DATA_DIR = path.join(__dirname, 'data');//  __dirname: Node.js 全局变量，表示当前文件所在目录:/data
const USERS_FILE = path.join(DATA_DIR, 'users.json');//  :/data/users.json

// 确保数据目录和文件存在
const ensureDataFile = async () => {
  try {
    await fs.access(DATA_DIR);//fs.access(): 检查文件/目录是否存在
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });//没有就当场建一个呗~
  }
  
  try {
    await fs.access(USERS_FILE);//如上~~~
  } catch {
    // 文件不存在，创建空的 JSON 数组
    await fs.writeFile(USERS_FILE, JSON.stringify([], null, 2));//JSON.stringify([], null, 2): 将空数组格式化为美观的 JSON : null 或省略：所有属性都会被包含
  }//JSON.stringify(value[, replacer[, space]])第一个参数：value - 要转换的值  第二个参数：replacer - 转换函数或数组  第三个参数：space - 缩进空格数
};

// 读取用户数据
const readUsers = async () => {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf8');//  fs.readFile(): 异步读取文件内容
    return JSON.parse(data);//  JSON.parse(): 将 JSON 字符串解析为 JavaScript 对象
  } catch (error) {
    console.error('读取用户数据失败:', error);// 返回了错误信息~
    return [];
  }
};

// 写入用户数据
const writeUsers = async (users) => {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));// 同上，把要存的东西转成JSON格式存入
    return true;
  } catch (error) {
    console.error('写入用户数据失败:', error);
    return false;
  }
};

// 验证邮箱格式
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);//test() 方法检查字符串是否匹配正则，正则就是上面一行
};

// 验证手机格式
const isValidPhone = (phone) => {
  if (!phone) return true; // 手机号可选
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phone);
};

// 注册新用户
app.post('/api/users/register', async (req, res) => {//app.post(): 定义 POST 请求路由
  try {
    const { username, email, password, phone, gender, hobbies, otherHobby, bio, agreeTerms } = req.body;//使用解构赋值从请求体中提取字段

    // 基本验证
    if (!username || username.length < 3) {  //400表示前端报错  res.status():设置 HTTP 状态码
      return res.status(400).json({   //.json(): 返回 JSON 格式的响应
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
    const users = await readUsers();

    // 检查用户是否已存在
    const existingUserByEmail = users.find(user => user.email === email);  // array.find(): 查找数组中满足条件的第一个元素
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已被注册'
      });
    }

    const existingUserByUsername = users.find(user => user.username === username);
    if (existingUserByUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已被使用'
      });
    }

    // 创建新用户 
    const newUser = {
      id: uuidv4(),// uuidv4(): 生成唯一 ID
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
    users.push(newUser);// array.push(): 向数组末尾添加元素
    const writeSuccess = await writeUsers(users);

    if (!writeSuccess) {
      return res.status(500).json({// 500表示后端报错
        success: false,
        message: '保存用户数据失败'
      });
    }

    // 返回用户信息（不包含密码）
    const userResponse = { ...newUser };// 扩展运算符 ...: 创建对象的浅拷贝
    delete userResponse.password;// delete: 删除对象属性

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
app.get('/api/users', async (req, res) => {// app.get(): 定义 GET 请求路由
  try {
    const users = await readUsers();
    // 不返回密码
    const usersWithoutPassword = users.map(user => {// array.map(): 遍历数组并返回新数组
      const { password, ...userWithoutPassword } = user;// 剩余参数语法：{ password, ...userWithoutPassword } 提取 password，剩余属性放入新对象
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
app.get('/api/users/:id', async (req, res) => {// :id: 路由参数，通过 req.params.id 访问
  try {
    const users = await readUsers();
    const user = users.find(u => u.id === req.params.id);
    
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '服务器运行正常' });
});

// 删除用户
app.delete('/api/users/:id', async (req, res) => {
  try {
    const users = await readUsers();
    const userIndex = users.findIndex(user => user.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 删除用户
    users.splice(userIndex, 1);
    const writeSuccess = await writeUsers(users);

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
app.put('/api/users/:id', async (req, res) => {
  try {
    const { username, email, phone, gender, hobbies, otherHobby, bio } = req.body;
    const users = await readUsers();
    const userIndex = users.findIndex(user => user.id === req.params.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 更新用户信息
    users[userIndex] = {
      ...users[userIndex],// 展开原对象
      username: username || users[userIndex].username,
      email: email || users[userIndex].email,
      phone: phone || users[userIndex].phone,
      gender: gender || users[userIndex].gender,
      hobbies: hobbies || users[userIndex].hobbies,
      otherHobby: otherHobby || users[userIndex].otherHobby,
      bio: bio || users[userIndex].bio,
      updatedAt: new Date().toISOString()// 强制更新字段
    };

    const writeSuccess = await writeUsers(users);

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

const PORT = process.env.PORT || 5000;// 因为没有设置env，所以为右边的5000

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
  console.log(`用户数据将保存在: ${USERS_FILE}`);
});

//在 Express 路由处理函数中，当你调用 res.json()、res.send()、res.status().json() 等方法时，响应就已经发送给客户端了，函数后续不会再有其他代码执行。