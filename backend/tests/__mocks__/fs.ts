// tests/__mocks__/fs.ts
import { jest } from '@jest/globals';
// Mock(模拟) 文件系统
export const promises = {
  access: jest.fn(), // 模拟文件访问检查
  mkdir: jest.fn(),  // 模拟创建目录
  readFile: jest.fn(),  // 模拟读取文件
  writeFile: jest.fn(),  // 模拟写入文件
  unlink: jest.fn()  // 模拟删除文件
};
//这些方法对应 Node.js fs.promises API：
// access() - 检查文件是否存在或是否有访问权限 
// mkdir() - 创建目录 
// readFile() - 读取文件内容 
// writeFile() - 写入文件内容 
// unlink() - 删除文件
// 默认导出
export default { promises };