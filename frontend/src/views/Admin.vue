<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>用户管理系统</h1>
      <p>管理所有注册用户信息</p>
      <div class="admin-actions">
        <button @click="refreshUsers" class="btn refresh-btn">
          🔄 刷新数据
        </button>
        <button @click="checkServerHealth" class="btn health-btn">
          🩺 检查服务状态
        </button>
        <button @click="logout" class="btn logout-btn">
          🚪 退出登录
        </button>
        <button @click="goBack" class="btn back-btn">
          ← 返回注册页
        </button>
      </div>
    </div>

    <!-- 服务状态显示 -->
    <div v-if="serverStatus" class="status-banner" :class="serverStatus.class">
      {{ serverStatus.message }}
    </div>

    <!-- 用户数据表格 -->
    <div class="users-table-container">
      <div class="table-header">
        <h2>用户列表 ({{ users.length }} 个用户)</h2>
        <div class="search-box">
          <input v-model="searchTerm" placeholder="搜索用户名、邮箱..." class="search-input" />
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>

      <div v-else-if="filteredUsers.length === 0" class="no-data">
        {{ searchTerm ? '没有找到匹配的用户' : '暂无用户数据' }}
      </div>

      <div v-else class="table-wrapper">
        <table class="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>邮箱</th>
              <th>手机号</th>
              <th>性别</th>
              <th>兴趣爱好</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in filteredUsers" :key="user.id">
              <td class="user-id">{{ user.id.slice(0, 8) }}...</td>
              <td class="username">{{ user.username }}</td>
              <td class="email">{{ user.email }}</td>
              <td class="phone">{{ user.phone || '未填写' }}</td>
              <td class="gender">
                <span class="gender-badge" :class="user.gender">
                  {{ getGenderText(user.gender) }}
                </span>
              </td>
              <td class="hobbies">
                <div class="hobbies-tags">
                  <span v-for="hobby in user.hobbies" :key="hobby" class="hobby-tag">
                    {{ getHobbyText(hobby, user.otherHobby) }}
                  </span>
                  <span v-if="user.hobbies.length === 0" class="no-hobby">无</span>
                </div>
              </td>
              <td class="created-at">{{ formatDate(user.createdAt) }}</td>
              <td class="actions">
                <button @click="viewUserDetail(user)" class="btn action-btn view-btn">
                  查看
                </button>
                <button @click="deleteUser(user.id)" class="btn action-btn delete-btn">
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 用户详情模态框 -->
    <div v-if="selectedUser" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>用户详情</h3>
          <button @click="closeModal" class="close-btn">×</button>
        </div>
        <div class="modal-body">
          <div class="user-detail">
            <div class="detail-row">
              <label>用户ID:</label>
              <span>{{ selectedUser.id }}</span>
            </div>
            <div class="detail-row">
              <label>用户名:</label>
              <span>{{ selectedUser.username }}</span>
            </div>
            <div class="detail-row">
              <label>邮箱:</label>
              <span>{{ selectedUser.email }}</span>
            </div>
            <div class="detail-row">
              <label>手机号:</label>
              <span>{{ selectedUser.phone || '未填写' }}</span>
            </div>
            <div class="detail-row">
              <label>性别:</label>
              <span>{{ getGenderText(selectedUser.gender) }}</span>
            </div>
            <div class="detail-row">
              <label>兴趣爱好:</label>
              <div class="hobbies-list">
                <span v-for="hobby in selectedUser.hobbies" :key="hobby" class="hobby-tag">
                  {{ getHobbyText(hobby, selectedUser.otherHobby) }}
                </span>
                <span v-if="selectedUser.hobbies.length === 0">无</span>
              </div>
            </div>
            <div class="detail-row" v-if="selectedUser.bio">
              <label>个人简介:</label>
              <span class="bio-text">{{ selectedUser.bio }}</span>
            </div>
            <div class="detail-row">
              <label>注册时间:</label>
              <span>{{ formatDate(selectedUser.createdAt) }}</span>
            </div>
            <div class="detail-row">
              <label>最后更新:</label>
              <span>{{ formatDate(selectedUser.updatedAt) }}</span>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeModal" class="btn primary">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted,onBeforeMount } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const API_BASE_URL = 'http://localhost:5000/api'// 后端 API 基础地址

