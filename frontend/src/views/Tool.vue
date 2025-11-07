<template>
  <div class="container">
    <header>
      <h1>Vue3 图片水印添加器</h1>
      <p class="subtitle">上传图片，添加自定义水印，支持单水印和平铺模式</p>
    </header>

    <div class="app-content">
      <!-- 控制面板 -->
      <div class="controls">
        <div class="control-layout">
          <div class="control-group">
            <h2>图片上传</h2>
            <input type="file" id="fileInput" @change="handleImageUpload" accept="image/*" style="display: none;">
            <button class="upload-btn" @click="triggerFileInput">选择图片</button>
          </div>

          <div class="control-group">
            <h2>水印模式</h2>
            <div class="mode-controls">
              <div class="mode-btn" :class="{ active: watermark.mode === 'single' }" @click="watermark.mode = 'single'">
                单水印
              </div>
              <div class="mode-btn" :class="{ active: watermark.mode === 'tile' }" @click="watermark.mode = 'tile'">
                平铺水印
              </div>
              <div class="mode-btn"  @click="goToHome()">
                返回首页
              </div>
            </div>
          </div>
        </div>

        <div class="control-layout">
          <div class="control-group">
            <h2>水印设置</h2>
            <label for="watermarkText">水印文本</label>
            <input type="text" id="watermarkText" v-model="watermark.text" placeholder="输入水印文本">

            <label for="fontFamily">字体</label>
            <select id="fontFamily" v-model="watermark.fontFamily">
              <option value="Arial">Arial</option>
              <option value="Verdana">Verdana</option>
              <option value="Microsoft YaHei">微软雅黑</option>
              <option value="SimHei">黑体</option>
            </select>

            <label for="fontSize">
              字体大小: <span class="range-value">{{ watermark.fontSize }}px</span>
            </label>
            <input type="range" id="fontSize" v-model.number="watermark.fontSize" min="10" max="60" step="1">

            <label for="color">颜色</label>
            <input type="color" id="color" v-model="watermark.color">

            <label for="opacity">
              透明度: <span class="range-value">{{ watermark.opacity }}</span>
            </label>
            <input type="range" id="opacity" v-model.number="watermark.opacity" min="0.1" max="1" step="0.1">

            <label for="rotation">
              旋转角度: <span class="range-value">{{ watermark.rotation }}°</span>
            </label>
            <input type="range" id="rotation" v-model.number="watermark.rotation" min="0" max="360" step="1">
          </div>
        </div>

        <div class="control-layout">
          <div class="control-group" v-if="watermark.mode === 'single'">
            <h2>水印位置</h2>
            <div class="position-controls">
              <div v-for="position in positionOptions" :key="position.value" class="position-btn"
                :class="{ active: watermark.position === position.value }" @click="watermark.position = position.value">
                {{ position.label }}
              </div>
            </div>
          </div>

          <div class="control-group" v-if="watermark.mode === 'tile'">
            <h2>平铺设置</h2>
            <div class="tile-controls">
              <label for="tileSpacingX">
                水平间距: <span class="range-value">{{ watermark.tileSpacingX }}px</span>
              </label>
              <input type="range" id="tileSpacingX" v-model.number="watermark.tileSpacingX" min="20" max="200" step="5">

              <label for="tileSpacingY">
                垂直间距: <span class="range-value">{{ watermark.tileSpacingY }}px</span>
              </label>
              <input type="range" id="tileSpacingY" v-model.number="watermark.tileSpacingY" min="20" max="200" step="5">
            </div>
          </div>

          <div class="button-group">
            <button class="download-btn" @click="downloadImage" :disabled="!imageSrc">
              下载图片
            </button>
            <button class="reset-btn" @click="resetWatermark">重置设置</button>
          </div>
        </div>
      </div>

      <!-- 预览区域 -->
      <div class="preview">
        <h2>预览效果</h2>
        <div class="preview-container">
          <div v-if="!imageSrc" class="upload-placeholder">
            <i>📷</i>
            <p>请上传图片以添加水印</p>
          </div>
          <img v-else :src="imageSrc" id="previewImage" alt="预览图片">
          <canvas class="watermark-canvas" ref="watermarkCanvas"></canvas>
        </div>
        <div v-if="imageSrc" class="preview-info">
          <p>当前模式: <strong>{{ watermark.mode === 'single' ? '单水印' : '平铺水印' }}</strong></p>
          <p v-if="watermark.mode === 'single'">
            位置: <strong>{{ getPositionText(watermark.position) }}</strong>
          </p>
          <p v-else>
            平铺间距: <strong>{{ watermark.tileSpacingX }}px × {{ watermark.tileSpacingY }}px</strong>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, nextTick } from 'vue'
import type { WatermarkConfig, WatermarkPosition } from '@/types'
import { useRouter } from 'vue-router';

const router = useRouter();

const goToHome = () => {
  router.push('/')
}

// 响应式数据
const imageSrc = ref<string>('')
const watermarkCanvas = ref<HTMLCanvasElement | null>(null)

