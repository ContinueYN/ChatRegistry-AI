<template>
  <div class="lottery-container">
    <div class="content">
      <div class="control-panel">
        <button class="back" @click="goBack()">返回</button>
        <h2 class="panel-title">抽奖设置</h2>
        
        <div class="input-group">
          <label for="start-number">起始号数</label>
          <input 
            type="number" 
            id="start-number" 
            min="1" 
            v-model.number="startNumber"
            @change="validateInputs"
          >
        </div>
        
        <div class="input-group">
          <label for="end-number">结束号数</label>
          <input 
            type="number" 
            id="end-number" 
            min="2" 
            v-model.number="endNumber"
            @change="validateInputs"
          >
        </div>
        
        <div class="input-group">
          <label for="draw-count">每次抽取数量</label>
          <input 
            type="number" 
            id="draw-count" 
            min="1" 
            max="20" 
            v-model.number="drawCount"
            @change="validateInputs"
          >
        </div>
        
        <div class="buttons">
          <button @click="startDraw" :disabled="isDrawing">开始抽奖</button>
          <button @click="reset">重置</button>
        </div>
        
        <div class="history">
          <h3>历史记录</h3>
          <div class="history-list">
            <div 
              v-for="(record, index) in recentHistory" 
              :key="index" 
              class="history-item"
            >
              <div class="record-time">{{ record.time }}</div>
              <div class="record-numbers">{{ record.numbers.join(', ') }}</div>
              <div class="record-prize" :class="getPrizeClass(record.prizeLevel)">
                {{ record.prizeLevel }} - {{ record.blessing }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="lottery-display">
        <div ref="threeContainer" class="three-container"></div>
        
        <!-- 祝福语显示区域 -->
        <div class="blessing-container" v-if="currentBlessing">
          <div class="blessing-text">{{ currentBlessing }}</div>
        </div>
        
        <div class="result-container">
          <div class="result">
            <div 
              v-for="(number, index) in currentResult" 
              :key="index" 
              class="result-number"
            >
              {{ number }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import * as THREE from 'three'
import { useRouter } from 'vue-router';
const router = useRouter();

const goBack = () => {
  router.push('/more')
}

// 响应式数据
const startNumber = ref<number>(1)
const endNumber = ref<number>(100)
const drawCount = ref<number>(5)
const history = ref<Array<{time: string, numbers: number[], prizeLevel: string, blessing: string}>>([])
const currentResult = ref<number[]>([])
const currentBlessing = ref<string>('')
const isDrawing = ref<boolean>(false)

// Three.js 相关引用
const threeContainer = ref<HTMLDivElement>()
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let sphere: THREE.Mesh
let animationFrameId: number

// 高考祝福语库
const blessings = {
  special: [
    "金榜题名，前程似锦！",
    "一举夺魁，宏图大展！",
    "状元及第，光耀门楣！",
    "独占鳌头，名题金榜！"
  ],
  first: [
    "进士及第，才华横溢！",
    "学有所成，未来可期！",
    "才华出众，必成大器！",
    "智慧超群，前程万里！"
  ],
  second: [
    "举人高中，稳步前行！",
    "勤学苦练，终有回报！",
    "踏实进取，未来光明！",
    "厚积薄发，指日可待！"
  ],
  third: [
    "秀才得意，继续努力！",
    "初露锋芒，再接再厉！",
    "基础扎实，稳步提升！",
    "小有成就，大有可为！"
  ],
  participation: [
    "参与可贵，重在积累！",
    "每一次尝试都是成长！",
    "坚持就是胜利！",
    "继续努力，未来可期！"
  ]
}

// 计算属性
const recentHistory = computed(() => 
  history.value.slice(Math.max(history.value.length - 5, 0))
)

// 根据号码确定奖项等级
const getPrizeLevel = (numbers: number[]): string => {
  const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  
  if (numbers.some(num => num === 100)) {
    return "特等奖";
  } else if (avg >= 90) {
    return "一等奖";
  } else if (avg >= 75) {
    return "二等奖";
  } else if (avg >= 60) {
    return "三等奖";
  } else {
    return "参与奖";
  }
}

// 获取对应祝福语
const getBlessing = (prizeLevel: string): string => {
  const blessingMap: {[key: string]: string[]} = {
    "特等奖": blessings.special,
    "一等奖": blessings.first,
    "二等奖": blessings.second,
    "三等奖": blessings.third,
    "参与奖": blessings.participation
  };
  
  const availableBlessings = blessingMap[prizeLevel] || blessings.participation;
  return availableBlessings[Math.floor(Math.random() * availableBlessings.length)];
}

// 获取奖项等级对应的CSS类名
const getPrizeClass = (prizeLevel: string): string => {
  const classMap: {[key: string]: string} = {
    "特等奖": "prize-special",
    "一等奖": "prize-first",
    "二等奖": "prize-second",
    "三等奖": "prize-third",
    "参与奖": "prize-participation"
  };
  
  return classMap[prizeLevel] || "prize-participation";
}

// 初始化 Three.js 场景
const initThreeJS = () => {
  if (!threeContainer.value) return

  // 创建场景 - 改为透明背景
  scene = new THREE.Scene()
  scene.background = null  // 保持透明，显示底层渐变背景
  
  // 移除雾效或改为浅色雾效
  // scene.fog = new THREE.Fog(0xE6F3FF, 10, 30)  // 可选：浅蓝色雾效
  
  // 创建相机
  const containerWidth = threeContainer.value.offsetWidth
  const containerHeight = threeContainer.value.offsetHeight
  camera = new THREE.PerspectiveCamera(75, containerWidth / containerHeight, 0.1, 1000)
  camera.position.z = 15
  
  // 创建渲染器 - 确保透明
  renderer = new THREE.WebGLRenderer({ 
    antialias: true, 
    alpha: true 
  })
  renderer.setSize(containerWidth, containerHeight)
  renderer.setClearColor(0x000000, 0) // 透明背景
  threeContainer.value.appendChild(renderer.domElement)
  
  // 修改光源为柔和白光
  const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.8)  // 更亮的环境光
  scene.add(ambientLight)
  
  const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.6)  // 白色定向光
  directionalLight.position.set(5, 5, 5)
  scene.add(directionalLight)
  
  // 可选：添加补光
  const fillLight = new THREE.DirectionalLight(0xE6F3FF, 0.3)  // 浅蓝色补光
  fillLight.position.set(-5, -5, 5)
  scene.add(fillLight)
  
  // 修改球体材质为浅色透明
    const geometry = new THREE.SphereGeometry(5, 32, 32)
    const material = new THREE.MeshPhongMaterial({
        color: 0xB0E2FF,           // 浅钢蓝色
        emissive: 0x1E90FF,        // 道奇蓝发光
        specular: 0xFFFFFF,        // 白色高光
        shininess: 120,            // 更高光泽度
        wireframe: true,
        transparent: true,
        opacity: 0.8
    })
  
  sphere = new THREE.Mesh(geometry, material)
  scene.add(sphere)
  
  // 开始动画循环
  animate()
}