const router = useRouter()

// 响应式数据
const users = ref<any[]>([]) // 创建响应式数组，any[] 表示任意类型的数组
const loading = ref(false)
const searchTerm = ref('')
const selectedUser = ref<any>(null)
const serverStatus = ref<{message: string, class: string} | null>(null)// 泛型定义，表示这个值可以是包含 message 和 class 的对象，或者是 null

// 路由守卫 - 检查登录状态
onBeforeMount(() => {
  const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true'
  if (!isAuthenticated) {
    router.push('/login')
  }
})

// 计算属性 - 过滤用户
const filteredUsers = computed(() => { // 创建计算属性，依赖变化时自动重新计算
  if (!searchTerm.value) return users.value
  
  const term = searchTerm.value.toLowerCase()
  return users.value.filter(user => // 数组过滤方法
    user.username.toLowerCase().includes(term) || // includes() 字符串包含检查
    user.email.toLowerCase().includes(term) ||
    (user.phone && user.phone.includes(term))
  )
})

// 返回方法
const goBack = () => {
  router.push('/label')
}

// 退出登录
const logout = async () => {
  if (confirm('确定要退出登录吗？')) {
    try {
      await axios.post(`${API_BASE_URL}/admin/logout`)
    } catch (error) {
      console.error('退出请求失败:', error)
    } finally {
      localStorage.removeItem('adminAuthenticated')
      localStorage.removeItem('adminUser')
      router.push('/login')
    }
  }
}

