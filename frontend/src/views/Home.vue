<template>
  <div class="container">
    <h1>欢迎您体验我们的网站~</h1>
    <div class="card-grid">
      <div
        v-for="(card, index) in cards"
        :key="index"
        class="card"
      >
        <!-- 卡片内层容器（用于3D旋转） -->
        <div class="card-inner">
          <!-- 正面 -->
          <div class="card-face card-front shine-effect">
            <div class="card-icon">{{ card.frontIcon }}</div>
            <div class="card-title">{{ card.frontTitle }}</div>
            <div class="card-content">{{ card.frontContent }}</div>
          </div>

          <!-- 背面 -->
          <div class="card-face card-back">
            <div class="card-title">{{ card.backTitle }}</div>
            <div class="card-content">{{ card.backContent }}</div>
            <button class="card-button" @click="goToPage(card.route)">了解更多</button>
          </div>
        </div>
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
// 定义卡片数据（前后内容）
const cards = ref([
  {
    frontIcon: '💡',
    frontTitle: '用户注册',
    frontContent: '诚邀您参与我们的注册',
    backTitle: '免费注册',
    backContent: '我们提供独特的UI界面，缓解您的审美疲劳。',
    route: '/label'
  },
  {
    frontIcon: '🚀',
    frontTitle: '急速加印',
    frontContent: '体验急速的水印添加',
    backTitle: '添加水印',
    backContent: '通过先进的技术优化，确保您的图片加印流畅、下载迅速。',
    route: '/tool'
  },
  {
    frontIcon: '❤️',
    frontTitle: '纯爱音乐',
    frontContent: '以我为中心的音乐播放',
    backTitle: '为爱发电',
    backContent: '我们始终将用户体验放在首位，打造直观易用的交互界面。',
    route: '/music'
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

.card-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  width: 100%;
}

/* 卡片容器 */
.card {
  width: 300px;
  height: 400px;
  perspective: 1500px;
  cursor: pointer;
}

/* 卡片内层 - 实现3D翻转 */
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.3);
  border-radius: 15px;
}

.card:hover .card-inner {
  transform: rotateY(180deg);
}

/* 正面与背面共用样式 */
.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 15px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
  overflow: hidden;
}

/* 正面样式 */
.card-front {
  background: linear-gradient(135deg, #6b11cb98 0%, #2574fc5d 100%);
  color: white;
}

/* 背面样式 */
.card-back {
  background: linear-gradient(135deg, #ff758cb3 0%, #ff7eb48a 100%);
  color: white;
  transform: rotateY(180deg);
}

/* 图标 */
.card-icon {
  font-size: 60px;
  margin-bottom: 20px;
  text-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* 标题 */
.card-title {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 15px;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* 内容文本 */
.card-content {
  text-align: center;
  line-height: 1.6;
  font-size: 16px;
  padding: 0 15px;
}

/* 按钮 */
.card-button {
  margin-top: 25px;
  padding: 12px 30px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid white;
  color: white;
  border-radius: 50px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(5px);
}

.card-button:hover {
  background: white;
  color: #ff758c;
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
}

/* 光泽效果 */
.shine-effect::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: rgba(255, 255, 255, 0.1);
  transform: rotate(45deg);
  transition: all 0.6s ease;
  pointer-events: none;
}

.card:hover .shine-effect::before {
  transform: translate(50%, 50%) rotate(45deg);
}

@media (max-width: 768px) {
  .card {
    width: 90%;
    height: 350px;
  }
  .card-grid {
    overflow: scroll;
  }
}

</style>
