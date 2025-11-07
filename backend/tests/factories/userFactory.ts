// 测试数据工厂

// 有效用户数据工厂
export const createUserData = (overrides = {}) => ({
  username: `testuser${Date.now()}`,  // 唯一用户名
  email: `test${Date.now()}@example.com`,  // 唯一邮箱
  password: 'password123',  // 有效密码
  phone: '13812345678',  // 有效手机号
  gender: 'male',  // 性别
  hobbies: ['reading', 'sports'],  // 兴趣爱好
  bio: '测试用户',  // 个人简介
  agreeTerms: true,  // 同意条款
  ...overrides  // 允许自定义覆盖
});
//使用 Date.now() 确保每次调用生成唯一数据  通过 overrides 参数支持自定义字段


//  无效用户数据工厂
export const createInvalidUserData = () => ({
  username: 'ab', // 太短（通常要求3字符以上）
  email: 'invalid-email',  // 无效邮箱格式
  password: '123', // 太短（通常要求6字符以上）
  phone: '123', // 无效手机号格式
  agreeTerms: false  // 未同意条款
});