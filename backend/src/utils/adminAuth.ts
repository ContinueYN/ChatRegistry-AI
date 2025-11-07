import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// 数据文件路径 - 从 utils 目录回到 src 下的 data 文件夹
const DATA_DIR = path.join(__dirname, '../data');
const ADMINS_FILE = path.join(DATA_DIR, 'admins.json');

// 管理员接口
interface Admin {
  id: string;
  username: string;
  password: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

// 确保管理员文件存在
const ensureAdminsFile = async (): Promise<void> => {
  try {
    await fs.access(DATA_DIR);
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true });
  }
  
  try {
    await fs.access(ADMINS_FILE);
  } catch {
    // 创建默认管理员
    const defaultAdmin: Admin = {
      id: uuidv4(),
      username: 'admin',
      password: 'admin123', // 明文密码
      role: 'superadmin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await fs.writeFile(ADMINS_FILE, JSON.stringify([defaultAdmin], null, 2));
    console.log('默认管理员账号已创建: admin / admin123');
    console.log('管理员文件位置:', ADMINS_FILE);
  }
};

// 读取管理员数据
const readAdmins = async (): Promise<Admin[]> => {
  try {
    await ensureAdminsFile();
    const data = await fs.readFile(ADMINS_FILE, 'utf8');
    return JSON.parse(data) as Admin[];
  } catch (error) {
    console.error('读取管理员数据失败:', error);
    return [];
  }
};

// 验证管理员登录
const verifyAdmin = async (username: string, password: string): Promise<boolean> => {
  try {
    const admins = await readAdmins();
    const admin = admins.find(a => a.username === username);
    
    if (!admin) {
      return false;
    }
    
    // 直接比较明文密码
    return admin.password === password;
  } catch (error) {
    console.error('验证管理员失败:', error);
    return false;
  }
};

// 添加新管理员
const addAdmin = async (username: string, password: string, role: string = 'admin'): Promise<boolean> => {
  try {
    const admins = await readAdmins();
    
    // 检查用户名是否已存在
    if (admins.some(admin => admin.username === username)) {
      return false;
    }
    
    const newAdmin: Admin = {
      id: uuidv4(),
      username,
      password,
      role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    admins.push(newAdmin);
    await fs.writeFile(ADMINS_FILE, JSON.stringify(admins, null, 2));
    return true;
  } catch (error) {
    console.error('添加管理员失败:', error);
    return false;
  }
};

export { ensureAdminsFile, verifyAdmin, addAdmin, readAdmins };