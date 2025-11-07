<template>
    <div class="login-container">
        <div class="brand-card">
            <div class="particles-background" id="particles"></div>
            <div class="brand-content">
                <div class="logo">
                    <h1>Control(YN)</h1>
                </div>
                <div class="slogan">智能数据监控与管理平台</div>
                <div class="features">
                    <div class="feature">
                        <div class="feature-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <div class="feature-text">
                            <h3>实时数据监控</h3>
                            <p>实时采集前后端运行数据，即时筛查异常情况</p>
                        </div>
                    </div>

                    <div class="feature">
                        <div class="feature-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="feature-text">
                            <h3>历史数据分析</h3>
                            <p>存储历史运行数据，提供多维度分析和报表</p>
                        </div>
                    </div>

                    <div class="feature">
                        <div class="feature-icon">
                            <i class="fas fa-shield-alt"></i>
                        </div>
                        <div class="feature-text">
                            <h3><s>安全可靠</s></h3>
                            <p>0安全防护机制，无法确保数据安全</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div class="login-card">
            <div class="login-header">
                <h1>「管理员」</h1>
                <p>请输入管理员账号和密码</p>
            </div>

            <form @submit.prevent="handleLogin" class="login-form">
                <div class="form-group">
                    <label for="username">用户名</label>
                    <input id="username" v-model="loginForm.username" type="text" placeholder="请输入管理员用户名" required
                        class="form-input" />
                </div>

                <div class="form-group">
                    <label for="password">密码</label>
                    <input id="password" v-model="loginForm.password" type="password" placeholder="请输入管理员密码" required
                        class="form-input" />
                </div>

                <div v-if="errorMessage" class="error-message">
                    {{ errorMessage }}
                </div>

                <button type="submit" class="login-btn" :disabled="loading">
                    {{ loading ? '登录中...' : '登录' }}
                </button>
            </form>

            <div class="login-footer">
                <button @click="goBack" class="back-btn">
                    ← 返回首页
                </button>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

// 响应式数据
const loginForm = reactive({
  username: '',
  password: ''
})
const loading = ref(false)
const errorMessage = ref('')

// 登录处理
const handleLogin = async () => {
  if (!loginForm.username.trim() || !loginForm.password.trim()) {
    errorMessage.value = '请输入用户名和密码'
    return
  }

  loading.value = true
  errorMessage.value = ''

  try {
    const response = await axios.post('http://localhost:5000/api/admin/login', {
      username: loginForm.username,
      password: loginForm.password
    })

    if (response.data.success) {
      // 登录成功，存储登录状态并跳转到管理页面
      localStorage.setItem('adminAuthenticated', 'true')
      localStorage.setItem('adminUser', JSON.stringify(response.data.data))
      router.push('/label/admin')
    } else {
      errorMessage.value = response.data.message || '登录失败'
    }
  } catch (error: any) {
    console.error('登录失败:', error)
    if (error.response && error.response.data) {
      errorMessage.value = error.response.data.message || '登录失败'
    } else {
      errorMessage.value = '网络错误，请检查后端服务'
    }
  } finally {
    loading.value = false
  }
}

// 返回首页
const goBack = () => {
  router.push('/')
}
</script>

<style scoped>
.login-container {
    min-height: 90vh;
    min-width: 70vw;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 50px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(102, 226, 207, 0.4) 50%, rgba(243, 250, 107, 0.7) 100%);
    padding: 20px;
    border-radius: 50px;
}

.login-card {
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.2) 0%, rgba(130, 237, 221, 0.244) 50%, rgba(243, 250, 107, 0) 100%);
    border-radius: 15px;
    padding: 40px;
    min-width: 30vw;
    transition: all 0.3s ease;
}

.login-card:hover {
    backdrop-filter: blur(10px);
    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    transform: translateY(-5px) scale(1.05);
}

.login-header {
    text-align: center;
    margin-bottom: 30px;
}

.login-header h1 {
   font-size: 40px;
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

.login-header p {
    color: #7f8c8d;
    margin: 0;
}

.login-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
}

.form-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.form-group label {
    font-weight: 600;
    color: #2c3e50;
    font-size: 0.9rem;
}

.form-input {
    padding: 12px 15px;
    border: 2px solid #e1e5e9;
    border-radius: 8px;
    font-size: 1rem;
    transition: all 0.3s ease;
    background: white;
}

.form-input:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
}

.error-message {
    background: #f8d7da;
    color: #721c24;
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #f5c6cb;
    text-align: center;
    font-size: 0.9rem;
}

.login-btn {
    padding: 15px;
    background: linear-gradient(135deg, #34db90 0%, #f0f290 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 10px;
}

.login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(228, 223, 138, 0.4);
}

.login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.login-footer {
    margin-top: 30px;
    text-align: center;
}

.back-btn {
    background: none;
    border: 2px solid #bdc3c7;
    color: #7f8c8d;
    padding: 10px 20px;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
}

.back-btn {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e1e5e9;
}

.back-btn:hover {
  background: #e9ecef;
}

.back-btn {
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e1e5e9;
  z-index: 1;
}

.back-btn::before {
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

.back-btn:hover::before {
  left: 100%;
}

.back-btn:hover {
  background: #e9ecef;
  border-color: #66ead6;
}

.brand-section {
    flex: 1;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 40px;
    z-index: 1;
    overflow: hidden;
    border-right: 1px solid rgba(0, 102, 204, 0.3);
}

.particles-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
}

.brand-card{
    margin-top: 30px;
}

.brand-content {
    max-width: 600px;
    text-align: center;
    z-index: 2;
}

.logo {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 30px;
    position: relative;
}

.logo h1 {
    font-size: 40px;
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

.logo::after {
    content: '';
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 120px;
    height: 3px;
    background: linear-gradient(90deg, transparent, #0059ff80, transparent);
}

.slogan {
    font-size: 1.8rem;
    margin: 30px 0;
    font-weight: 300;
    line-height: 1.4;
    color: rgba(255, 255, 255, 0.85);
    text-shadow: 0 0 10px rgba(0, 102, 204, 0.5);
}

.features {
    text-align: left;
    max-width: 500px;
    margin: 40px auto;
}

.feature {
    display: flex;
    align-items: flex-start;
    margin-bottom: 25px;
    padding: 20px;
    background: rgba(97, 127, 135, 0.3);
    border-radius: 10px;
    backdrop-filter: blur(5px);
    transition: all 0.4s ease;
    border: 1px solid rgba(0, 102, 204, 0.2);
    position: relative;
    overflow: hidden;
}

.feature::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(0, 102, 204, 0.2), transparent);
    transition: 0.6s;
}

.feature:hover {
    background: rgba(0, 33, 66, 0.5);
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 102, 204, 0.2);
}

.feature:hover::before {
    left: 100%;
}

.feature-icon {
    min-width: 50px;
    height: 50px;
    background: rgba(0, 102, 204, 0.2);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
    margin-right: 20px;
    color: #2f00ff5d;
    border: 1px solid #0066cc00;
    box-shadow: 0 0 15px rgba(0, 102, 204, 0.3);
    backdrop-filter: blur(5px);
}

.feature-text h3 {
    font-size: 1.2rem;
    margin-bottom: 8px;
    color: #edefef;
    font-weight: 600;
}

.feature-text p {
    font-size: 0.95rem;
    opacity: 0.8;
    line-height: 1.6;
}

@media (max-width: 480px) {
    .login-card {
        padding: 30px 20px;
        min-width: 80%;
    }

    .login-container {
        min-width: none;
        flex-direction: column;
    }

    .login-header h1 {
        font-size: 1.5rem;
    }
}
</style>