// 动画循环
const animate = () => {
  animationFrameId = requestAnimationFrame(animate)
  
  // 旋转球体
  if (sphere) {
    sphere.rotation.x += 0.005
    sphere.rotation.y += 0.008
  }
  
  renderer.render(scene, camera)
}

// 窗口大小调整处理
const onWindowResize = () => {
  if (!threeContainer.value || !camera || !renderer) return
  
  const containerWidth = threeContainer.value.offsetWidth
  const containerHeight = threeContainer.value.offsetHeight
  
  camera.aspect = containerWidth / containerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(containerWidth, containerHeight)
}

// 生成随机数
const generateRandomNumbers = (): number[] => {
  const results: number[] = []
  const range = endNumber.value - startNumber.value + 1
  
  for (let i = 0; i < drawCount.value; i++) {
    const randomNum = Math.floor(Math.random() * range) + startNumber.value
    results.push(randomNum)
  }
  
  return results
}

// 显示结果
const displayResults = (results: number[]) => {
  currentResult.value = results
  const prizeLevel = getPrizeLevel(results)
  const blessing = getBlessing(prizeLevel)
  currentBlessing.value = blessing
  addToHistory(results, prizeLevel, blessing)
}

// 添加到历史记录
const addToHistory = (results: number[], prizeLevel: string, blessing: string) => {
  history.value.push({
    time: new Date().toLocaleTimeString(),
    numbers: [...results],
    prizeLevel,
    blessing
  })
}

