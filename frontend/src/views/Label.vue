<template>
  <div id="app">
    <!-- 表单页面 -->
    <div v-if="currentPage === 'form'" class="container">
      <div class="header">
        <h1>用户注册</h1>
        <p>请填写以下信息完成注册</p>
      </div>

      <form @submit.prevent="handleSubmit" class="form">
        <div class="form-row">
          <div class="form-group">
            <label for="username">用户名 *</label>
            <input type="text" id="username" v-model="formData.username" required placeholder="请输入用户名" />
            <span class="error" v-if="errors.username">{{ errors.username }}</span>
          </div>

          <div class="form-group">
            <label for="email">邮箱 *</label>
            <input type="email" id="email" v-model="formData.email" required placeholder="请输入邮箱地址" />
            <span class="error" v-if="errors.email">{{ errors.email }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="password">密码 *</label>
            <input type="password" id="password" v-model="formData.password" required placeholder="请输入密码" />
            <span class="error" v-if="errors.password">{{ errors.password }}</span>
          </div>

          <div class="form-group">
            <label for="confirmPassword">确认密码 *</label>
            <input type="password" id="confirmPassword" v-model="formData.confirmPassword" required
              placeholder="请再次输入密码" />
            <span class="error" v-if="errors.confirmPassword">{{ errors.confirmPassword }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="phone">手机号码</label>
            <input type="tel" id="phone" v-model="formData.phone" placeholder="请输入手机号码" />
          </div>

          <div class="form-group">
            <label for="gender">性别</label>
            <select id="gender" v-model="formData.gender">
              <option value="">请选择</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">其他</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label>兴趣爱好</label>
          <div class="checkbox-group">
            <label class="checkbox">
              <input type="checkbox" v-model="formData.hobbies" value="reading"> 阅读
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="formData.hobbies" value="sports"> 运动
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="formData.hobbies" value="music"> 音乐
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="formData.hobbies" value="travel"> 旅行
            </label>
            <label class="checkbox">
              <input type="checkbox" v-model="formData.hobbies" value="other"
                @change="handleOtherCheckboxChange(($event.target as HTMLInputElement).checked)">
              其他
              <span class="other-hobby-link" @click="openOtherHobbyModal" v-if="formData.hobbies.includes('other')">
                「点击填写」
              </span>
            </label>
          </div>
        </div>

        <!-- 添加弹窗（原来添加弹窗部分去除，换成这个） -->
        <OtherHobbyModal 
        :show="showOtherHobbyModal"
        :current-value="formData.otherHobby"
        @update:show="showOtherHobbyModal = $event"
        @save="saveOtherHobby"
      />

        <div class="form-group">
          <label for="bio">个人简介</label>
          <textarea id="bio" v-model="formData.bio" rows="4" placeholder="请介绍一下自己..."></textarea>
        </div>

        <div class="form-group">
          <label class="checkbox">
            <input type="checkbox" v-model="formData.agreeTerms"> 我同意 <a @click="goToHome()">用户协议</a> 和 <a @click="goToMore()">隐私政策</a> *
          </label>
          <span class="error" v-if="errors.agreeTerms">{{ errors.agreeTerms }}</span>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn primary">注册</button>
          <button type="button" @click="handleReset" class="btn secondary">重置</button>
        </div>
      </form>
    </div>

    <!-- 完成页面 -->
    <div v-else-if="currentPage === 'success'" class="container success-page">
      <div class="header">
        <h1>注册成功！</h1>
        <p>感谢您的注册，以下是您提交的信息：</p>
      </div>

      <div class="submitted-data">
        <div class="data-item">
          <strong>用户名：</strong>
          <span>{{ formData.username }}</span>
        </div>

        <div class="data-item">
          <strong>邮箱：</strong>
          <span>{{ formData.email }}</span>
        </div>

        <div class="data-item">
          <strong>手机号码：</strong>
          <span>{{ formData.phone || '未填写' }}</span>
        </div>

        <div class="data-item">
          <strong>性别：</strong>
          <span>{{ getGenderText(formData.gender) }}</span>
        </div>

        <div class="data-item">
          <strong>兴趣爱好：</strong>
          <span>{{ getHobbiesText(formData.hobbies) }}</span>
        </div>

        <div class="data-item">
          <strong>个人简介：</strong>
          <span>{{ formData.bio || '未填写' }}</span>
        </div>
      </div>

      <div class="success-actions">
        <button @click="backToForm" class="btn primary">返回修改</button>
        <button @click="handleConfirm" class="btn secondary">确认信息</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import OtherHobbyModal from '@/components/OtherHobbyModal.vue'
// 引入类型
import { type FormData } from '@/types'
import { useRouter } from 'vue-router';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const router = useRouter();

const goToHome = () => {
  router.push('/')
}
const goToMore = () => {
  router.push('/more')
}

// 添加页面状态
const currentPage = ref('form') // 'form' 或 'success'

const formData = reactive<FormData>({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  gender: '',
  hobbies: [],
  otherHobby: '',
  bio: '',
  agreeTerms: false
})

const showOtherHobbyModal = ref(false)
const tempOtherHobby = ref('')

const errors = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeTerms: ''
})

