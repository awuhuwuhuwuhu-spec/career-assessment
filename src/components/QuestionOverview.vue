<template>
  <el-drawer
    v-model="visible"
    title="答题概览"
    direction="rtl"
    size="400px"
    :close-on-click-modal="true"
  >
    <div class="overview-container">
      <!-- 统计信息 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">{{ answeredCount }}</div>
          <div class="stat-label">已答题</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ unansweredCount }}</div>
          <div class="stat-label">未答题</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">{{ progressPercentage }}%</div>
          <div class="stat-label">完成度</div>
        </div>
      </div>

      <!-- 题目网格 -->
      <div class="questions-grid">
        <div
          v-for="(question, index) in questions"
          :key="question.id"
          class="question-item"
          :class="{
            'answered': isAnswered(question.id),
            'current': index === currentIndex
          }"
          @click="jumpToQuestion(index)"
        >
          <div class="question-number">{{ index + 1 }}</div>
          <div class="question-status">
            <el-icon v-if="isAnswered(question.id)" class="check-icon">
              <CircleCheck />
            </el-icon>
          </div>
        </div>
      </div>

      <!-- 提示信息 -->
      <div class="tip-section">
        <el-icon class="tip-icon"><InfoFilled /></el-icon>
        <span class="tip-text">点击题号可快速跳转到对应题目</span>
      </div>
    </div>
  </el-drawer>
</template>

<script setup>
import { computed, watch } from 'vue'
import { CircleCheck, InfoFilled } from '@element-plus/icons-vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  questions: {
    type: Array,
    required: true
  },
  answers: {
    type: Object,
    required: true
  },
  currentIndex: {
    type: Number,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'jump-to'])

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// 已答题数量
const answeredCount = computed(() => {
  return props.questions.filter(q => isAnswered(q.id)).length
})

// 未答题数量
const unansweredCount = computed(() => {
  return props.questions.length - answeredCount.value
})

// 完成度百分比
const progressPercentage = computed(() => {
  if (props.questions.length === 0) return 0
  return Math.round((answeredCount.value / props.questions.length) * 100)
})

// 判断题目是否已答
const isAnswered = (questionId) => {
  const answer = props.answers[questionId]
  return answer !== undefined && answer !== null
}

// 跳转到指定题目
const jumpToQuestion = (index) => {
  emit('jump-to', index)
  visible.value = false
}
</script>

<style scoped>
.overview-container {
  padding: 0 4px;
}

/* 统计卡片 */
.stats-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin-bottom: 4px;
  font-variant-numeric: tabular-nums;
}

.stat-label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
}

/* 题目网格 */
.questions-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.question-item {
  position: relative;
  aspect-ratio: 1;
  background: #f8fafc;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.question-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.question-item.answered {
  background: #f0fdf4;
  border-color: #22c55e;
}

.question-item.current {
  border-color: #4f46e5;
  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
}

.question-item.answered.current {
  background: #f0fdf4;
  border-color: #4f46e5;
}

.question-number {
  font-size: 16px;
  font-weight: 600;
  color: #64748b;
}

.question-item.answered .question-number {
  color: #22c55e;
}

.question-item.current .question-number {
  color: #4f46e5;
}

.question-status {
  position: absolute;
  top: 4px;
  right: 4px;
}

.check-icon {
  color: #22c55e;
  font-size: 16px;
}

/* 提示信息 */
.tip-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #fffbeb;
  border-radius: 12px;
  border: 1px solid #fef3c7;
}

.tip-icon {
  color: #f59e0b;
  font-size: 18px;
  flex-shrink: 0;
}

.tip-text {
  font-size: 13px;
  color: #92400e;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .questions-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .question-number {
    font-size: 14px;
  }

  .stats-card {
    padding: 20px 16px;
  }

  .stat-value {
    font-size: 24px;
  }
}
</style>
