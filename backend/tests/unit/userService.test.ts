//业务逻辑单元测试文件，专门测试用户服务中的验证工具函数
import { isValidEmail, isValidPhone } from '../../src/server';  // 导入要测试的工具函数
import { describe, test, expect } from '@jest/globals';

describe('业务逻辑验证', () => {
  describe('邮箱验证', () => {
    test('应该验证有效邮箱', () => {
      expect(isValidEmail('test@example.com')).toBe(true);  // 标准邮箱
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);  // 带点和多级域名
    });

    test('应该拒绝无效邮箱', () => {
      expect(isValidEmail('invalid-email')).toBe(false);  // 无@符号
      expect(isValidEmail('test@')).toBe(false);  // 无域名
      expect(isValidEmail('@example.com')).toBe(false);  // 无用户名
      expect(isValidEmail('')).toBe(false);  // 空字符串
    });
  });

  describe('手机号验证', () => {
    test('应该验证有效手机号', () => {
      expect(isValidPhone('13812345678')).toBe(true);  // 138号段
      expect(isValidPhone('13987654321')).toBe(true);  // 139号段
    });

    test('应该拒绝无效手机号', () => {
      expect(isValidPhone('123456')).toBe(false);  // 长度不够
      expect(isValidPhone('1381234567a')).toBe(false);  // 包含字母
      expect(isValidPhone('23812345678')).toBe(false);  // 非1开头
    });

    test('空手机号应该通过验证', () => {
      expect(isValidPhone('')).toBe(true);  // 空字符串
      expect(isValidPhone(undefined as any)).toBe(true);  // undefined
    });
  });
});