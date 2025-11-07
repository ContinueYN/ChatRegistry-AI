// 集成测试--用于测试用户管理系统的完整流程
// 验证多个组件协同工作 使用真实数据持久化
import request from 'supertest';  // HTTP 请求测试库
import { promises as fs } from 'fs';  // 文件系统操作
import path from 'path';  // 路径处理
import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';

const app = require('../../src/server').app;  // 被测试的 Express 应用

describe('用户管理系统集成测试', () => {
  let testUserId: string;

  beforeAll(async () => {
    // 确保数据目录存在
    try {
      await fs.mkdir(path.join(__dirname, '../../data'), { recursive: true });
    } catch (error) {
      // 目录已存在
    }
  });

  afterAll(async () => {
    // 清理测试数据
    try {
      await fs.unlink(path.join(__dirname, '../../data/users.json'));
    } catch (error) {
      // 文件不存在也没关系
    }
  });

  test('完整用户生命周期测试', async () => {
    // 1. 注册用户
    const registerResponse = await request(app)
      .post('/api/users/register')
      .send({
        username: 'integrationtest',
        email: 'integration@test.com',
        password: 'password123',
        phone: '13812345678',
        gender: 'female',
        hobbies: ['music', 'travel'],
        bio: '集成测试用户',
        agreeTerms: true
      })
      .expect(201);

    testUserId = registerResponse.body.data.id;  // 保存用户ID供后续使用

    // 2. 获取用户列表
    const listResponse = await request(app)
      .get('/api/users')
      .expect(200);

    expect(listResponse.body.data.length).toBeGreaterThan(0);  // 期望结果大于0

    // 3. 获取特定用户
    const userResponse = await request(app)
      .get(`/api/users/${testUserId}`)
      .expect(200);

    expect(userResponse.body.data.username).toBe('integrationtest');  // 期望用户名严格为。。。

    // 4. 更新用户信息
    const updateResponse = await request(app)
      .put(`/api/users/${testUserId}`)
      .send({
        bio: '更新后的简介'
      })
      .expect(200);

    expect(updateResponse.body.data.bio).toBe('更新后的简介'); // 期望更新后的结果正常

    // 5. 删除用户
    const deleteResponse = await request(app)
      .delete(`/api/users/${testUserId}`)
      .expect(200);

    expect(deleteResponse.body.success).toBe(true);  // 期望删除操作正常
  });

  test('健康检查端点', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);

    expect(response.body.status).toBe('OK');
  });
});