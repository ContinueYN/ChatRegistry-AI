<template>
  <div class="container">
    <h1>祝您体验愉快~</h1>

    <div class="cards-container">
      <div
        v-for="(card, index) in cards"
        :key="index"
        class="card"
      >
        <!-- 反光层 -->
        <div class="card-glare"></div>

        <!-- 图标 -->
        <div class="card-icon">
          <i :class="card.icon"></i>
        </div>

        <!-- 标题 -->
        <h3 class="card-title">{{ card.title }}</h3>

        <!-- 内容 -->
        <p class="card-content">{{ card.content }}</p>

        <!-- 按钮 -->
        <button class="card-button" @click="goToPage(card.page)">{{card.trans_route}}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
const router = useRouter();

const goToPage = (route) => {
  router.push(route)
}

// 定义卡片数据
const cards = ref([
  {
    icon: 'fas fa-rocket',
    title: '抽奖系统',
    content: '采用前沿技术栈，打造高性能、界面美观的现代化3D抽奖系统。',
    trans_route: '试一试',
    page: '/lottery'
  },
  {
    icon: 'fas fa-paint-brush',
    title: '后台管理',
    content: '只为后台管理人员提供，便于数据的管理以及检测。',
    trans_route: '去登陆',
    page: '/login'
  },
  {
    icon: 'fas fa-code',
    title: 'AI助手',
    content: '给予您陪伴，为您提供更细心的服务，有什么不解的地方可以向其询问。',
    trans_route: '聊一聊',
    page: '/ai'
  }
]);
</script>

<style scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 100%;
  background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%,rgba(102, 226, 207,0.4) 50%, rgba(243, 250, 107, 0.7) 100%);
  font-family: 'Arial', sans-serif;
  overflow: hidden;
  height: 75vh;
  padding-top: 50px;
}

h1 {
  background: linear-gradient(
    170deg,
    rgba(106, 144, 227, 0.842) 0%,
    rgba(118, 97, 240, 0.831) 30%,
    rgba(69, 165, 255, 0.792) 60%,
    rgba(91, 88, 247, 0.744) 80%,
    rgba(58, 171, 242, 0.82) 100%
  );
  background-size: 400% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
  animation: gradient-flow 5s ease-in-out infinite;
  margin-bottom: 40px;
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

.cards-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  perspective: 1000px;
}

.card {
  width: 300px;
  height: 380px;
  border-radius: 20px;
  background: rgba(54, 216, 237, 0.078);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  transform-style: preserve-3d;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  cursor: pointer;
}

.card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: all 0.5s;
}

.card:hover {
  transform: translateY(-15px) rotateX(5deg) rotateY(-5deg) scale(1.03);
  box-shadow: 0 20px 30px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.card:hover::before {
  transform: translateX(100%);
}

.card-icon {
  font-size: 60px;
  margin-bottom: 25px;
  color: #fff;
  transition: all 0.3s ease;
  transform: translateZ(30px);
}

.card:hover .card-icon {
  transform: translateZ(50px) scale(1.2);
  color: #ffdb58;
}

.card-title {
  font-size: 26px;
  font-weight: 700;
  color: white;
  margin-bottom: 15px;
  transition: all 0.3s ease;
  transform: translateZ(20px);
}

.card:hover .card-title {
  transform: translateZ(40px);
  color: #ffdb58;
}

.card-content {
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 25px;
  transform: translateZ(10px);
  transition: all 0.3s ease;
}

.card:hover .card-content {
  transform: translateZ(30px);
}

.card-button {
  padding: 12px 30px;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
  transform: translateZ(10px);
  margin-top: auto;
}

.card-button:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: translateZ(30px) scale(1.05);
}

.card-glare {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 20px;
  overflow: hidden;
  pointer-events: none;
}

.card-glare::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transform: rotate(45deg);
  transition: all 0.5s ease;
  opacity: 0;
}

.card:hover .card-glare::after {
  opacity: 1;
  animation: glare 1.5s ease-in-out;
}

@keyframes glare {
  0% {
    transform: rotate(45deg) translate(-50%, -50%);
  }
  100% {
    transform: rotate(45deg) translate(50%, 50%);
  }
}

@media (max-width: 768px) {
  .card {
    width: 90%;
    height: 350px;
  }
  .cards-container {
    overflow: scroll;
  }
}

</style>