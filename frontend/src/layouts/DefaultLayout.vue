<template>
  <div class="default-layout">
    <header class="header">
      <nav>
        <router-link to="/" exact-active-class="active">首页</router-link>
        <router-link to="/more" active-class="active">更多</router-link>
      </nav>
    </header>
    
    <main class="main-content">
      <RouterView />  <!-- 页面内容在这里渲染 -->
    </main>
    
    <footer class="footer">
      <p>&copy; 2025 YN</p>
    </footer>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, rgba(255, 254, 254, 0.2) 0%,rgba(102, 226, 207,0.4) 50%, rgba(107, 138, 250, 0.7) 100%);
  padding: 1rem;
  border-radius: 10px
}

nav {
  display: flex;
  justify-content: center; /* 水平居中 */
  gap: 2rem;
}

nav {
  text-decoration: none;
  padding: 0rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

nav .active {
  font-weight: 600; 
  font-size: 1.05em;
}

.footer {
  padding: 1rem;
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center;
  background: linear-gradient(180deg,rgba(156, 69, 255, 0.596) 50%, rgb(55, 21, 248) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  text-decoration: none;
  transition: all 0.3s ease;     /* 垂直居中 */
}
</style>