// 辅助函数
const getGenderText = (gender: string) => {
  const genderMap: { [key: string]: string } = {
    'male': '男',
    'female': '女', 
    'other': '其他',
    '': '未选择'
  }
  return genderMap[gender] || '未选择'
}

const getHobbiesText = (hobbies: string[]) => {
  if (!hobbies || hobbies.length === 0) return '未选择'
  
  const hobbyMap: { [key: string]: string } = {
    'reading': '阅读',
    'sports': '运动',
    'music': '音乐',
    'travel': '旅行',
    'other': formData.otherHobby ? `其他：${formData.otherHobby}` : '其他' // 修改这一行
  }
  
  return hobbies.map(hobby => hobbyMap[hobby] || hobby).join('，')
}

const validateForm = (): boolean => {
  let isValid = true

  // 清空错误信息
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })

  // 用户名验证
  if (!formData.username.trim()) {
    errors.username = '用户名不能为空'
    isValid = false
  } else if (formData.username.length < 3) {
    errors.username = '用户名至少3个字符'
    isValid = false
  }

  // 邮箱验证
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!formData.email) {
    errors.email = '邮箱不能为空'
    isValid = false
  } else if (!emailRegex.test(formData.email)) {
    errors.email = '请输入有效的邮箱地址'
    isValid = false
  }

  // 密码验证
  if (!formData.password) {
    errors.password = '密码不能为空'
    isValid = false
  } else if (formData.password.length < 6) {
    errors.password = '密码至少6个字符'
    isValid = false
  }

  // 确认密码验证
  if (!formData.confirmPassword) {
    errors.confirmPassword = '请确认密码'
    isValid = false
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = '两次输入的密码不一致'
    isValid = false
  }

  // 协议同意验证
  if (!formData.agreeTerms) {
    errors.agreeTerms = '必须同意用户协议和隐私政策'
    isValid = false
  }

  return isValid
}

