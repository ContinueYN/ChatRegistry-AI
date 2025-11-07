<template>
  <div v-if="show" class="modal-overlay" @click="close">
    <div class="modal-content" @click.stop>
      <h3>填写其他兴趣爱好</h3>
      <textarea 
        v-model="tempHobby" 
        placeholder="请输入您的其他兴趣爱好..." 
        rows="4" 
        class="modal-textarea"
        ref="textareaRef"
      ></textarea>
      <div class="modal-actions">
        <button @click="save" class="btn primary">保存</button>
        <button @click="close" class="btn secondary">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { type Props, type Emits } from '@/types'

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tempHobby = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

// 监听显示状态，显示时自动聚焦
watch(() => props.show, (newVal) => {
  if (newVal) {
    tempHobby.value = props.currentValue
    nextTick(() => {
      textareaRef.value?.focus()
    })
  }
})

const save = () => {
  emit('save', tempHobby.value)
  emit('update:show', false)
}

const close = () => {
  emit('update:show', false)
}
</script>

<style scoped>
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
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  width: 90%;
  max-width: 500px;
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #333;
  text-align: center;
}

.modal-textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #7fdbf3;
  border-radius: 6px;
  font-size: 1rem;
  margin-bottom: 20px;
  resize: vertical;
  min-height: 100px;
}

.modal-textarea:focus {
  outline: none;
  border-color: #ffff76;
}

.modal-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.modal-actions .btn {
  min-width: 100px;
}

.btn {
  padding: 12px 24px;
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

.btn.secondary {
  background: #f8f9fa;
  color: #333;
  border: 2px solid #e1e5e9;
}

.btn.secondary:hover {
  background: #e9ecef;
}
</style>