// 服务器健康状态检查
const checkServerHealth = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/health`)
    serverStatus.value = {
      message: `✅ ${response.data.message}`,
      class: 'success'
    }
    setTimeout(() => { serverStatus.value = null }, 3000)
  } catch (error) {
    serverStatus.value = {
      message: '❌ 后端服务连接失败，请确保服务器运行在 localhost:5000',
      class: 'error'
    }
    setTimeout(() => { serverStatus.value = null }, 5000)
  }
}

// 获取用户数据
const fetchUsers = async () => {
  loading.value = true
  try {
    const response = await axios.get(`${API_BASE_URL}/users`)
    users.value = response.data.data
  } catch (error) {
    console.error('获取用户列表失败:', error)
    alert('获取用户数据失败，请检查后端服务')
  } finally {
    loading.value = false
  }
}

const refreshUsers = () => {
  fetchUsers()
  checkServerHealth()
}

const viewUserDetail = (user: any) => {
  selectedUser.value = user
}

const closeModal = () => {
  selectedUser.value = null
}

const deleteUser = async (userId: string) => {
  if (!confirm('确定要删除这个用户吗？此操作不可恢复！')) {// confirm()：浏览器原生确认对话框
    return
  }

  try {
    // 调用后端的删除接口
    const response = await axios.delete(`${API_BASE_URL}/users/${userId}`)
    
    if (response.data.success) {
      // 从前端列表中移除
      users.value = users.value.filter(user => user.id !== userId)// 把所有未被删除的筛选出来
      alert('用户删除成功')
    }
  } catch (error: any) {
    console.error('删除用户失败:', error)
    if (error.response && error.response.data) {
      alert(error.response.data.message || '删除用户失败')
    } else {
      alert('网络错误，请检查后端服务')
    }
  }
}

const getGenderText = (gender: string) => {
  const genderMap: { [key: string]: string } = {
    'male': '男',
    'female': '女', 
    'other': '其他',
    '': '未选择'
  }
  return genderMap[gender] || '未选择'
}

const getHobbyText = (hobby: string, otherHobby: string) => {
  const hobbyMap: { [key: string]: string } = {
    'reading': '阅读',
    'sports': '运动',
    'music': '音乐',
    'travel': '旅行',
    'other': otherHobby ? `其他：${otherHobby}` : '其他'
  }
  return hobbyMap[hobby] || hobby
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

// 生命周期
onMounted(() => {
  fetchUsers()
  checkServerHealth()
})
//onMounted：组件挂载完成后执行 自动加载用户数据并检查服务状态
</script>

<style scoped>
.admin-container {
  max-width: 80vw;
  max-height: 80vh;
  border-radius: 10px;
  margin: 0 auto;
  padding: 20px;
  min-height: 90vh;
  min-width: 70vw;
  background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%,rgba(102, 226, 207,0.4) 50%, rgba(243, 250, 107, 0.7) 100%);
}

.admin-header {
  background: rgba(255, 255, 255, 0.381);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  text-align: center;
}

.admin-header {
  & h1 {
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
    margin-bottom: 40px;
    margin-bottom: 10px;
    font-size: 2.5rem;
  }
  & p {
    color: #7f8c8d;
    margin-bottom: 20px;
    font-size: 1.1rem;
  }
}


.admin-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
}

.refresh-btn {
  background: linear-gradient(135deg, #66a6ea 0%, #b478f9 100%);
  color: white;
}

.health-btn {
  background: linear-gradient(135deg, #66ead6 0%, #f7f978 100%);
  color: white;
}

.logout-btn {
  background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
  color: white;
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

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

.status-banner {
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-weight: 500;
}

.status-banner{
  & .success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
  }
  & .error {
    background: #f8d7da;
    color: #721c24;
    border: 1px solid #f5c6cb;
  }
}

.users-table-container {
  background: rgba(255, 255, 255, 0.473);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #ecf0f1;
}

.table-header h2 {
  color: #2c3e50;
  margin: 0;
}

.search-input {
  padding: 10px 15px;
  border-radius: 6px;
  font-size: 1rem;
  width: 250px;
  background: white;
  transition: all 0.3s ease;
}

.search-input:focus {
  outline: none;
  border-radius: 20px;
  border-color: #3498db;
  background:none;
}

.loading, .no-data {
  text-align: center;
  padding: 60px 20px;
  color: #7f8c8d;
  font-size: 1.1rem;
}

.table-wrapper {
  overflow-x: auto;
}

.users-table {
  width: 100%;
  max-height: 80vh;
  overflow-y: scroll;
  border-collapse: collapse;
}

.users-table {
  & th {
    background: #34495e;
    color: white;
    padding: 15px;
    text-align: left;
    font-weight: 600;
  }
  & td {
    padding: 15px;
    border-bottom: 1px solid #ecf0f1;
  }
}

.users-table tr:hover {
  background: #f8f9fa;
}

.user-id {
  font-family: monospace;
  color: #7f8c8d;
  font-size: 0.9rem;
}

.username {
  font-weight: 600;
  color: #2c3e50;
}

.email {
  color: #3498db;
}

.gender-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.gender-badge.male {
  background: #d6eaf8;
  color: #2980b9;
}

.gender-badge.female {
  background: #fadbd8;
  color: #e74c3c;
}

.gender-badge.other {
  background: #e8daef;
  color: #8e44ad;
}

.hobbies-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.hobby-tag {
  background: #e8f4fd;
  color: #3498db;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.8rem;
  white-space: nowrap;
}

.no-hobby {
  color: #bdc3c7;
  font-style: italic;
}

.actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px 12px;
  font-size: 0.8rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.view-btn {
  background: #3498db;
  color: white;
}

.delete-btn {
  background: #e74c3c;
  color: white;
}

.action-btn:hover {
  opacity: 0.8;
  transform: translateY(-1px);
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #ecf0f1;
}

.modal-header h3 {
  margin: 0;
  color: #2c3e50;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #7f8c8d;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #e74c3c;
}

.modal-body {
  padding: 30px;
}

.user-detail {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.detail-row {
  display: flex;
  align-items: flex-start;
}

.detail-row label {
  font-weight: 600;
  color: #2c3e50;
  min-width: 100px;
  margin-right: 15px;
}

.detail-row span {
  color: #34495e;
  flex: 1;
}

.bio-text {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 6px;
  border-left: 10px solid #3498db;
}

.hobbies-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.modal-footer {
  padding: 20px 30px;
  border-top: 1px solid #ecf0f1;
  text-align: right;
}

.modal-footer .btn {
  padding: 10px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .admin-container {
    padding: 10px;
    max-height: none;
  }
  
  .table-header {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }
  
  .search-input {
    width: 100%;
  }
  
  .admin-actions {
    flex-direction: column;
  }
  
  .users-table {
    font-size: 0.9rem;
  }
  
  .users-table th,
  .users-table td {
    padding: 8px 4px;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .detail-row {
    flex-direction: column;
    gap: 5px;
  }
  
  .detail-row label {
    min-width: auto;
  }
}
</style>