// 水印配置
const watermark = reactive<WatermarkConfig>({
  mode: 'single',
  text: '示例水印',
  fontFamily: 'Microsoft YaHei',
  fontSize: 24,
  color: '#ffffff',
  opacity: 0.7,
  rotation: -15,
  position: 'bottom-right',
  tileSpacingX: 100,
  tileSpacingY: 100
})

// 位置选项
const positionOptions = [
  { value: 'top-left', label: '左上' },
  { value: 'top-center', label: '中上' },
  { value: 'top-right', label: '右下' },
  { value: 'center-left', label: '左中' },
  { value: 'center', label: '中心' },
  { value: 'center-right', label: '右中' },
  { value: 'bottom-left', label: '左下' },
  { value: 'bottom-center', label: '中下' },
  { value: 'bottom-right', label: '右下' }
] as const

// 获取位置文本
const getPositionText = (position: WatermarkPosition): string => {
  const positionMap: Record<WatermarkPosition, string> = {
    'top-left': '左上',
    'top-center': '中上',
    'top-right': '右上',
    'center-left': '左中',
    'center': '中心',
    'center-right': '右中',
    'bottom-left': '左下',
    'bottom-center': '中下',
    'bottom-right': '右下'
  }
  return positionMap[position]
}

// 触发文件输入
const triggerFileInput = (): void => {
  const fileInput = document.getElementById('fileInput') as HTMLInputElement
  fileInput?.click()
}

// 处理图片上传
const handleImageUpload = (event: Event): void => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      imageSrc.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

// 绘制水印
const drawWatermark = (): void => {
  if (!imageSrc.value || !watermarkCanvas.value) return

  const canvas = watermarkCanvas.value
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  
  img.onload = () => {
    // 设置canvas尺寸与图片一致
    canvas.width = img.width
    canvas.height = img.height
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // 设置水印样式
    ctx.font = `${watermark.fontSize}px ${watermark.fontFamily}`
    ctx.fillStyle = watermark.color
    ctx.globalAlpha = watermark.opacity
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    if (watermark.mode === 'single') {
      drawSingleWatermark(ctx, canvas.width, canvas.height)
    } else {
      drawTiledWatermark(ctx, canvas.width, canvas.height)
    }
  }
  
  img.src = imageSrc.value
}

// 绘制单水印
const drawSingleWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  let x: number, y: number
  const padding = 20
  
  switch(watermark.position) {
    case 'top-left':
      x = padding
      y = padding
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      break
    case 'top-center':
      x = width / 2
      y = padding
      ctx.textBaseline = 'top'
      break
    case 'top-right':
      x = width - padding
      y = padding
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      break
    case 'center-left':
      x = padding
      y = height / 2
      ctx.textAlign = 'left'
      break
    case 'center':
      x = width / 2
      y = height / 2
      break
    case 'center-right':
      x = width - padding
      y = height / 2
      ctx.textAlign = 'right'
      break
    case 'bottom-left':
      x = padding
      y = height - padding
      ctx.textAlign = 'left'
      ctx.textBaseline = 'bottom'
      break
    case 'bottom-center':
      x = width / 2
      y = height - padding
      ctx.textBaseline = 'bottom'
      break
    case 'bottom-right':
      x = width - padding
      y = height - padding
      ctx.textAlign = 'right'
      ctx.textBaseline = 'bottom'
      break
  }
  
  // 应用旋转
  ctx.save()
  ctx.translate(x, y)
  ctx.rotate(watermark.rotation * Math.PI / 180)
  ctx.fillText(watermark.text, 0, 0)
  ctx.restore()
}

// 绘制平铺水印
const drawTiledWatermark = (ctx: CanvasRenderingContext2D, width: number, height: number): void => {
  const textWidth = ctx.measureText(watermark.text).width
  const textHeight = watermark.fontSize
  
  // 计算每个水印单元的大小（包括间距）
  const unitWidth = textWidth + watermark.tileSpacingX
  const unitHeight = textHeight + watermark.tileSpacingY
  
  // 计算需要绘制的水印数量
  const cols = Math.ceil(width / unitWidth) + 1
  const rows = Math.ceil(height / unitHeight) + 1
  
  // 平铺绘制水印
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const x = j * unitWidth
      const y = i * unitHeight
      
      // 交错排列，使平铺更自然
      const offsetX = (i % 2) * (unitWidth / 2)
      
      ctx.save()
      ctx.translate(x + offsetX, y)
      ctx.rotate(watermark.rotation * Math.PI / 180)
      ctx.fillText(watermark.text, 0, 0)
      ctx.restore()
    }
  }
}

