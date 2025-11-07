import { createRouter, createWebHistory } from 'vue-router'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import EmptyLayout from '@/layouts/EmptyLayout.vue'
import Home from '@/views/Home.vue'
import More from '@/views/More.vue'
import Label from '@/views/Label.vue'
import Music from '@/views/Music.vue'
import Tool from '@/views/Tool.vue'
import Admin from '@/views/Admin.vue'  
import Lottery from '@/views/Lottery.vue'
import Login from '@/views/Login.vue' 
import AIAssistant from '@/views/AIAssistant.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/",
      component: DefaultLayout,
      children: [
        {
          path: "/",
          name: "Home",
          component: Home,
        },
        {
          path: "/more",
          name: "More",
          component: More,
        },
      ],
    },
    {
      path: "/label",
      component: EmptyLayout,
      children: [
        {
          path: "/label",
          name: "Label",
          component: Label,
        },
        {
          path: "/label/admin",
          name: "Admin",
          component: Admin,
          meta: { requiresAuth: true }
        },
      ],
    },
    {
      path: "/music",
      component: EmptyLayout,
      children: [
        {
          path: "/music",
          name: "Music",
          component: Music,
        },
      ],
    },
    {
      path: "/tool",
      component: EmptyLayout,
      children: [
        {
          path: "/tool",
          name: "Tool",
          component: Tool,
        },
      ],
    },
    {
      path: "/lottery",
      component: EmptyLayout,
      children: [
        {
          path: "/lottery",
          name: "Lottery",
          component: Lottery,
        },
      ],
    },
    {
      path: "/login", 
      component: EmptyLayout,
      children: [
        {
          path: "/login",
          name: "Login",
          component: Login,
        },
      ],
    },
    {
      path: "/ai",
      component: EmptyLayout,
      children: [
        {
          path: "/ai",
          name: "AIAssistant",
          component: AIAssistant,
        },
      ],
    },
  ],
});

// 路由守卫 - 检查认证状态
router.beforeEach((to, from, next) => {
  const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true'
  
  if (to.meta.requiresAuth && !isAuthenticated) {
    // 如果需要认证但未登录，重定向到登录页面
    next('/login')
  } else {
    next()
  }
})

export default router;