// 创建粒子爆炸效果
const createParticleEffect = () => {
  const particleCount = 200
  const particles = new THREE.Group()
  
  for (let i = 0; i < particleCount; i++) {
    const size = Math.random() * 0.2 + 0.05
    const geometry = new THREE.SphereGeometry(size, 16, 16)
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(Math.random() * 0xffffff)
    })
    
    const particle = new THREE.Mesh(geometry, material)
    
    // 设置初始位置
    particle.position.set(0, 0, 0)
    
    // 设置随机速度和方向
    particle.userData = {
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2,
        (Math.random() - 0.5) * 0.2
      )
    }
    
    particles.add(particle)
  }
  
  particles.name = 'particles'
  scene.add(particles)
  
  // 动画粒子
  const animateParticles = () => {
    particles.children.forEach(particle => {
      const mesh = particle as THREE.Mesh
      const material = mesh.material as THREE.MeshBasicMaterial
      
      mesh.position.add(mesh.userData.velocity)
      material.opacity -= 0.01
      
      if (material.opacity <= 0 && particles.parent) {
        scene.remove(particles)
        return
      }
    })
    
    if (particles.parent) {
      requestAnimationFrame(animateParticles)
    }
  }
  
  animateParticles()
}

// 开始抽奖
const startDraw = () => {
  if (!validateInputs()) return
  
  isDrawing.value = true
  currentResult.value = []
  currentBlessing.value = ''
  
  // 创建粒子爆炸效果
  createParticleEffect()
  
  // 稍后显示结果
  setTimeout(() => {
    const results = generateRandomNumbers()
    displayResults(results)
    isDrawing.value = false
  }, 2000)
}

// 重置
const reset = () => {
  history.value = []
  currentResult.value = []
  currentBlessing.value = ''
  startNumber.value = 1
  endNumber.value = 100
  drawCount.value = 5
}

// 验证输入
const validateInputs = (): boolean => {
  if (isNaN(startNumber.value) || isNaN(endNumber.value) || isNaN(drawCount.value)) {
    alert('请输入有效的数字')
    return false
  }
  
  if (startNumber.value >= endNumber.value) {
    alert('结束号数必须大于起始号数')
    return false
  }
  
  if (drawCount.value < 1) {
    alert('每次抽取数量至少为1')
    return false
  }
  
  return true
}

// 生命周期
onMounted(() => {
  initThreeJS()
  window.addEventListener('resize', onWindowResize)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', onWindowResize)
  
  if (renderer) {
    renderer.dispose()
  }
})
</script>

<style scoped>
.lottery-container {
  background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%,rgba(102, 226, 207,0.4) 50%, rgba(243, 250, 107, 0.7) 100%);
  border-radius: 20px;
  min-height: 90vh;
  min-width: 80vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  color: #fff;
  padding: 20px;
}

.subtitle {
  font-size: 1.2rem;
  opacity: 0.8;
}

.content {
  display: flex;
  width: 100%;
  gap: 30px;
  flex-wrap: wrap;
  justify-content: center;
}

.control-panel {
  border-radius: 20px;
  padding: 30px;
  width: 100%;
  max-width: 400px;
  animation: slideInLeft 1s ease;
}

.lottery-display {
  flex: 1;
  min-width: 500px;
  min-height: 500px;
  position: relative;
  animation: slideInRight 1s ease;
}

.three-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

/* 祝福语容器样式 */
.blessing-container {
  position: absolute;
  top: 20px;
  left: 0;
  width: 100%;
  text-align: center;
  z-index: 20;
}

.blessing-text {
  font-size: 1.8rem;
  font-weight: bold;
  color: #ffeb3b;
  text-shadow: 0 0 10px rgba(255, 215, 0, 0.8),
               0 0 20px rgba(255, 165, 0, 0.6),
               0 0 30px rgba(255, 69, 0, 0.4);
  background: rgba(0, 0, 0, 0.3);
  padding: 15px 30px;
  border-radius: 50px;
  display: inline-block;
  animation: blessingPulse 2s infinite;
}

@keyframes blessingPulse {
  0% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.9; }
}

.result-container {
  position: absolute;
  bottom: 20px;
  left: 0;
  width: 100%;
  text-align: center;
  z-index: 20;
}

