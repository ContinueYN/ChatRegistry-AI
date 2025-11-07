// 单元测试文件，专门测试服务器端的用户管理 API
// 验证单个功能是否正确 使用模拟数据
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';

// tests/unit/server.test.ts
const request = require('supertest');

// 模拟文件系统和 UUID 模块
jest.mock('fs');
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-123')  // 固定返回测试 UUID
}));

// 导入 app
const app = require('../../src/server').app;

// Mock fs
const fs = require('fs');

describe('用户注册 API', () => {
  beforeEach(() => {
    jest.clearAllMocks();  // 清除所有模拟调用记录

    // 设置 fs 模块的默认模拟行为
    fs.promises.readFile.mockResolvedValue(JSON.stringify([]));  // 模拟空用户列表
    fs.promises.writeFile.mockResolvedValue(undefined);  // 模拟写入成功
    fs.promises.access.mockRejectedValue(new Error('File does not exist'));  // 模拟文件不存在
    fs.promises.mkdir.mockResolvedValue(undefined);  // 模拟创建目录成功
  });

  describe('POST /api/users/register', () => {
    test('应该成功创建新用户', async () => {
      const mockUserData = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        phone: '13812345678',
        gender: 'male',
        hobbies: ['reading', 'sports'],
        bio: '测试用户',
        agreeTerms: true
      };

      const response = await request(app)
        .post('/api/users/register')
        .send(mockUserData)
        .expect(201);

      // 验证响应数据
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.data.email).toBe('test@example.com');
      expect(response.body.data.password).toBeUndefined();  // 密码不应返回
    });

    test('应该验证用户名长度', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'ab',  // 太短
          email: 'test@example.com',
          password: 'password123',
          agreeTerms: true
        })
        .expect(400);

      expect(response.body.message).toContain('用户名至少3个字符');
    });

    test('应该验证邮箱格式', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',  // 无效邮箱
          password: 'password123',
          agreeTerms: true
        })
        .expect(400);

      expect(response.body.message).toContain('有效的邮箱地址');
    });

    test('应该验证密码长度', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123',  // 太短
          agreeTerms: true
        })
        .expect(400);

      expect(response.body.message).toContain('密码至少6个字符');
    });

    test('应该验证用户协议', async () => {
      const response = await request(app)
        .post('/api/users/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          agreeTerms: false  // 未同意协议
        })
        .expect(400);

      expect(response.body.message).toContain('同意用户协议');
    });
  });

  describe('GET /api/users', () => {
    test('应该返回所有用户列表', async () => {
      const mockUser = {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        phone: '',
        gender: '',
        hobbies: [],
        otherHobby: '',
        bio: '',
        agreeTerms: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      fs.promises.readFile.mockResolvedValue(JSON.stringify([mockUser]));

      const response = await request(app)
        .get('/api/users')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /api/users/:id', () => {
    test('应该返回指定用户信息', async () => {
      const mockUser = {
        id: 'test-id',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashed',
        phone: '',
        gender: '',
        hobbies: [],
        otherHobby: '',
        bio: '',
        agreeTerms: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      fs.promises.readFile.mockResolvedValue(JSON.stringify([mockUser]));

      const response = await request(app)
        .get('/api/users/test-id')
        .expect(200);

      expect(response.body.data.id).toBe('test-id');
    });

    test('应该处理不存在的用户', async () => {
      fs.promises.readFile.mockResolvedValue(JSON.stringify([]));

      const response = await request(app)
        .get('/api/users/non-existent-id')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('健康检查端点', () => {
    test('应该返回健康状态', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
    });
  });
});