const handleSubmit = async () => {
  if (validateForm()) {
    try {
      const response = await axios.post(`${API_BASE_URL}/users/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        gender: formData.gender,
        hobbies: formData.hobbies,
        otherHobby: formData.otherHobby,
        bio: formData.bio,
        agreeTerms: formData.agreeTerms
      });
      
      if (response.data.success) {
        console.log('注册成功:', response.data.data);
        currentPage.value = 'success';
      }
    } catch (error: any) {
      console.error('注册失败:', error);
      if (error.response && error.response.data) {
        alert(error.response.data.message || '注册失败，请稍后重试');
        
        // 处理后端返回的错误信息
        if (error.response.data.message.includes('用户名')) {
          errors.username = error.response.data.message;
        } else if (error.response.data.message.includes('邮箱')) {
          errors.email = error.response.data.message;
        } else if (error.response.data.message.includes('密码')) {
          errors.password = error.response.data.message;
        } else if (error.response.data.message.includes('协议')) {
          errors.agreeTerms = error.response.data.message;
        }
      } else {
        alert('网络错误，请检查后端服务是否启动');
      }
    }
  }
};

const handleReset = () => {
  Object.assign(formData, {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    gender: '',
    hobbies: [],
    bio: '',
    agreeTerms: false
  })
  
  Object.keys(errors).forEach(key => {
    errors[key as keyof typeof errors] = ''
  })
}

const backToForm = () => {
  currentPage.value = 'form'
}

const handleConfirm = () => {
  alert('信息确认完成！')
  currentPage.value = 'form'
}

const openOtherHobbyModal = () => {
  tempOtherHobby.value = formData.otherHobby
  showOtherHobbyModal.value = true
}

const saveOtherHobby = (value: string) => {
  formData.otherHobby = value
  // 如果填写了内容，自动勾选其他选项
  if (value.trim()) {
    if (!formData.hobbies.includes('other')) {
      formData.hobbies.push('other')
    }
  }
}


// 当取消勾选"其他"时清空内容
const handleOtherCheckboxChange = (checked: boolean) => {
  if (!checked) {
    formData.otherHobby = ''
  }
}
</script>

<style>
html{
  user-select: none;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-image: url(@/assets/images/background.jpg);
  background-position: center;
  background-repeat:no-repeat;
  background-size: cover;
  min-height: 100vh;
  padding: 40px 20px;
}

#app {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;
  min-width: 60vw;
}

.container {
  background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%,rgba(102, 226, 207,0.4) 50%, rgba(243, 250, 107, 0.7) 100%);
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 40px;
  width: 100%;
  max-width: 800px;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  background: linear-gradient(170deg,
      rgba(106, 144, 227, 0.842) 0%,
      rgba(118, 97, 240, 0.831) 30%,
      rgba(69, 165, 255, 0.792) 60%,
      rgba(91, 88, 247, 0.744) 80%,
      rgba(58, 171, 242, 0.82) 100%);
  background-size: 400% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: gradient-flow 5s ease-in-out infinite;
}

@keyframes gradient-flow {
  0% {
    background-position: 0% 50%;
  }
  20% {
    background-position: 50% 50%;
  }
  40% {
    background-position: 100% 50%;
  }
  70% {
    background-position: 50% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

.header p {
  color: #666;
  font-size: 1rem;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  font-size: 0.9rem;
}

input, select, textarea {
  padding: 12px;
  border: 2px solid #9ee4f3;
  border-radius: 6px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #fff;
}

input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #f7f182;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

textarea {
  resize: vertical;
  min-height: 100px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-top: 5px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
  cursor: pointer;
}

.checkbox input[type="checkbox"] {
  width: 18px;
  height: 18px;
  margin: 0;
}

.error {
  color: #e74c3c;
  font-size: 0.8rem;
  margin-top: 4px;
}

.form-actions {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.btn {
  flex: 1;
  padding: 14px;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn.primary {
  background: linear-gradient(135deg, #66ead6 0%, #f7f978 100%);
  color: white;
}

.btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
}

.btn.secondary {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e1e5e9;
}

.btn.secondary:hover {
  background: #e9ecef;
}

a {
  background: linear-gradient(180deg,rgba(156, 69, 255, 0.596) 50%, rgb(55, 21, 248) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  text-decoration: none;
  transition: all 0.3s ease;
}

a:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
}

/* 完成页面样式 */
.success-page {
  text-align: center;
}

.submitted-data {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 30px;
  margin: 30px 0;
  text-align: left;
}

.data-item {
  display: flex;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e9ecef;
}

.data-item:last-child {
  margin-bottom: 0;
  padding-bottom: 0;
  border-bottom: none;
}

.data-item strong {
  min-width: 100px;
  color: #333;
}

.data-item span {
  flex: 1;
  color: #666;
}

.success-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.input {
    line-height: 28px;
    border: 2px solid transparent;
    border-bottom-color: #777;
    padding: 12px;
    outline: none;
    background-color: transparent;
    color: #0d0c22;
    transition: .3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.input:focus,
input:hover {
    outline: none;
    padding: 12px;
    border-radius: 1rem;
    border-color: #fdff91;
}


@media (max-width: 768px) {
  body {
    background-image: url(@/assets/images/background2.jpg);
  }
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .data-item {
    flex-direction: column;
    gap: 5px;
  }
  
  .data-item strong {
    min-width: auto;
  }
  
  .success-actions {
    flex-direction: column;
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 900px;
    padding: 50px;
  }
}

/* 其他兴趣样式 */
.other-hobby-link {
  background: linear-gradient(180deg,rgba(156, 69, 255, 0.596) 50%, rgb(55, 21, 248) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  cursor: pointer;
  margin-left: 5px;
  transition: all 0.3s ease;
}

.other-hobby-link:hover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  background-clip: text;
}
/* 流光效果 */
.btn.secondary {
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e1e5e9;
  z-index: 1;
}

.btn.secondary::before {
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

.btn.secondary:hover::before {
  left: 100%;
}

.btn.secondary:hover {
  background: #e9ecef;
  border-color: #66ead6;
}
</style>