.result {
  font-size: 2.5rem;
  font-weight: bold;
  color: #4f84da;
  text-shadow: 0 0 10px rgba(123, 0, 255, 0.7);
  margin-top: 20px;
  min-height: 100px;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 15px;
}

.result-number {
  background: rgba(0, 0, 0, 0);
  border: 2px solid #00ffff25;
  border-radius: 50%;
  width: 70px;
  height: 70px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 2rem;
  box-shadow: 0 0 15px rgba(0, 149, 255, 0.237);
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); box-shadow: 0 0 10px rgba(0, 47, 255, 0.231); }
  50% { transform: scale(1.1); box-shadow: 0 0 20px rgba(0, 38, 255, 0.32); }
  100% { transform: scale(1); box-shadow: 0 0 10px rgba(93, 0, 255, 0.18); }
}

.panel-title {
    text-align: center;
    font-size: 30px;
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
}

.input-group {
  margin-bottom: 25px;
}

label {
  display: block;
  margin-bottom: 10px;
  font-size: 1.1rem;
  color: #ffffff;
}

input {
  width: 100%;
  padding: 15px;
  border-radius: 10px;
  border: 2px solid #00ffff84;
  background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%,rgba(102, 226, 207,0.4) 50%, rgba(234, 239, 134, 0.315) 100%);
  color: white;
  font-size: 1.2rem;
  outline: none;
  transition: all 0.3s;
}

input:focus {
  border-color: #f5f4ac;
  box-shadow: 0 0 15px rgba(251, 255, 0, 0.5);
}

.buttons {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

button {
  flex: 1;
  padding: 15px;
  border: none;
  border-radius: 10px;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
}

button:first-child {
  background: linear-gradient(135deg, #66ead6 0%, #f7f978 100%);
  color: white;
}

button:last-child {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e1e5e9;
}

button:last-child {
  position: relative;
  overflow: hidden;
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e1e5e9;
  z-index: 1;
}

button:last-child::before {
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

button:last-child:hover::before {
  left: 100%;
}

button:last-child:hover {
  background: #e9ecef;
  border-color: #66ead6;
}

button:hover:not(:disabled) {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.history {
  margin-top: 30px;
  background: rgba(157, 244, 218, 0.146);
  border-radius: 15px;
  padding: 20px;
  max-height: 200px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: rgba(76, 162, 175, 0.6) rgba(0, 0, 0, 0.1);
}

.history h3 {
    text-align: center;
    font-size: 20px;
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
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  background: rgba(0, 150, 255, 0.2);
  padding: 12px 15px;
  border-radius: 15px;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.record-time {
  font-size: 0.8rem;
  opacity: 0.8;
}

.record-numbers {
  font-weight: bold;
  color: #b0e2ff;
}

.record-prize {
  font-size: 0.85rem;
  padding: 3px 8px;
  border-radius: 10px;
  display: inline-block;
  width: fit-content;
}

/* 奖项等级样式 */
.prize-special {
  background: linear-gradient(135deg, #ffd700, #ff8c00);
  color: #8b0000;
  font-weight: bold;
}

.prize-first {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
  color: #2f4f4f;
  font-weight: bold;
}

.prize-second {
  background: linear-gradient(135deg, #cd7f32, #8b4513);
  color: #fff8dc;
  font-weight: bold;
}

.prize-third {
  background: linear-gradient(135deg, #87ceeb, #4682b4);
  color: white;
}

.prize-participation {
  background: linear-gradient(135deg, #98fb98, #32cd32);
  color: #006400;
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInLeft {
  from { transform: translateX(-100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(100px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 1000px) {
  .content {
    flex-direction: column;
    align-items: center;
  }
  
  .lottery-display {
    min-width: 400px;
    min-height: 400px;
  }
  
  .blessing-text {
    font-size: 1.5rem;
    padding: 12px 25px;
  }
}

@media (max-width: 500px) {
  .lottery-display {
    min-width: 300px;
    min-height: 300px;
  }
  
  h1 {
    font-size: 2.2rem;
  }
  
  .result-number {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
  
  .blessing-text {
    font-size: 1.2rem;
    padding: 10px 20px;
  }
}

.back{
    min-width: 120px;
    font-size: 15px;
    text-align: center;
    display: block;
    margin: 0 auto 20px;
    padding: 10px 20px;
    color: white;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.3s;
}

.back:hover {
    background: rgba(255, 255, 255, 0.3);
}
</style>