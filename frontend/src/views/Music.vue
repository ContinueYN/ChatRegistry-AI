<template>
  <div class="music-player">
    <div class="player-container">
      <!-- 左侧专辑区域 -->
      <div class="album-section">
        <div class="album-container">
          <div class="album-cover" :class="{ playing: isPlaying }">
            <img :src="currentSong.cover" alt="专辑封面" />
            <div class="album-center"></div>
          </div>
          <div class="album-base"></div>
        </div>
        
        <!-- 音频可视化 -->
        <div class="visualizer">
          <div
            v-for="(height, index) in visualizerData"
            :key="index"
            class="bar"
            :style="{ height: height + '%' }"
          ></div>
        </div>
      </div>

      <!-- 右侧控制区域 -->
      <div class="control-section">
        <!-- 歌曲信息 -->
        <div class="song-info">
          <h2 class="song-title">{{ currentSong.title }}</h2>
          <p class="song-artist">{{ currentSong.artist }}</p>
        </div>

        <!-- 进度条 -->
        <div class="progress-container">
          <div class="progress-bar" @click="setProgress">
            <div class="progress" :style="{ width: progressPercent }">
              <div class="progress-handle"></div>
            </div>
          </div>
          <div class="time-display">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="controls">
          <button class="control-btn" @click="prevSong">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M6 6H8V18H6V6ZM9.5 12L18 18V6L9.5 12Z" fill="currentColor" />
            </svg>
          </button>
          <button class="control-btn play-btn" @click="togglePlay">
            <svg v-if="!isPlaying" width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M8 5V19L19 12L8 5Z" fill="currentColor" />
            </svg>
            <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M6 19H10V5H6V19ZM14 5V19H18V5H14Z" fill="currentColor" />
            </svg>
          </button>
          <button class="control-btn" @click="nextSong">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M6 18L14.5 12L6 6V18ZM16 6V18H18V6H16Z" fill="currentColor" />
            </svg>
          </button>
        </div>

        <!-- 返回首页按钮 -->
        <button class="home-btn" @click="goToHome">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/>
          </svg>
          回到首页
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import letMeKnow from '@/assets/audios/Let Me Know (热音原版).mp3';
import oneNight from '@/assets/audios/One Night In Shanghai.mp3';
import zaya from '@/assets/audios/Зая扎娅 (DJ版).mp3';

const router = useRouter();

// 回到首页
const goToHome = () => {
  router.push('/');
};


// 响应式数据
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(240); // 4分钟（秒）
const currentSongIndex = ref(0);

// 添加音频对象
const audio = ref(null);

const songs = ref([
  {
    title: 'Let Me Know (热音原版)',
    artist: 'DJ七七',
    cover: 'https://picsum.photos/400/400?random=1',
    src: letMeKnow 
  },
  {
    title: 'One Night In Shanghai',
    artist: '败家小女子、邓等等',
    cover: 'https://picsum.photos/400/400?random=2',
    src: oneNight
  },
  {
    title: 'Зая扎娅 (DJ版)',
    artist: '封茗囧菌',
    cover: 'https://picsum.photos/400/400?random=3',
    src: zaya
  },
]);

// 初始化音频
onMounted(() => {
  audio.value = new Audio();
  setupAudioEvents();
});

// 设置音频事件
const setupAudioEvents = () => {
  if (!audio.value) return;
  
  audio.value.addEventListener('loadedmetadata', () => {
    duration.value = audio.value.duration;
  });
  
  audio.value.addEventListener('timeupdate', () => {
    currentTime.value = audio.value.currentTime;
  });
  
  audio.value.addEventListener('ended', () => {
    nextSong();
  });
};

// 当前歌曲
const currentSong = computed(() => songs.value[currentSongIndex.value]);

// 进度条百分比
const progressPercent = computed(() => {
  return (currentTime.value / duration.value) * 100 + '%';
});

// 时间格式化
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// 播放/暂停
const togglePlay = () => {
  if (!audio.value) return;
  
  if (isPlaying.value) {
    audio.value.pause();
  } else {
    // 设置当前歌曲的音频源
    audio.value.src = currentSong.value.src;
    audio.value.play().catch(error => {
      console.error('播放失败:', error);
    });
  }
  isPlaying.value = !isPlaying.value;
};

// 切换歌曲函数
const prevSong = () => {
  currentSongIndex.value = 
    currentSongIndex.value > 0 ? currentSongIndex.value - 1 : songs.value.length - 1;
  switchSong();
};

const nextSong = () => {
  currentSongIndex.value = 
    currentSongIndex.value < songs.value.length - 1 ? currentSongIndex.value + 1 : 0;
  switchSong();
};

