// Jest 测试全局配置文件
import { jest,afterEach } from '@jest/globals';
// 测试全局设置
jest.setTimeout(10000);  // 设置单个测试用例的超时时间为10秒

// 清理 mock
afterEach(() => {
  jest.clearAllMocks();  // 在每个测试用例结束后清理所有模拟调用
});