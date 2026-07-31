<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'
import { dialogState, confirmResult } from '../../composables/useDialog'

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && dialogState.visible) {
    confirmResult(dialogState.type === 'confirm' ? false : null)
  }
}

watch(() => dialogState.visible, (v) => {
  if (v) {
    document.addEventListener('keydown', handleKeydown)
  } else {
    document.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Transition name="modal">
    <div v-if="dialogState.visible" class="modal-overlay" @click.self="confirmResult(false)">
      <div class="modal-card">
        <div class="modal-header">
          <h3>{{ dialogState.title }}</h3>
        </div>

        <!-- Confirm 模式 -->
        <template v-if="dialogState.type === 'confirm'">
          <div class="modal-body">
            <p>{{ dialogState.message }}</p>
          </div>
          <div class="modal-footer">
            <button class="secondary" @click="confirmResult(false)">取消</button>
            <button class="danger" @click="confirmResult(true)">确认</button>
          </div>
        </template>

        <!-- Prompt 模式 -->
        <template v-if="dialogState.type === 'prompt'">
          <div class="modal-body">
            <input
              v-model="dialogState.inputValue"
              :placeholder="dialogState.inputPlaceholder"
              class="prompt-input"
              autofocus
              @keyup.enter="confirmResult(dialogState.inputValue)"
            />
          </div>
          <div class="modal-footer">
            <button class="secondary" @click="confirmResult(null)">取消</button>
            <button @click="confirmResult(dialogState.inputValue)">确认</button>
          </div>
        </template>
      </div>
    </div>
  </Transition>
</template>

<style>
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.modal-card {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 420px;
  overflow: hidden;
}

.modal-header {
  padding: 20px 24px 0;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-body {
  padding: 16px 24px 20px;
}

.modal-body p {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.92rem;
  line-height: 1.6;
}

.modal-footer {
  padding: 0 24px 20px;
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.prompt-input {
  width: 100%;
  box-sizing: border-box;
}

/* Transition */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}
.modal-enter-active .modal-card,
.modal-leave-active .modal-card {
  transition: transform 0.2s ease;
}
.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-card {
  transform: scale(0.95) translateY(8px);
}
.modal-leave-to .modal-card {
  transform: scale(0.95) translateY(8px);
}
</style>