const switchSong = () => {
  if (!audio.value) return;
  
  audio.value.src = currentSong.value.src;
  currentTime.value = 0;
  
  if (isPlaying.value) {
    audio.value.play().catch(error => {
      console.error('播放失败:', error);
    });
  }
};

// 设置进度
const setProgress = (e) => {
  if (!audio.value) return;
  
  const progressBar = e.currentTarget;
  const clickX = e.offsetX;
  const width = progressBar.offsetWidth;
  const percent = clickX / width;
  
  const newTime = percent * duration.value;
  currentTime.value = newTime;
  audio.value.currentTime = newTime;
};

// 可视化数据
const visualizerData = ref([]);

// 初始化可视化
const initVisualizer = () => {
  visualizerData.value = Array.from({ length: 30 }, () => Math.random() * 80 + 10);
};

// 更新可视化
const updateVisualizer = () => {
  if (!isPlaying.value) return;

  visualizerData.value = visualizerData.value.map((value, index) => {
    const intensity = Math.sin(Date.now() * 0.01 + index) * 30 + 30;
    const change = (Math.random() - 0.5) * 40;
    let newValue = intensity + change;
    return Math.max(5, Math.min(95, newValue));
  });
};

// 模拟播放进度和可视化更新
onMounted(() => {
  initVisualizer();
  setInterval(() => {
    if (isPlaying.value) {
      if (currentTime.value < duration.value) {
        currentTime.value += 0.1;
      } else {
        nextSong();
      }
      updateVisualizer();
    }
  }, 100);
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}

.music-player {
  width: 100%;
  max-width: 900px;
  min-height: 500px;
  background: linear-gradient(135deg, rgba(245, 240, 104, 0.322) 0%,rgba(102, 226, 207,0.4) 50%, rgba(57, 57, 57, 0.7) 100%);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
  position: relative;
  overflow: hidden;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  color: #fff;
  margin: 20px auto;
}

.music-player::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(242, 238, 238, 0.15) 0%, transparent 70%);
  z-index: -1;
}

.player-container {
  display: flex;
  gap: 50px;
  align-items: center;
  height: 100%;
}

/* 左侧专辑区域 */
.album-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
}

.album-container {
  position: relative;
  width: 320px;
  height: 320px;
  perspective: 1000px;
}

.album-base {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  width: 240px;
  height: 40px;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  filter: blur(15px);
  z-index: -1;
}

.album-cover {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
  position: relative;
  transition: transform 0.3s ease;
}

.album-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.album-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: #1a1a2e;
  border-radius: 50%;
  border: 6px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.6);
}

.album-cover.playing {
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 右侧控制区域 */
.control-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 30px;
  min-width: 300px;
}

.song-info {
  text-align: center;
}

.song-title {
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.song-artist {
  font-size: 20px;
  color: rgba(255, 255, 255, 0.8);
}

.progress-container {
  margin: 20px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  position: relative;
  margin-bottom: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.progress-bar:hover {
  height: 10px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #4589e997, #a35ef7);
  border-radius: 4px;
  position: relative;
  transition: width 0.1s linear;
}

.progress-handle {
  position: absolute;
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 0 15px rgba(74, 69, 233, 0.8);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.progress-bar:hover .progress-handle {
  opacity: 1;
}

.time-display {
  display: flex;
  justify-content: space-between;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
}

.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 30px 0;
}

.control-btn {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: white;
  margin: 0 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
}

.control-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 12px 25px rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.15);
}

.control-btn:active {
  transform: translateY(-1px);
}

.play-btn {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #4589e997, #a35ef7);
  box-shadow: 0 15px 30px rgba(107, 69, 233, 0.5);
}

.play-btn:hover {
  background: linear-gradient(135deg, #4589e997, #a35ef7);
}

.visualizer {
  width: 100%;
  height: 120px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 6px;
  margin-top: 20px;
}

.bar {
  width: 8px;
  background: linear-gradient(135deg, #4589e997, #a35ef7);
  border-radius: 4px 4px 0 0;
  transition: height 0.2s ease;
}

/* 回到首页按钮 */
.home-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 25px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 20px;
}

.home-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .player-container {
    flex-direction: column;
    gap: 30px;
  }
  
  .music-player {
    max-width: 400px;
    padding: 30px 20px;
  }
  
  .album-container {
    width: 250px;
    height: 250px;
  }
  
  .song-title {
    font-size: 24px;
  }
  
  .control-section {
    min-width: auto;
    width: 100%;
  }
}
</style>