// 下载图片
const downloadImage = (): void => {
  if (!imageSrc.value) return
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const img = new Image()
  
  img.onload = () => {
    canvas.width = img.width
    canvas.height = img.height
    
    // 绘制原始图片
    ctx.drawImage(img, 0, 0)
    
    // 设置水印样式
    ctx.font = `${watermark.fontSize}px ${watermark.fontFamily}`
    ctx.fillStyle = watermark.color
    ctx.globalAlpha = watermark.opacity
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    if (watermark.mode === 'single') {
      drawSingleWatermark(ctx, canvas.width, canvas.height)
    } else {
      drawTiledWatermark(ctx, canvas.width, canvas.height)
    }
    
    // 创建下载链接
    const link = document.createElement('a')
    link.download = 'watermarked-image.png'
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  
  img.src = imageSrc.value
}

// 重置水印设置
const resetWatermark = (): void => {
  Object.assign(watermark, {
    mode: 'single',
    text: '示例水印',
    fontFamily: 'Microsoft YaHei',
    fontSize: 24,
    color: '#ffffff',
    opacity: 0.7,
    rotation: -15,
    position: 'bottom-right',
    tileSpacingX: 100,
    tileSpacingY: 100
  })
}

// 监听水印设置变化，实时更新预览
watch(watermark, () => {
  drawWatermark()
}, { deep: true })

// 监听图片变化，更新水印
watch(imageSrc, () => {
  if (imageSrc.value) {
    nextTick(() => {
      drawWatermark()
    })
  }
})

onMounted(() => {
  // 初始化水印
  drawWatermark()
})
</script>

<style scoped>
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body {
    background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    min-height: 100vh;
    padding: 20px;
    display: flex;
    justify-content: center;
    align-items: center;
}

.container {
    max-width: 1400px;
    width: 100%;
    background: linear-gradient(135deg, rgba(0,0,0,0.2) 0%,rgba(102, 226, 207,0.4) 50%, rgba(243, 250, 107, 0.7) 100%);
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

header {
    text-align: center;
    padding: 30px 20px 10px;
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

.control-layout {
  min-width: 100px;
  display: flex;
  gap: 40px;
  flex-wrap: wrap;
  margin-bottom: 20px;
  margin-left: 10px;
  margin-right: auto;
  flex-direction: column;
}

.subtitle {
    font-size: 16px;
    opacity: 0.8;
}

.app-content {
    display: flex;
    flex-wrap: wrap;
    padding: 20px;
    gap: 20px;
    flex-direction: row-reverse;
}

.controls {
    display: flex;
    flex:auto;
    min-width: 350px;
    padding: 20px;
    background: linear-gradient(135deg, rgba(255, 254, 254, 0.2) 0%,rgba(247, 247, 247, 0.4) 100%);
    border-radius: 10px;
}

.preview {
    flex: 2;
    min-width: 500px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}

.control-group {
    margin-bottom: 20px;
}

h2 {
    font-size: 18px;
    margin-bottom: 15px;
    color: #2c3e50;
    border-bottom: 1px solid #eaeaea;
    padding-bottom: 8px;
}

label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
    color: #34495e;
}

input,
select {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
    font-size: 14px;
}

input[type="color"] {
    height: 40px;
    padding: 3px;
}

input[type="range"] {
    padding: 0;
}

.range-value {
    display: inline-block;
    width: 40px;
    text-align: center;
    margin-left: 10px;
}

.button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

button {
    flex: 1;
    padding: 12px;
    border: none;
    border-radius: 5px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
}

.upload-btn {
    background: #3498db;
    color: white;
}

.download-btn {
    background: #2ecc71;
    color: white;
}

.reset-btn {
    background: #e74c3c;
    color: white;
}

button:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

button:disabled {
    background: #bdc3c7;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
}

.preview-container {
    width: 100%;
    max-width: 800px;
    border: 1px solid #eaeaea;
    border-radius: 10px;
    overflow: hidden;
    position: relative;
    background: linear-gradient(135deg, rgba(255, 254, 254, 0.2) 0%, rgba(244, 245, 247, 0.381) 100%);
    min-height: 400px;
    display: flex;
    justify-content: center;
    align-items: center;
}

#previewImage {
    max-width: 100%;
    max-height: 500px;
    display: block;
}

.watermark-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
}

.upload-placeholder {
    text-align: center;
    color: #7f8c8d;
    padding: 40px;
}

.upload-placeholder i {
    font-size: 48px;
    margin-bottom: 15px;
    display: block;
    color: #bdc3c7;
}

.position-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 5px;
    margin-top: 10px;
}

.position-btn {
    padding: 10px;
    background: #ecf0f1;
    border: 1px solid #bdc3c7;
    border-radius: 5px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
}

.position-btn.active {
    background: #3498db;
    color: white;
    border-color: #2980b9;
}

.position-btn:hover {
    background: #d5dbdb;
}

.position-btn.active:hover {
    background: #2980b9;
}

.mode-controls {
    padding: auto;
    margin-top: 10px;
}

.mode-btn {
    flex: 1;
    padding: 10px;
    background: #ecf0f1;
    border: 1px solid #bdc3c7;
    border-radius: 5px;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 20px;
}

.mode-btn.active {
    background: #9b59b6;
    color: white;
    border-color: #8e44ad;
}

.mode-btn:hover {
    background: #d5dbdb;
}

.mode-btn.active:hover {
    background: #8e44ad;
}

.tile-controls {
    margin-top: 15px;
    padding: 15px;
    background: #e8f4fc;
    border-radius: 8px;
    border-left: 4px solid #3498db;
}

@media (max-width: 768px) {
    .app-content {
        flex-direction: column;
    }

    .controls,
    .preview {
        min-width: 100%;
    }
}
</style>